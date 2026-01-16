/**
 * Service to interact with Google Analytics 4 (GA4) Data API
 * Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 *
 * GA4 data is split into three tables to answer different questions in the post-click funnel:
 * - Sessions: Traffic volume & quality (Campaign × Device × Country) - joins to Ads for ROI
 * - Pages: Landing page effectiveness (Campaign × LandingPage) - diagnose page vs targeting
 * - Events: User behavior & conversions (Campaign × EventName) - funnel visibility
 *
 * See ADR-013 for full rationale on this architecture.
 */

// Headers for each table
const HEADERS_SESSIONS = [
  'Date', 'Campaign', 'Device', 'Country',
  'Sessions', 'Users', 'NewUsers', 'EngagedSessions',
  'BounceRate', 'AvgSessionDuration'
];

const HEADERS_PAGES = [
  'Date', 'Campaign', 'LandingPage',
  'Sessions', 'EngagedSessions', 'BounceRate', 'PageViews'
];

const HEADERS_EVENTS = [
  'Date', 'Campaign', 'EventName', 'EventCount'
];

const AnalyticsService = {

  // =========================================================================
  // MAIN ENTRY POINTS
  // =========================================================================

  /**
   * Fetches all GA4 data for a date range and writes to the three tables.
   * Used for both backfill (historical dates) and daily pulls (yesterday).
   *
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @return {Object} Result with row counts or errors
   */
  fetchGA4Data: function(startDate, endDate) {
    Logger.log(`=== Fetching GA4 Data: ${startDate} to ${endDate} ===`);

    const propertyId = Config.GA4_PROPERTY_ID;
    if (!propertyId || propertyId.includes('INSERT')) {
      Logger.log('ERROR: GA4 Property ID not configured in Config.js');
      return { success: false, error: 'Property ID not configured' };
    }

    const results = {
      sessions: null,
      pages: null,
      events: null
    };

    // Fetch all three tables
    try {
      results.sessions = this.fetchGA4Sessions(startDate, endDate);
      results.pages = this.fetchGA4Pages(startDate, endDate);
      results.events = this.fetchGA4Events(startDate, endDate);

      const success = results.sessions.success && results.pages.success && results.events.success;
      const totalRows = (results.sessions.rowCount || 0) +
                       (results.pages.rowCount || 0) +
                       (results.events.rowCount || 0);

      Logger.log(`=== GA4 Fetch Complete: ${totalRows} total rows ===`);
      Logger.log(`  Sessions: ${results.sessions.rowCount || 0} rows`);
      Logger.log(`  Pages: ${results.pages.rowCount || 0} rows`);
      Logger.log(`  Events: ${results.events.rowCount || 0} rows`);

      return { success, results, totalRows };

    } catch (e) {
      Logger.log('Failed to fetch GA4 data: ' + e.message);
      return { success: false, error: e.message, results };
    }
  },

  /**
   * Pulls yesterday's GA4 data. Used by daily scheduled trigger (4 AM).
   */
  pullDailyGA4: function() {
    const yesterday = this.getYesterdayDate();
    Logger.log(`Daily GA4 Pull for: ${yesterday}`);
    return this.fetchGA4Data(yesterday, yesterday);
  },

  // =========================================================================
  // SESSIONS TABLE - Traffic volume & quality by Campaign × Device × Country
  // =========================================================================

  /**
   * Fetches session-level metrics for joining to Ads data and geographic analysis.
   * Answers: "How much quality traffic did each campaign drive?"
   */
  fetchGA4Sessions: function(startDate, endDate) {
    Logger.log('Fetching GA4 Sessions...');

    const requestBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionCampaignName' },
        { name: 'deviceCategory' },
        { name: 'country' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'engagedSessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      dimensionFilter: this.getCampaignFilter(),
      orderBys: [
        { dimension: { dimensionName: 'date' } },
        { metric: { metricName: 'sessions' }, desc: true }
      ],
      limit: 100000
    };

    const data = this.callGA4API(requestBody);
    if (!data) {
      return { success: false, error: 'API call failed' };
    }

    const rows = this.processSessionsResponse(data);
    if (rows.length > 0) {
      this.writeToSheet(
        Config.SPREADSHEETS.RAW_GA4_SESSIONS,
        Config.SHEETS.RAW_GA4_SESSIONS,
        HEADERS_SESSIONS,
        rows
      );
    }

    Logger.log(`  Sessions: ${rows.length} rows`);
    return { success: true, rowCount: rows.length };
  },

  processSessionsResponse: function(data) {
    if (!data.rows || data.rows.length === 0) return [];

    return data.rows.map(row => {
      const dims = row.dimensionValues;
      const mets = row.metricValues;
      return [
        this.formatDate(dims[0].value),           // Date
        dims[1].value || '(not set)',             // Campaign
        dims[2].value || 'unknown',               // Device
        dims[3].value || 'unknown',               // Country
        parseFloat(mets[0].value) || 0,           // Sessions
        parseFloat(mets[1].value) || 0,           // Users
        parseFloat(mets[2].value) || 0,           // NewUsers
        parseFloat(mets[3].value) || 0,           // EngagedSessions
        parseFloat(mets[4].value) || 0,           // BounceRate
        parseFloat(mets[5].value) || 0            // AvgSessionDuration
      ];
    });
  },

  // =========================================================================
  // PAGES TABLE - Landing page effectiveness by Campaign × LandingPage
  // =========================================================================

  /**
   * Fetches landing page metrics to understand which pages convert.
   * Answers: "Which landing pages work?" - separates targeting from page issues.
   */
  fetchGA4Pages: function(startDate, endDate) {
    Logger.log('Fetching GA4 Pages...');

    const requestBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionCampaignName' },
        { name: 'landingPage' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'bounceRate' },
        { name: 'screenPageViews' }
      ],
      dimensionFilter: this.getCampaignFilter(),
      orderBys: [
        { dimension: { dimensionName: 'date' } },
        { metric: { metricName: 'sessions' }, desc: true }
      ],
      limit: 100000
    };

    const data = this.callGA4API(requestBody);
    if (!data) {
      return { success: false, error: 'API call failed' };
    }

    const rows = this.processPagesResponse(data);
    if (rows.length > 0) {
      this.writeToSheet(
        Config.SPREADSHEETS.RAW_GA4_PAGES,
        Config.SHEETS.RAW_GA4_PAGES,
        HEADERS_PAGES,
        rows
      );
    }

    Logger.log(`  Pages: ${rows.length} rows`);
    return { success: true, rowCount: rows.length };
  },

  processPagesResponse: function(data) {
    if (!data.rows || data.rows.length === 0) return [];

    return data.rows.map(row => {
      const dims = row.dimensionValues;
      const mets = row.metricValues;
      return [
        this.formatDate(dims[0].value),           // Date
        dims[1].value || '(not set)',             // Campaign
        dims[2].value || '/',                     // LandingPage
        parseFloat(mets[0].value) || 0,           // Sessions
        parseFloat(mets[1].value) || 0,           // EngagedSessions
        parseFloat(mets[2].value) || 0,           // BounceRate
        parseFloat(mets[3].value) || 0            // PageViews
      ];
    });
  },

  // =========================================================================
  // EVENTS TABLE - User behavior & conversions by Campaign × EventName
  // =========================================================================

  /**
   * Fetches event counts to understand user behavior and enable flexible conversion definition.
   * Answers: "What do users actually do?" - enables funnel analysis and conversion flexibility.
   */
  fetchGA4Events: function(startDate, endDate) {
    Logger.log('Fetching GA4 Events...');

    const requestBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionCampaignName' },
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensionFilter: this.getCampaignFilter(),
      orderBys: [
        { dimension: { dimensionName: 'date' } },
        { metric: { metricName: 'eventCount' }, desc: true }
      ],
      limit: 100000
    };

    const data = this.callGA4API(requestBody);
    if (!data) {
      return { success: false, error: 'API call failed' };
    }

    const rows = this.processEventsResponse(data);
    if (rows.length > 0) {
      this.writeToSheet(
        Config.SPREADSHEETS.RAW_GA4_EVENTS,
        Config.SHEETS.RAW_GA4_EVENTS,
        HEADERS_EVENTS,
        rows
      );
    }

    Logger.log(`  Events: ${rows.length} rows`);
    return { success: true, rowCount: rows.length };
  },

  processEventsResponse: function(data) {
    if (!data.rows || data.rows.length === 0) return [];

    return data.rows.map(row => {
      const dims = row.dimensionValues;
      const mets = row.metricValues;
      return [
        this.formatDate(dims[0].value),           // Date
        dims[1].value || '(not set)',             // Campaign
        dims[2].value || 'unknown',               // EventName
        parseFloat(mets[0].value) || 0            // EventCount
      ];
    });
  },

  // =========================================================================
  // SHARED UTILITIES
  // =========================================================================

  /**
   * Returns a dimension filter to exclude direct/organic traffic.
   * This dashboard is for analyzing ad spend effectiveness.
   */
  getCampaignFilter: function() {
    return {
      andGroup: {
        expressions: [
          {
            notExpression: {
              filter: {
                fieldName: 'sessionCampaignName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: '(not set)',
                  caseSensitive: false
                }
              }
            }
          },
          {
            notExpression: {
              filter: {
                fieldName: 'sessionCampaignName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: '(direct)',
                  caseSensitive: false
                }
              }
            }
          }
        ]
      }
    };
  },

  /**
   * Makes a GA4 Data API call.
   */
  callGA4API: function(requestBody) {
    const propertyId = Config.GA4_PROPERTY_ID;
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const token = ScriptApp.getOAuthToken();

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      const content = response.getContentText();

      if (code !== 200) {
        Logger.log(`GA4 API Error (${code}): ${content}`);
        return null;
      }

      return JSON.parse(content);

    } catch (e) {
      Logger.log('GA4 API call failed: ' + e.message);
      return null;
    }
  },

  /**
   * Writes rows to a spreadsheet, creating sheet with headers if needed.
   */
  writeToSheet: function(spreadsheetId, sheetName, headers, rows) {
    if (rows.length === 0) {
      Logger.log(`No data to write to ${sheetName}.`);
      return;
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      Logger.log(`Created new sheet: ${sheetName}`);
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log(`Wrote ${rows.length} rows to ${sheetName}.`);
  },

  /**
   * Formats date from YYYYMMDD to YYYY-MM-DD.
   */
  formatDate: function(rawDate) {
    return rawDate.substring(0, 4) + '-' +
           rawDate.substring(4, 6) + '-' +
           rawDate.substring(6, 8);
  },

  /**
   * Returns yesterday's date in YYYY-MM-DD format.
   */
  getYesterdayDate: function() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
};

// =========================================================================
// WRAPPER FUNCTIONS (for Apps Script triggers and manual calls)
// =========================================================================

/**
 * Daily trigger function - call at 4 AM.
 * Set up via Apps Script > Triggers > Add Trigger > pullDailyGA4 > Time-driven > Day timer > 4am-5am
 */
function pullDailyGA4() {
  return AnalyticsService.pullDailyGA4();
}

/**
 * Backfill function - call manually with date range.
 * Example: fetchGA4Data('2024-01-01', '2024-12-31')
 */
function fetchGA4Data(startDate, endDate) {
  return AnalyticsService.fetchGA4Data(startDate, endDate);
}

/**
 * Test function - fetches last 7 days of data to verify setup.
 */
function testGA4Fetch() {
  const end = AnalyticsService.getYesterdayDate();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const start = startDate.toISOString().split('T')[0];

  Logger.log(`Testing GA4 fetch: ${start} to ${end}`);
  const result = AnalyticsService.fetchGA4Data(start, end);
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  return result;
}

// =========================================================================
// BACKFILL FUNCTIONS - Run these from the editor to populate historical data
// =========================================================================

function backfillGA4_2026() {
  Logger.log('Backfilling GA4 data for 2026 (year to date)...');
  const yesterday = AnalyticsService.getYesterdayDate();
  return AnalyticsService.fetchGA4Data('2026-01-01', yesterday);
}

function backfillGA4_2025() {
  Logger.log('Backfilling GA4 data for 2025...');
  return AnalyticsService.fetchGA4Data('2025-01-01', '2025-12-31');
}

function backfillGA4_2024() {
  Logger.log('Backfilling GA4 data for 2024...');
  return AnalyticsService.fetchGA4Data('2024-01-01', '2024-12-31');
}

function backfillGA4_2023() {
  Logger.log('Backfilling GA4 data for 2023...');
  return AnalyticsService.fetchGA4Data('2023-01-01', '2023-12-31');
}

function backfillGA4_2022() {
  Logger.log('Backfilling GA4 data for 2022...');
  return AnalyticsService.fetchGA4Data('2022-01-01', '2022-12-31');
}
