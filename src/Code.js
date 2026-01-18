/**
 * Code.js - Main entry point and API for the Marketing Dashboard
 */

// =============================================================================
// WEB APP ENTRY POINT
// =============================================================================

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Marketing Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
// DASHBOARD API - Called by frontend via google.script.run
// =============================================================================

/**
 * Get main dashboard data: Summary_Monthly + Summary_Events
 * This is the primary data load for the dashboard.
 *
 * @returns {Object} { monthly: [...], events: [...], lastUpdated: timestamp }
 */
function getDashboardData() {
  const dashboardSpreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.DASHBOARD);

  // Read Summary_Monthly
  const monthlySheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_MONTHLY);
  const monthlyData = sheetToObjects(monthlySheet);

  // Read Summary_Events
  const eventsSheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_EVENTS);
  const eventsData = sheetToObjects(eventsSheet);

  return {
    monthly: monthlyData,
    events: eventsData,
    lastUpdated: new Date().toISOString()  // TODO: Get actual last aggregation time
  };
}

/**
 * Get campaign list for filter dropdowns
 *
 * @returns {Object} { campaigns: [...] }
 */
function getCampaignList() {
  const dashboardSpreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.DASHBOARD);
  const sheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_CAMPAIGNS);
  const data = sheetToObjects(sheet);

  return {
    campaigns: data
  };
}

/**
 * Get keyword detail for drill-down view
 *
 * @param {string} campaignId - Campaign ID to filter by (optional, empty = all)
 * @param {string} dateFrom - Start date YYYY-MM-DD (optional)
 * @param {string} dateTo - End date YYYY-MM-DD (optional)
 * @returns {Object} { keywords: [...] }
 */
function getKeywordDetail(campaignId, dateFrom, dateTo) {
  const spreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.RAW_ADS_KEYWORDS);
  const sheet = spreadsheet.getSheetByName(Config.SHEETS.RAW_ADS_KEYWORDS);
  let data = sheetToObjects(sheet);

  // Filter by campaign if specified
  if (campaignId) {
    data = data.filter(row => String(row.CampaignId) === String(campaignId));
  }

  // Filter by date range if specified
  if (dateFrom) {
    data = data.filter(row => row.Date >= dateFrom);
  }
  if (dateTo) {
    data = data.filter(row => row.Date <= dateTo);
  }

  return {
    keywords: data
  };
}

/**
 * Get search term detail for drill-down view
 *
 * @param {string} campaignId - Campaign ID to filter by (optional, empty = all)
 * @param {string} dateFrom - Start date YYYY-MM-DD (optional)
 * @param {string} dateTo - End date YYYY-MM-DD (optional)
 * @returns {Object} { searchTerms: [...] }
 */
function getSearchTermDetail(campaignId, dateFrom, dateTo) {
  const spreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.RAW_ADS_SEARCH_TERMS);
  const sheet = spreadsheet.getSheetByName(Config.SHEETS.RAW_ADS_SEARCH_TERMS);
  let data = sheetToObjects(sheet);

  // Filter by campaign if specified
  if (campaignId) {
    data = data.filter(row => String(row.CampaignId) === String(campaignId));
  }

  // Filter by date range if specified
  if (dateFrom) {
    data = data.filter(row => row.Date >= dateFrom);
  }
  if (dateTo) {
    data = data.filter(row => row.Date <= dateTo);
  }

  return {
    searchTerms: data
  };
}

/**
 * Get landing page detail for drill-down view
 *
 * @param {string} campaign - Campaign name to filter by (optional, empty = all)
 * @param {string} dateFrom - Start date YYYY-MM-DD (optional)
 * @param {string} dateTo - End date YYYY-MM-DD (optional)
 * @returns {Object} { landingPages: [...] }
 */
function getLandingPageDetail(campaign, dateFrom, dateTo) {
  const spreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.RAW_GA4_PAGES);
  const sheet = spreadsheet.getSheetByName(Config.SHEETS.RAW_GA4_PAGES);
  let data = sheetToObjects(sheet);

  // Filter by campaign if specified (GA4 uses campaign name, not ID)
  if (campaign) {
    data = data.filter(row => row.Campaign === campaign);
  }

  // Filter by date range if specified
  if (dateFrom) {
    data = data.filter(row => row.Date >= dateFrom);
  }
  if (dateTo) {
    data = data.filter(row => row.Date <= dateTo);
  }

  return {
    landingPages: data
  };
}

/**
 * Get geographic data with country name mapping
 *
 * @param {string} dateFrom - Start date YYYY-MM-DD (optional)
 * @param {string} dateTo - End date YYYY-MM-DD (optional)
 * @returns {Object} { geographic: [...] }
 */
function getGeographicData(dateFrom, dateTo) {
  const spreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.RAW_ADS_GEOGRAPHIC);
  const sheet = spreadsheet.getSheetByName(Config.SHEETS.RAW_ADS_GEOGRAPHIC);
  let data = sheetToObjects(sheet);

  // Filter by date range if specified
  if (dateFrom) {
    data = data.filter(row => row.Date >= dateFrom);
  }
  if (dateTo) {
    data = data.filter(row => row.Date <= dateTo);
  }

  // Add country names from criterion IDs
  data = data.map(row => ({
    ...row,
    CountryName: COUNTRY_CRITERION_MAP[row.CountryCriterionId] || `Unknown (${row.CountryCriterionId})`
  }));

  return {
    geographic: data
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert a sheet to an array of objects using first row as headers
 *
 * @param {Sheet} sheet - Google Sheet object
 * @returns {Array} Array of objects with header keys
 */
function sheetToObjects(sheet) {
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // No data rows

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

// =============================================================================
// COUNTRY CRITERION ID MAPPING
// Google Ads geographic_view returns criterion IDs, not country names
// =============================================================================

const COUNTRY_CRITERION_MAP = {
  // North America
  2840: 'United States',
  2124: 'Canada',
  2484: 'Mexico',

  // Europe
  2826: 'United Kingdom',
  2276: 'Germany',
  2250: 'France',
  2380: 'Italy',
  2724: 'Spain',
  2528: 'Netherlands',
  2056: 'Belgium',
  2756: 'Switzerland',
  2040: 'Austria',
  2616: 'Poland',
  2752: 'Sweden',
  2578: 'Norway',
  2208: 'Denmark',
  2246: 'Finland',
  2372: 'Ireland',
  2620: 'Portugal',
  2300: 'Greece',
  2203: 'Czech Republic',
  2348: 'Hungary',
  2642: 'Romania',

  // Asia Pacific
  2036: 'Australia',
  2554: 'New Zealand',
  2392: 'Japan',
  2410: 'South Korea',
  2156: 'China',
  2344: 'Hong Kong',
  2702: 'Singapore',
  2356: 'India',
  2458: 'Malaysia',
  2764: 'Thailand',
  2360: 'Indonesia',
  2608: 'Philippines',
  2704: 'Vietnam',

  // Middle East
  2784: 'United Arab Emirates',
  2682: 'Saudi Arabia',
  2376: 'Israel',
  2792: 'Turkey',

  // South America
  2076: 'Brazil',
  2032: 'Argentina',
  2152: 'Chile',
  2170: 'Colombia',

  // Africa
  2710: 'South Africa',
  2818: 'Egypt',
  2566: 'Nigeria',
  2404: 'Kenya'
};

// =============================================================================
// LEGACY / UTILITY FUNCTIONS
// =============================================================================

/**
 * Triggered manually or by time-driven trigger
 * Fetches GA4 data (Ads data is pushed by internal script)
 */
function refreshData() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  endDate.setDate(endDate.getDate() - 1);

  const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const startStr = fmt(startDate);
  const endStr = fmt(endDate);

  Logger.log(`Starting data refresh for ${startStr}`);

  // GA4 data is now pulled by AnalyticsService.pullDailyGA4()
  // This function is kept for manual refresh if needed
  if (Config.GA4_PROPERTY_ID) {
    try {
      AnalyticsService.pullDailyGA4();
      Logger.log('GA4 data refresh complete.');
    } catch (e) {
      Logger.log('Error refreshing GA4 data: ' + e.toString());
    }
  }
}
