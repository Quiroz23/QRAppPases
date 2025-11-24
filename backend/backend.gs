// ==========================================
// ☁️ Google Apps Script - Backend
// Archivo de respaldo. Este código debe ir en:
// Extensiones > Apps Script (dentro de tu Google Sheet)
// ==========================================

// GET: obtiene registros filtrando por 'run' y 'sheet'
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const run = e.parameter.run;
  const sheetName = e.parameter.sheet;

  if (!run || !sheetName) {
    return errorResponse("Faltan parámetros 'run' o 'sheet'");
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return errorResponse(`La hoja '${sheetName}' no existe`);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();  // primer fila = cabeceras
  const indexRun = headers.indexOf('run');

  if (indexRun === -1) return errorResponse("La hoja no tiene columna 'run'");

  const result = data
    .filter(row => row[indexRun] === run)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// POST: agrega un nuevo registro en la hoja indicada (Historial o Justificaciones)
function doPost(e) {
  const sheetName = e.parameter.sheet;
  if (!sheetName) return errorResponse("Falta el parámetro 'sheet'");

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return errorResponse(`La hoja '${sheetName}' no existe`);

  const body = JSON.parse(e.postData.contents);
  const headers = sheet.getDataRange().getValues()[0];

  // Montamos la fila en orden de cabeceras, incluyendo fecha_justificacion si existe
  const newRow = headers.map(h => body[h] !== undefined ? body[h] : '');

  sheet.appendRow(newRow);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', added: newRow }))
    .setMimeType(ContentService.MimeType.JSON);
}

// PATCH: marca como justificado un registro existente
function doPatch(e) {
  const { run, fecha, hora, tipo, sheet: sheetName } = e.parameter;
  if (!run || !fecha || !hora || !tipo || !sheetName) {
    return errorResponse("Faltan parámetros clave (run, fecha, hora, tipo, sheet)");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return errorResponse(`La hoja '${sheetName}' no existe`);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const colRun = headers.indexOf('run');
  const colFecha = headers.indexOf('fecha');
  const colHora = headers.indexOf('hora');
  const colTipo = headers.indexOf('tipo');
  const colJustificado = headers.indexOf('justificado');

  const rowIndex = data.findIndex(row => 
    row[colRun] === run && 
    row[colFecha] === fecha && 
    row[colHora] === hora && 
    row[colTipo] === tipo
  );
  if (rowIndex < 0) return errorResponse('Registro no encontrado');

  const nuevoValor = JSON.parse(e.postData.contents).justificado || 'Sí';
  sheet.getRange(rowIndex+2, colJustificado+1).setValue(nuevoValor);

  return ContentService.createTextOutput(
    JSON.stringify({ updated: true })
  ).setMimeType(ContentService.MimeType.JSON);
}


// ========================
// ⚠️ Respuesta de error genérica
// ========================
function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}