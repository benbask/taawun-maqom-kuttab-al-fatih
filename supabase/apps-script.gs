/**
 * Google Apps Script webhook untuk menerima ekspor Ta'awun.
 *
 * Cara pakai:
 * 1. Buat Spreadsheet Google → ekstensi → Apps Script.
 * 2. Tempel kode ini, atur SPREADSHEET_ID dan WEBHOOK_SECRET di bawah.
 * 3. Deploy → New deployment → Web app,Execute as: Me, Who has access: Anyone.
 * 4. Salin URL /exec ke menu admin QRIS & Pengaturan → URL webhook Sheets.
 * 5. Isi secret yang sama pada menu tersebut.
 */

var SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET';
var WEBHOOK_SECRET = 'GANTI_DENGAN_RAHASIA';
var SHEET_NAME = 'Taawun';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (WEBHOOK_SECRET && body.secret !== WEBHOOK_SECRET) {
      return json_({ ok: false, error: 'Invalid secret' }, 403);
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.clear();

    var output = [];
    if (body.headers && body.headers.length) output.push(body.headers);
    (body.rows || []).forEach(function (row) {
      output.push(row.map(function (value) {
        return value === null || value === undefined ? '' : value;
      }));
    });

    if (output.length) {
      sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
      sheet.setFrozenRows(1);
      var headerRange = sheet.getRange(1, 1, 1, output[0].length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#065f46');
      headerRange.setFontColor('#ffffff');
      sheet.autoResizeColumns(1, output[0].length);
    }

    return json_({ ok: true, rows: (body.rows || []).length, at: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) }, 500);
  }
}

function json_(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
