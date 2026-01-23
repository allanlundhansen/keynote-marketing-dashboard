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
  Logger.log('getDashboardData() called');
  Logger.log('Dashboard spreadsheet ID: ' + Config.SPREADSHEETS.DASHBOARD);

  const dashboardSpreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.DASHBOARD);
  Logger.log('Spreadsheet opened: ' + dashboardSpreadsheet.getName());

  // Read Summary_Monthly
  const monthlySheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_MONTHLY);
  Logger.log('Monthly sheet found: ' + (monthlySheet ? 'YES' : 'NO'));
  const monthlyData = sheetToObjects(monthlySheet);
  Logger.log('Monthly rows: ' + monthlyData.length);

  // Read Summary_Events
  const eventsSheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_EVENTS);
  Logger.log('Events sheet found: ' + (eventsSheet ? 'YES' : 'NO'));
  const eventsData = sheetToObjects(eventsSheet);
  Logger.log('Events rows: ' + eventsData.length);

  const result = {
    monthly: monthlyData,
    events: eventsData,
    lastUpdated: new Date().toISOString()
  };

  Logger.log('Returning result with ' + result.monthly.length + ' monthly, ' + result.events.length + ' events');
  return result;
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

/**
 * Get top keywords summary for Quick Insights on Overview
 * Reads from Summary_Keywords (pre-aggregated by YearMonth × Campaign × Keyword × MatchType)
 *
 * @param {string} dateFrom - Start month YYYY-MM
 * @param {string} dateTo - End month YYYY-MM
 * @param {string} compareDateFrom - Comparison start month YYYY-MM (optional)
 * @param {string} compareDateTo - Comparison end month YYYY-MM (optional)
 * @param {Array} campaignIds - Array of campaign IDs to filter by (optional)
 * @param {number} limit - Number of top keywords to return (default 5)
 * @returns {Object} { current: { byCost, byClicks }, comparison: { byCost, byClicks } | null }
 */
function getKeywordsSummary(dateFrom, dateTo, compareDateFrom, compareDateTo, campaignIds, limit) {
  Logger.log('getKeywordsSummary() called');
  Logger.log(`  dateFrom: ${dateFrom}, dateTo: ${dateTo}`);
  Logger.log(`  compareDateFrom: ${compareDateFrom}, compareDateTo: ${compareDateTo}`);
  Logger.log(`  campaignIds: ${JSON.stringify(campaignIds)}, limit: ${limit}`);

  limit = limit || 5;

  const dashboardSpreadsheet = SpreadsheetApp.openById(Config.SPREADSHEETS.DASHBOARD);
  const sheet = dashboardSpreadsheet.getSheetByName(Config.SHEETS.SUMMARY_KEYWORDS);
  const allData = sheetToObjects(sheet);

  Logger.log(`  Total Summary_Keywords rows: ${allData.length}`);

  // Helper to filter and aggregate keywords for a date range
  function aggregateKeywordsForPeriod(data, from, to, filterCampaigns) {
    // Filter by date range
    let filtered = data.filter(row => {
      const ym = normalizeYearMonth(row.YearMonth);
      return ym && ym >= from && ym <= to;
    });

    // Filter by campaigns if specified
    if (filterCampaigns && filterCampaigns.length > 0) {
      filtered = filtered.filter(row => filterCampaigns.includes(String(row.CampaignId)));
    }

    // Aggregate by KeywordText (sum across months, campaigns, match types)
    // Also merge search terms from each row
    const byKeyword = {};
    filtered.forEach(row => {
      const keyword = row.KeywordText;
      if (!byKeyword[keyword]) {
        byKeyword[keyword] = { keyword: keyword, cost: 0, clicks: 0, impressions: 0, searchTerms: {} };
      }
      byKeyword[keyword].cost += row.Cost || 0;
      byKeyword[keyword].clicks += row.Clicks || 0;
      byKeyword[keyword].impressions += row.Impressions || 0;

      // Merge search terms (parse JSON, aggregate by term)
      try {
        const terms = JSON.parse(row.SearchTerms || '[]');
        terms.forEach(st => {
          if (!byKeyword[keyword].searchTerms[st.term]) {
            byKeyword[keyword].searchTerms[st.term] = { term: st.term, cost: 0, clicks: 0, impressions: 0 };
          }
          byKeyword[keyword].searchTerms[st.term].cost += st.cost || 0;
          byKeyword[keyword].searchTerms[st.term].clicks += st.clicks || 0;
          byKeyword[keyword].searchTerms[st.term].impressions += st.impressions || 0;
        });
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Convert searchTerms object to sorted array (top 15 by cost)
    return Object.values(byKeyword).map(k => ({
      keyword: k.keyword,
      cost: k.cost,
      clicks: k.clicks,
      impressions: k.impressions,
      ctr: k.impressions > 0 ? k.clicks / k.impressions : 0,
      searchTerms: Object.values(k.searchTerms)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 15)
    }));
  }

  // Helper to normalize YearMonth (handles ISO date strings)
  function normalizeYearMonth(ym) {
    if (!ym) return null;
    if (typeof ym === 'string' && /^\d{4}-\d{2}$/.test(ym)) return ym;
    const d = new Date(ym);
    if (isNaN(d.getTime())) return null;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  // Helper to get top keywords sorted and limited
  function getTopKeywords(data, sortField, topN) {
    return [...data].sort((a, b) => b[sortField] - a[sortField]).slice(0, topN);
  }

  // Get current period data
  const currentData = aggregateKeywordsForPeriod(allData, dateFrom, dateTo, campaignIds);
  Logger.log(`  Current period keywords: ${currentData.length}`);

  // Build current result
  const current = {
    byCost: getTopKeywords(currentData, 'cost', limit),
    byClicks: getTopKeywords(currentData, 'clicks', limit)
  };

  // Get comparison period data if specified (independently ranked)
  let comparison = null;
  if (compareDateFrom && compareDateTo) {
    const comparisonData = aggregateKeywordsForPeriod(allData, compareDateFrom, compareDateTo, campaignIds);
    Logger.log(`  Comparison period keywords: ${comparisonData.length}`);

    comparison = {
      byCost: getTopKeywords(comparisonData, 'cost', limit),
      byClicks: getTopKeywords(comparisonData, 'clicks', limit)
    };
  }

  const result = {
    current: current,
    comparison: comparison
  };

  Logger.log(`  Returning current: ${current.byCost.length} by cost, ${current.byClicks.length} by clicks`);
  if (comparison) {
    Logger.log(`  Returning comparison: ${comparison.byCost.length} by cost, ${comparison.byClicks.length} by clicks`);
  }
  return result;
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
      let value = row[i];
      // Convert Date objects to ISO strings for serialization
      if (value instanceof Date) {
        value = value.toISOString();
      }
      obj[header] = value;
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
