/**
 * Main Entry Point
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Marketing Dashboard")
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

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Get yesterday's data

  const fmt = (d) =>
    Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const startStr = fmt(startDate);
  const endStr = fmt(startDate); // Just fetching one day for daily logs

  // 1. Fetch Ads Data
  if (Config.ADS_CUSTOMER_ID !== "INSERT_CUSTOMER_ID_HERE") {
    const adsData = AdsService.getCampaignReport(
      Config.ADS_CUSTOMER_ID,
      startStr,
      endStr
    );
    const adsRows = adsData.map((row) => [
      startStr,
      row.campaignId,
      row.name,
      row.cost,
      row.clicks,
      row.impressions,
      row.clicks / row.impressions || 0,
      row.conversions,
      row.cost / row.conversions || 0,
    ]);
    SheetManager.writeData(Config.SHEETS.ADS_DATA, adsRows);
  }

  // 2. Fetch GA4 Data
  if (Config.GA4_PROPERTY_ID !== "INSERT_PROPERTY_ID_HERE") {
    const ga4Data = AnalyticsService.getBasicReport(
      Config.GA4_PROPERTY_ID,
      startStr,
      endStr
    );
    // Parse GA4 response structure to rows... (simplified for now)
    // AnalyticsService mock returns { rows: [...] }
    if (ga4Data.rows) {
      const ga4Rows = ga4Data.rows.map((row) => [
        row.dimensionValues[0].value, // date
        row.metricValues[0].value, // sessions
        row.metricValues[1].value, // users
        row.metricValues[2].value, // conversions
        row.metricValues[3].value, // bounce rate
      ]);
      SheetManager.writeData(Config.SHEETS.GA4_DATA, ga4Rows);
    }
  }
}

/**
 * API for the Web App to get data for the frontend
 */
function getDashboardData() {
  return {
    ads: SheetManager.getData(Config.SHEETS.ADS_DATA),
    ga4: SheetManager.getData(Config.SHEETS.GA4_DATA),
  };
}
