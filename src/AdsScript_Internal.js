/**
 * Google Ads Internal Script
 * 
 * INSTRUCTIONS:
 * 1. Go to ads.google.com > Tools & Settings > Bulk Actions > Scripts.
 * 2. Create a New Script named "Keynote Dashboard Exporter".
 * 3. Copy-Paste this entire code into the editor.
 * 4. Replace 'INSERT_SPREADSHEET_ID_HERE' with your actual Sheet ID.
 * 5. Authorize and Run (Preview first, then Run).
 * 6. Schedule it to run "Daily" (e.g., at 3 AM).
 */

const CONFIG = {
  // Open your dashboard Google Sheet and copy value between /d/ and /edit
  SPREADSHEET_ID: 'INSERT_SPREADSHEET_ID_HERE', 
  SHEET_NAME: 'Raw_Ads_Data'
};

function main() {
  Logger.log('Starting Daily Export...');
  
  // 1. Get Yesterday's Data
  const query = `
    SELECT 
      request_date,
      campaign.id, 
      campaign.name, 
      metrics.cost_micros, 
      metrics.clicks, 
      metrics.impressions, 
      metrics.conversions 
    FROM 
      campaign 
    WHERE 
      segments.date DURING YESTERDAY
    ORDER BY 
      metrics.cost_micros DESC
  `;
  
  const report = AdsApp.search(query);
  const rows = [];
  
  while (report.hasNext()) {
    const row = report.next();
    // Parse Google Ads objects to simple values
    rows.push([
      row.segments.date,                   // Date (YYYY-MM-DD)
      row.campaign.id,                     // ID
      row.campaign.name,                   // Name
      (row.metrics.costMicros / 1000000),  // Cost
      row.metrics.clicks,                  // Clicks
      row.metrics.impressions,             // Impressions
      row.metrics.conversions              // Conversions
    ]);
  }
  
  Logger.log(`Found ${rows.length} campaigns active yesterday.`);
  
  if (rows.length > 0) {
    writeToSheet(rows);
  } else {
    Logger.log('No data to write.');
  }
}

function writeToSheet(newRows) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Ensure sheet exists
  let sheet = ss.getSheetByName(CONFIG.SHEETS_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // Add Header if new
    sheet.appendRow(['Date', 'Campaign ID', 'Campaign Name', 'Cost', 'Clicks', 'Impressions', 'Conversions']);
  }
  
  // Append data
  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  Logger.log('Wrote data to sheet.');
}
