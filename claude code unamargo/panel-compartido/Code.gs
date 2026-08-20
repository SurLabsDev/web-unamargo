/**
 * UN AMARGO — Panel interno compartido
 * Backend: Google Apps Script + Google Sheets como base de datos.
 *
 * Cada pestaña de la planilla es una "tabla":
 *   Productos   → id, nombre, precio, costo, stock, minimo
 *   Ventas      → id, fecha, productoId, producto, cantidad, precioUnit, canal, cobro, nota
 *   Gastos      → id, fecha, categoria, monto, detalle
 *   Movimientos → id, fecha, tipo (ingreso/retiro), monto, detalle
 *
 * No hace falta tocar nada acá. Al abrir la app por primera vez se crean
 * las pestañas y se cargan los productos del catálogo automáticamente.
 */

var SHEET_DEFS = {
  Productos:   ['id', 'nombre', 'precio', 'costo', 'stock', 'minimo'],
  Ventas:      ['id', 'fecha', 'productoId', 'producto', 'cantidad', 'precioUnit', 'canal', 'cobro', 'nota'],
  Gastos:      ['id', 'fecha', 'categoria', 'monto', 'detalle'],
  Movimientos: ['id', 'fecha', 'tipo', 'monto', 'detalle'],
};

var SEED_PRODUCTS = [
  [1, 'Mate Ranchero de Algarrobo', 1990, 0, 0, 3],
  [2, 'Mate Camionero',              490, 0, 0, 3],
  [3, 'Combo Galleta',              1290, 0, 0, 3],
  [4, 'Torpedo de Cuero de Vaca',   2490, 0, 0, 3],
  [5, 'Matera Canasta de Ecocuero', 1790, 0, 0, 3],
  [6, 'Algarrobo Oscuro',           1990, 0, 0, 3],
  [7, 'Imperial de Algarrobo',      1990, 0, 0, 3],
  [8, 'Camionero Virola',            690, 0, 0, 3],
  [9, 'Matera Dividida',             990, 0, 0, 3],
];

/* ── ENTRADA WEB ── */

function doGet() {
  ensureSetup();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Un Amargo — Panel interno')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Punto de entrada único para el cliente. */
function apiCall(fn, args) {
  var API = {
    getState: getState,
    addSale: addSale,           deleteSale: deleteSale,
    addProduct: addProduct,     updateProduct: updateProduct, deleteProduct: deleteProduct,
    addExpense: addExpense,     deleteExpense: deleteExpense,
    addAdjustment: addAdjustment, deleteAdjustment: deleteAdjustment,
  };
  if (!API[fn]) throw new Error('Función desconocida: ' + fn);
  return API[fn].apply(null, args || []);
}

/* ── SETUP ── */

function ensureSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_DEFS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, SHEET_DEFS[name].length).setValues([SHEET_DEFS[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  var prod = ss.getSheetByName('Productos');
  if (prod.getLastRow() < 2) {
    prod.getRange(2, 1, SEED_PRODUCTS.length, SEED_PRODUCTS[0].length).setValues(SEED_PRODUCTS);
  }
  var hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hoja1 && ss.getSheets().length > 4) ss.deleteSheet(hoja1);
}

/* ── LECTURA ── */

function sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function readSheet(name) {
  var sh = sheet(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var headers = SHEET_DEFS[name];
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues()
    .filter(function (r) { return r[0] !== '' && r[0] !== null; })
    .map(function (r) {
      var o = {};
      headers.forEach(function (h, i) {
        var v = r[i];
        if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        o[h] = v;
      });
      return o;
    });
}

function getState() {
  ensureSetup();
  return {
    productos:   readSheet('Productos'),
    ventas:      readSheet('Ventas'),
    gastos:      readSheet('Gastos'),
    movimientos: readSheet('Movimientos'),
  };
}

/* ── HELPERS DE ESCRITURA ── */

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); // si dos personas guardan a la vez, se espera el turno
  try { return fn(); } finally { lock.releaseLock(); }
}

function nextId(name) {
  var rows = readSheet(name);
  var max = 0;
  rows.forEach(function (r) { if (Number(r.id) > max) max = Number(r.id); });
  return max + 1;
}

function findRow(name, id) {
  var sh = sheet(name);
  if (sh.getLastRow() < 2) return -1;
  var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function appendRow(name, obj) {
  var row = SHEET_DEFS[name].map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet(name).appendRow(row);
}

function deleteRowById(name, id) {
  var row = findRow(name, id);
  if (row > 0) sheet(name).deleteRow(row);
}

/* ── VENTAS ── */

function addSale(v) {
  return withLock(function () {
    var prodRow = findRow('Productos', v.productoId);
    if (prodRow < 0) throw new Error('El producto ya no existe. Actualizá la página.');
    var sh = sheet('Productos');
    var nombre = sh.getRange(prodRow, 2).getValue();
    var stock = Number(sh.getRange(prodRow, 5).getValue());
    appendRow('Ventas', {
      id: nextId('Ventas'), fecha: String(v.fecha), productoId: v.productoId, producto: nombre,
      cantidad: Number(v.cantidad), precioUnit: Number(v.precioUnit),
      canal: String(v.canal || ''), cobro: String(v.cobro || ''), nota: String(v.nota || ''),
    });
    sh.getRange(prodRow, 5).setValue(stock - Number(v.cantidad));
    return getState();
  });
}

function deleteSale(id) {
  return withLock(function () {
    var venta = readSheet('Ventas').filter(function (s) { return String(s.id) === String(id); })[0];
    if (venta) {
      var prodRow = findRow('Productos', venta.productoId);
      if (prodRow > 0) {
        var cell = sheet('Productos').getRange(prodRow, 5);
        cell.setValue(Number(cell.getValue()) + Number(venta.cantidad));
      }
      deleteRowById('Ventas', id);
    }
    return getState();
  });
}

/* ── PRODUCTOS ── */

function addProduct(p) {
  return withLock(function () {
    appendRow('Productos', {
      id: nextId('Productos'), nombre: String(p.nombre),
      precio: Number(p.precio) || 0, costo: Number(p.costo) || 0,
      stock: Number(p.stock) || 0, minimo: Number(p.minimo) || 0,
    });
    return getState();
  });
}

function updateProduct(id, campo, valor) {
  return withLock(function () {
    var cols = { nombre: 2, precio: 3, costo: 4, stock: 5, minimo: 6 };
    if (!cols[campo]) throw new Error('Campo no editable: ' + campo);
    var row = findRow('Productos', id);
    if (row > 0) {
      sheet('Productos').getRange(row, cols[campo]).setValue(campo === 'nombre' ? String(valor) : Number(valor) || 0);
    }
    return getState();
  });
}

function deleteProduct(id) {
  return withLock(function () {
    deleteRowById('Productos', id);
    return getState();
  });
}

/* ── GASTOS ── */

function addExpense(g) {
  return withLock(function () {
    appendRow('Gastos', {
      id: nextId('Gastos'), fecha: String(g.fecha),
      categoria: String(g.categoria), monto: Number(g.monto), detalle: String(g.detalle || ''),
    });
    return getState();
  });
}

function deleteExpense(id) {
  return withLock(function () {
    deleteRowById('Gastos', id);
    return getState();
  });
}

/* ── MOVIMIENTOS MANUALES ── */

function addAdjustment(m) {
  return withLock(function () {
    appendRow('Movimientos', {
      id: nextId('Movimientos'), fecha: String(m.fecha),
      tipo: m.tipo === 'ingreso' ? 'ingreso' : 'retiro',
      monto: Number(m.monto), detalle: String(m.detalle || ''),
    });
    return getState();
  });
}

function deleteAdjustment(id) {
  return withLock(function () {
    deleteRowById('Movimientos', id);
    return getState();
  });
}
