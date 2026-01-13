/**
 * Manages interactions with Google Sheets
 */
const SheetManager = {
  /**
   * Initializes the spreadsheet with required sheets if they don't exist
   */
  setupSheets: function () {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetNames = Object.values(Config.SHEETS);

    sheetNames.forEach((name) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        if (name === Config.SHEETS.ADS_DATA) {
          sheet.appendRow([
            "Date",
            "Campaign ID",
            "Campaign Name",
            "Cost",
            "Clicks",
            "Impressions",
            "CTR",
            "Conversions",
            "Cost/Conv",
          ]);
        } else if (name === Config.SHEETS.GA4_DATA) {
          sheet.appendRow([
            "Date",
            "Sessions",
            "Users",
            "Conversions",
            "Bounce Rate",
          ]);
        }
      }
    });
  },

  /**
   * Writes raw data to a specific sheet
   * @param {string} sheetName
   * @param {Array<Array>} data - 2D array of data (rows)
   */
  writeData: function (sheetName, data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    // Optional: Clear old data or append? For historical log, we usually append.
    // For this MVP, let's append.
    if (data.length > 0) {
      sheet
        .getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length)
        .setValues(data);
    }
  },

  /**
   * Reads all data from a sheet
   * @return {Array<Array>}
   */
  getData: function (sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return []; // Only header or empty

    return sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  },
};
