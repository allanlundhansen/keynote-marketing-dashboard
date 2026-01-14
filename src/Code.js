/**
 * Main Entry Point
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Marketing Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Triggered manually or by time-driven trigger
 * Fetches data from APIs and saves to Sheets
 */
function refreshData() {
  SheetManager.setupSheets();
  
  // Default to yesterday's data to ensure complete reporting
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Yesterday
  endDate.setDate(endDate.getDate() - 1);     // Yesterday (1 day window)
  
  const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const startStr = fmt(startDate);
  const endStr = fmt(endDate);
  
  Logger.log(`Starting data refresh for ${startStr}`);
  
  // 1. Ads Data is pushed daily by external Google Ads Script (Hybrid Model)
  // We do not fetch it here to avoid overwriting it.

  
  // 2. Fetch GA4 Data
  if (Config.GA4_PROPERTY_ID !== 'INSERT_PROPERTY_ID_HERE') {
    try {
      const ga4Data = AnalyticsService.getBasicReport(Config.GA4_PROPERTY_ID, startStr, endStr);
      if (ga4Data.rows) {
        const ga4Rows = ga4Data.rows.map(row => [
          row.dimensionValues[0].value, // date
          row.metricValues[0].value,    // sessions
          row.metricValues[1].value,    // totalUsers
          row.metricValues[2].value,    // conversions
          row.metricValues[3].value     // bounceRate
        ]);
        SheetManager.writeData(Config.SHEETS.GA4_DATA, ga4Rows);
        Logger.log(`Saved ${ga4Rows.length} rows to GA4 Data.`);
      } else {
        Logger.log('No GA4 data found (empty rows).');
      }
    } catch (e) {
      Logger.log('Error fetching GA4 data: ' + e.toString());
    }
  }
}

/**
 * API for the Web App to get data for the frontend
 */
function getDashboardData() {
  return {
    ads: SheetManager.getData(Config.SHEETS.ADS_DATA),
    ga4: SheetManager.getData(Config.SHEETS.GA4_DATA)
  };
}
