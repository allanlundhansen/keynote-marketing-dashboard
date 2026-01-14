/**
 * Manages interactions with Google Sheets
 */
const SheetManager = {
  /**
   * Initializes the spreadsheet with required sheets if they don't exist
   */
  setupSheets: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      console.error('No active spreadsheet found. Script must be container-bound or bound via ID.');
      return; 
    }
    
    // Config.js must be loaded before this
    const sheetNames = Object.values(Config.SHEETS);
    
    sheetNames.forEach(name => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        
        // Initialize headers
        if (name === Config.SHEETS.ADS_DATA) {
          // Schema matches design.md: Date, CampaignId, CampaignName, Cost, Clicks, Impressions, Conversions
          sheet.appendRow(['Date', 'Campaign ID', 'Campaign Name', 'Cost', 'Clicks', 'Impressions', 'Conversions']);
          sheet.setFrozenRows(1);
        } else if (name === Config.SHEETS.GA4_DATA) {
          // Schema: Date, Sessions, Users, Conversions, BounceRate
          sheet.appendRow(['Date', 'Sessions', 'Users', 'Conversions', 'Bounce Rate']);
          sheet.setFrozenRows(1);
        }
      }
    });
  },

  /**
   * Writes raw data to a specific sheet
   * @param {string} sheetName 
   * @param {Array<Array>} data - 2D array of data (rows)
   */
  writeData: function(sheetName, data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    if (data.length > 0) {
      // Append rows to the bottom
      sheet.getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
    }
  },

  /**
   * Reads all data from a sheet
   * @return {Array<Array>}
   */
  getData: function(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Helper to handle standalone usage -> we might need to open by ID if not container bound
    // But for this project, we assume the script is bound to a sheet (user will create script attached to sheet)
    // OR we open by ID if configured. 
    // Let's stick to getActiveSpreadsheet() for simplicity, assuming user runs this IN a Sheet or uses openById.
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return []; // Only header or empty
    
    return sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  }
};
