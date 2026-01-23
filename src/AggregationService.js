/**
 * AggregationService - Nightly job to compute summary sheets from raw data
 *
 * Runs at 5 AM daily (after Ads script at 3 AM, GA4 pull at 4 AM)
 *
 * Input:
 *   - Raw_Ads_Daily (Campaign × Device × NetworkType)
 *   - Raw_GA4_Sessions (Campaign × Device × Country)
 *   - Raw_GA4_Events (Campaign × Device × EventName)
 *
 * Output:
 *   - Summary_Monthly (YearMonth × Campaign × Device) - Ads + Sessions joined
 *   - Summary_Events (YearMonth × Campaign × Device × EventName)
 *   - Summary_Campaigns (one row per campaign with JSON event counts)
 */

// =============================================================================
// HEADERS FOR SUMMARY SHEETS
// =============================================================================

const HEADERS_SUMMARY_MONTHLY = [
  'YearMonth', 'CampaignId', 'CampaignName', 'CampaignType', 'Device',
  'Cost', 'Clicks', 'Impressions', 'AdsConversions',
  'Sessions', 'Users', 'NewUsers', 'EngagedSessions'
];

const HEADERS_SUMMARY_EVENTS = [
  'YearMonth', 'CampaignId', 'CampaignName', 'Device', 'EventName', 'EventCount'
];

const HEADERS_SUMMARY_CAMPAIGNS = [
  'CampaignId', 'CampaignName', 'CampaignType', 'Status', 'FirstDate', 'LastDate',
  'AllTime_Cost', 'AllTime_Clicks', 'AllTime_Impressions', 'AllTime_AdsConversions',
  'AllTime_Sessions', 'AllTime_EngagedSessions', 'AllTime_EventCounts',
  'L12M_Cost', 'L12M_Clicks', 'L12M_Impressions', 'L12M_AdsConversions',
  'L12M_Sessions', 'L12M_EngagedSessions', 'L12M_EventCounts'
];

const HEADERS_SUMMARY_KEYWORDS = [
  'YearMonth', 'CampaignId', 'CampaignName', 'KeywordText', 'MatchType',
  'Cost', 'Clicks', 'Impressions', 'SearchTerms'
];

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

const AggregationService = {

  /**
   * Main entry point for nightly aggregation job.
   * Called by time-driven trigger at 5 AM.
   */
  nightlyAggregation: function() {
    const startTime = new Date();
    Logger.log('=== Starting Nightly Aggregation ===');

    try {
      // Step 1: Read raw data
      Logger.log('Step 1: Reading raw data...');
      const rawAds = this.readRawData(Config.SPREADSHEETS.RAW_ADS_DAILY, Config.SHEETS.RAW_ADS_DAILY);
      const rawSessions = this.readRawData(Config.SPREADSHEETS.RAW_GA4_SESSIONS, Config.SHEETS.RAW_GA4_SESSIONS);
      const rawEvents = this.readRawData(Config.SPREADSHEETS.RAW_GA4_EVENTS, Config.SHEETS.RAW_GA4_EVENTS);
      const rawKeywords = this.readRawData(Config.SPREADSHEETS.RAW_ADS_KEYWORDS, Config.SHEETS.RAW_ADS_KEYWORDS);
      const rawSearchTerms = this.readRawData(Config.SPREADSHEETS.RAW_ADS_SEARCH_TERMS, Config.SHEETS.RAW_ADS_SEARCH_TERMS);

      Logger.log(`  Raw Ads: ${rawAds.length} rows`);
      Logger.log(`  Raw Sessions: ${rawSessions.length} rows`);
      Logger.log(`  Raw Events: ${rawEvents.length} rows`);
      Logger.log(`  Raw Keywords: ${rawKeywords.length} rows`);
      Logger.log(`  Raw SearchTerms: ${rawSearchTerms.length} rows`);

      // Step 2: Build campaign lookup from Ads data
      Logger.log('Step 2: Building campaign lookup...');
      const campaignLookup = this.buildCampaignLookup(rawAds);
      Logger.log(`  Found ${Object.keys(campaignLookup).length} unique campaigns`);

      // Step 3: Aggregate Ads data by YearMonth × Campaign × Device
      Logger.log('Step 3: Aggregating Ads data...');
      const adsMonthly = this.aggregateAdsMonthly(rawAds);
      Logger.log(`  Ads monthly: ${Object.keys(adsMonthly).length} unique keys`);

      // Step 4: Aggregate Sessions data by YearMonth × Campaign × Device
      Logger.log('Step 4: Aggregating Sessions data...');
      const sessionsMonthly = this.aggregateSessionsMonthly(rawSessions);
      Logger.log(`  Sessions monthly: ${Object.keys(sessionsMonthly).length} unique keys`);

      // Step 5: Join Ads + Sessions (Ads is the base)
      Logger.log('Step 5: Joining Ads + Sessions...');
      const summaryMonthly = this.joinMonthlyData(adsMonthly, sessionsMonthly, campaignLookup);
      Logger.log(`  Summary Monthly: ${summaryMonthly.length} rows`);

      // Step 6: Aggregate Events by YearMonth × Campaign × Device × EventName
      Logger.log('Step 6: Aggregating Events data...');
      const summaryEvents = this.aggregateEvents(rawEvents, campaignLookup);
      Logger.log(`  Summary Events: ${summaryEvents.length} rows`);

      // Step 7: Compute Campaign summaries
      Logger.log('Step 7: Computing Campaign summaries...');
      const summaryCampaigns = this.aggregateCampaigns(rawAds, rawSessions, rawEvents, campaignLookup);
      Logger.log(`  Summary Campaigns: ${summaryCampaigns.length} rows`);

      // Step 8: Aggregate Keywords by YearMonth × Campaign × Keyword × MatchType (with search terms)
      Logger.log('Step 8: Aggregating Keywords data (with search terms)...');
      const summaryKeywords = this.aggregateKeywords(rawKeywords, rawSearchTerms);
      Logger.log(`  Summary Keywords: ${summaryKeywords.length} rows`);

      // Step 9: Write summary sheets
      Logger.log('Step 9: Writing summary sheets...');
      this.writeSummary(Config.SHEETS.SUMMARY_MONTHLY, HEADERS_SUMMARY_MONTHLY, summaryMonthly);
      this.writeSummary(Config.SHEETS.SUMMARY_EVENTS, HEADERS_SUMMARY_EVENTS, summaryEvents);
      this.writeSummary(Config.SHEETS.SUMMARY_CAMPAIGNS, HEADERS_SUMMARY_CAMPAIGNS, summaryCampaigns);
      this.writeSummary(Config.SHEETS.SUMMARY_KEYWORDS, HEADERS_SUMMARY_KEYWORDS, summaryKeywords);

      const duration = (new Date() - startTime) / 1000;
      Logger.log(`=== Aggregation Complete (${duration.toFixed(1)}s) ===`);

      return {
        success: true,
        duration: duration,
        counts: {
          monthly: summaryMonthly.length,
          events: summaryEvents.length,
          campaigns: summaryCampaigns.length,
          keywords: summaryKeywords.length
        }
      };

    } catch (e) {
      Logger.log('ERROR in nightlyAggregation: ' + e.message);
      Logger.log(e.stack);
      return { success: false, error: e.message };
    }
  },

  // =============================================================================
  // DATA READING
  // =============================================================================

  /**
   * Reads all data from a sheet, returning array of objects with header keys.
   */
  readRawData: function(spreadsheetId, sheetName) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      Logger.log(`Warning: Sheet ${sheetName} not found`);
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; // Only header or empty

    const headers = data[0];
    const rows = [];

    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }

    return rows;
  },

  // =============================================================================
  // CAMPAIGN LOOKUP
  // =============================================================================

  /**
   * Builds a lookup table from CampaignName → {CampaignId, CampaignType, Status}
   * Uses the most recent data for each campaign.
   */
  buildCampaignLookup: function(rawAds) {
    const lookup = {};

    for (const row of rawAds) {
      const name = row.CampaignName;
      if (!name) continue;

      // Always update to get the most recent status
      lookup[name] = {
        CampaignId: row.CampaignId,
        CampaignType: row.CampaignType,
        Status: row.Status
      };
    }

    return lookup;
  },

  // =============================================================================
  // AGGREGATION FUNCTIONS
  // =============================================================================

  /**
   * Aggregates Ads data by YearMonth × CampaignName × Device
   * Returns object with composite key → aggregated metrics
   */
  aggregateAdsMonthly: function(rawAds) {
    const agg = {};

    for (const row of rawAds) {
      const yearMonth = this.getYearMonth(row.Date);
      const campaign = row.CampaignName;
      const device = this.normalizeDevice(row.Device);

      if (!yearMonth || !campaign || !device) continue;

      const key = `${yearMonth}|${campaign}|${device}`;

      if (!agg[key]) {
        agg[key] = {
          YearMonth: yearMonth,
          CampaignName: campaign,
          Device: device,
          Cost: 0,
          Clicks: 0,
          Impressions: 0,
          AdsConversions: 0
        };
      }

      agg[key].Cost += this.toNumber(row.Cost);
      agg[key].Clicks += this.toNumber(row.Clicks);
      agg[key].Impressions += this.toNumber(row.Impressions);
      agg[key].AdsConversions += this.toNumber(row.Conversions);
    }

    return agg;
  },

  /**
   * Aggregates Sessions data by YearMonth × Campaign × Device
   * Returns object with composite key → aggregated metrics
   */
  aggregateSessionsMonthly: function(rawSessions) {
    const agg = {};

    for (const row of rawSessions) {
      const yearMonth = this.getYearMonth(row.Date);
      const campaign = row.Campaign;
      const device = this.normalizeDevice(row.Device);

      if (!yearMonth || !campaign || !device) continue;

      const key = `${yearMonth}|${campaign}|${device}`;

      if (!agg[key]) {
        agg[key] = {
          YearMonth: yearMonth,
          Campaign: campaign,
          Device: device,
          Sessions: 0,
          Users: 0,
          NewUsers: 0,
          EngagedSessions: 0
        };
      }

      agg[key].Sessions += this.toNumber(row.Sessions);
      agg[key].Users += this.toNumber(row.Users);
      agg[key].NewUsers += this.toNumber(row.NewUsers);
      agg[key].EngagedSessions += this.toNumber(row.EngagedSessions);
    }

    return agg;
  },

  /**
   * Joins Ads and Sessions monthly aggregates.
   * Ads is the base - only campaigns with ad spend are included.
   * GA4 data is joined where campaign names match.
   */
  joinMonthlyData: function(adsMonthly, sessionsMonthly, campaignLookup) {
    const rows = [];

    for (const key in adsMonthly) {
      const ads = adsMonthly[key];
      const sessions = sessionsMonthly[key] || {};
      const campaignInfo = campaignLookup[ads.CampaignName] || {};

      rows.push([
        ads.YearMonth,
        campaignInfo.CampaignId || '',
        ads.CampaignName,
        campaignInfo.CampaignType || '',
        ads.Device,
        ads.Cost,
        ads.Clicks,
        ads.Impressions,
        ads.AdsConversions,
        sessions.Sessions || 0,
        sessions.Users || 0,
        sessions.NewUsers || 0,
        sessions.EngagedSessions || 0
      ]);
    }

    // Sort by YearMonth desc, then CampaignName, then Device
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return b[0].localeCompare(a[0]); // YearMonth desc
      if (a[2] !== b[2]) return a[2].localeCompare(b[2]); // CampaignName asc
      return a[4].localeCompare(b[4]); // Device asc
    });

    return rows;
  },

  /**
   * Aggregates Events by YearMonth × Campaign × Device × EventName
   * Only includes events for campaigns that exist in Ads data.
   */
  aggregateEvents: function(rawEvents, campaignLookup) {
    const agg = {};

    for (const row of rawEvents) {
      const yearMonth = this.getYearMonth(row.Date);
      const campaign = row.Campaign;
      const device = this.normalizeDevice(row.Device);
      const eventName = row.EventName;

      if (!yearMonth || !campaign || !device || !eventName) continue;

      // Only include campaigns that exist in Ads data
      if (!campaignLookup[campaign]) continue;

      const key = `${yearMonth}|${campaign}|${device}|${eventName}`;

      if (!agg[key]) {
        agg[key] = {
          YearMonth: yearMonth,
          Campaign: campaign,
          Device: device,
          EventName: eventName,
          EventCount: 0
        };
      }

      agg[key].EventCount += this.toNumber(row.EventCount);
    }

    // Convert to array
    const rows = [];
    for (const key in agg) {
      const e = agg[key];
      const campaignInfo = campaignLookup[e.Campaign] || {};
      rows.push([
        e.YearMonth,
        campaignInfo.CampaignId || '',
        e.Campaign,
        e.Device,
        e.EventName,
        e.EventCount
      ]);
    }

    // Sort by YearMonth desc, CampaignName, Device, EventName
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return b[0].localeCompare(a[0]);
      if (a[2] !== b[2]) return a[2].localeCompare(b[2]);
      if (a[3] !== b[3]) return a[3].localeCompare(b[3]);
      return a[4].localeCompare(b[4]);
    });

    return rows;
  },

  /**
   * Aggregates campaign-level summaries with all-time and L12M totals.
   */
  aggregateCampaigns: function(rawAds, rawSessions, rawEvents, campaignLookup) {
    const campaigns = {};
    const now = new Date();
    const l12mCutoff = this.getL12MCutoffDate(now);

    // Initialize campaigns from lookup
    for (const name in campaignLookup) {
      const info = campaignLookup[name];
      campaigns[name] = {
        CampaignId: info.CampaignId,
        CampaignName: name,
        CampaignType: info.CampaignType,
        Status: info.Status,
        FirstDate: null,
        LastDate: null,
        // All-time
        AllTime_Cost: 0,
        AllTime_Clicks: 0,
        AllTime_Impressions: 0,
        AllTime_AdsConversions: 0,
        AllTime_Sessions: 0,
        AllTime_EngagedSessions: 0,
        AllTime_Events: {},
        // Last 12 months
        L12M_Cost: 0,
        L12M_Clicks: 0,
        L12M_Impressions: 0,
        L12M_AdsConversions: 0,
        L12M_Sessions: 0,
        L12M_EngagedSessions: 0,
        L12M_Events: {}
      };
    }

    // Aggregate Ads data
    for (const row of rawAds) {
      const name = row.CampaignName;
      if (!campaigns[name]) continue;

      const date = this.formatDateString(row.Date);
      const isL12M = date >= l12mCutoff;

      // Track first/last date
      if (!campaigns[name].FirstDate || date < campaigns[name].FirstDate) {
        campaigns[name].FirstDate = date;
      }
      if (!campaigns[name].LastDate || date > campaigns[name].LastDate) {
        campaigns[name].LastDate = date;
      }

      // All-time
      campaigns[name].AllTime_Cost += this.toNumber(row.Cost);
      campaigns[name].AllTime_Clicks += this.toNumber(row.Clicks);
      campaigns[name].AllTime_Impressions += this.toNumber(row.Impressions);
      campaigns[name].AllTime_AdsConversions += this.toNumber(row.Conversions);

      // L12M
      if (isL12M) {
        campaigns[name].L12M_Cost += this.toNumber(row.Cost);
        campaigns[name].L12M_Clicks += this.toNumber(row.Clicks);
        campaigns[name].L12M_Impressions += this.toNumber(row.Impressions);
        campaigns[name].L12M_AdsConversions += this.toNumber(row.Conversions);
      }
    }

    // Aggregate Sessions data
    for (const row of rawSessions) {
      const name = row.Campaign;
      if (!campaigns[name]) continue;

      const date = this.formatDateString(row.Date);
      const isL12M = date >= l12mCutoff;

      // All-time
      campaigns[name].AllTime_Sessions += this.toNumber(row.Sessions);
      campaigns[name].AllTime_EngagedSessions += this.toNumber(row.EngagedSessions);

      // L12M
      if (isL12M) {
        campaigns[name].L12M_Sessions += this.toNumber(row.Sessions);
        campaigns[name].L12M_EngagedSessions += this.toNumber(row.EngagedSessions);
      }
    }

    // Aggregate Events data
    for (const row of rawEvents) {
      const name = row.Campaign;
      if (!campaigns[name]) continue;

      const date = this.formatDateString(row.Date);
      const isL12M = date >= l12mCutoff;
      const eventName = row.EventName;
      const count = this.toNumber(row.EventCount);

      // All-time
      if (!campaigns[name].AllTime_Events[eventName]) {
        campaigns[name].AllTime_Events[eventName] = 0;
      }
      campaigns[name].AllTime_Events[eventName] += count;

      // L12M
      if (isL12M) {
        if (!campaigns[name].L12M_Events[eventName]) {
          campaigns[name].L12M_Events[eventName] = 0;
        }
        campaigns[name].L12M_Events[eventName] += count;
      }
    }

    // Convert to array
    const rows = [];
    for (const name in campaigns) {
      const c = campaigns[name];
      rows.push([
        c.CampaignId,
        c.CampaignName,
        c.CampaignType,
        c.Status,
        c.FirstDate || '',
        c.LastDate || '',
        c.AllTime_Cost,
        c.AllTime_Clicks,
        c.AllTime_Impressions,
        c.AllTime_AdsConversions,
        c.AllTime_Sessions,
        c.AllTime_EngagedSessions,
        JSON.stringify(c.AllTime_Events),
        c.L12M_Cost,
        c.L12M_Clicks,
        c.L12M_Impressions,
        c.L12M_AdsConversions,
        c.L12M_Sessions,
        c.L12M_EngagedSessions,
        JSON.stringify(c.L12M_Events)
      ]);
    }

    // Sort by AllTime_Cost desc
    rows.sort((a, b) => b[6] - a[6]);

    return rows;
  },

  /**
   * Aggregates Keywords by YearMonth × CampaignId × KeywordText × MatchType
   * Also embeds top 15 search terms per keyword from rawSearchTerms.
   * Used for Quick Insights on the Overview dashboard and drill-down views.
   */
  aggregateKeywords: function(rawKeywords, rawSearchTerms) {
    const SEARCH_TERMS_LIMIT = 15;

    // Step 1: Aggregate keywords
    const keywordAgg = {};

    for (const row of rawKeywords) {
      const yearMonth = this.getYearMonth(row.Date);
      const campaignId = row.CampaignId;
      const campaignName = row.CampaignName;
      const keywordText = row.KeywordText;
      const matchType = row.MatchType;

      if (!yearMonth || !campaignId || !keywordText) continue;

      const key = `${yearMonth}|${campaignId}|${keywordText}|${matchType || 'UNKNOWN'}`;

      if (!keywordAgg[key]) {
        keywordAgg[key] = {
          YearMonth: yearMonth,
          CampaignId: campaignId,
          CampaignName: campaignName,
          KeywordText: keywordText,
          MatchType: matchType || 'UNKNOWN',
          Cost: 0,
          Clicks: 0,
          Impressions: 0
        };
      }

      keywordAgg[key].Cost += this.toNumber(row.Cost);
      keywordAgg[key].Clicks += this.toNumber(row.Clicks);
      keywordAgg[key].Impressions += this.toNumber(row.Impressions);
    }

    // Step 2: Aggregate search terms by YearMonth × CampaignId × KeywordText × SearchTerm
    const searchTermAgg = {};

    for (const row of rawSearchTerms) {
      const yearMonth = this.getYearMonth(row.Date);
      const campaignId = row.CampaignId;
      const keywordText = row.KeywordText;
      const searchTerm = row.SearchTerm;

      if (!yearMonth || !campaignId || !keywordText || !searchTerm) continue;

      const key = `${yearMonth}|${campaignId}|${keywordText}|${searchTerm}`;

      if (!searchTermAgg[key]) {
        searchTermAgg[key] = {
          YearMonth: yearMonth,
          CampaignId: campaignId,
          KeywordText: keywordText,
          SearchTerm: searchTerm,
          Cost: 0,
          Clicks: 0,
          Impressions: 0
        };
      }

      searchTermAgg[key].Cost += this.toNumber(row.Cost);
      searchTermAgg[key].Clicks += this.toNumber(row.Clicks);
      searchTermAgg[key].Impressions += this.toNumber(row.Impressions);
    }

    // Step 3: Group search terms by YearMonth × CampaignId × KeywordText (to match keywords)
    // Note: Keywords have MatchType, search terms don't - we match on YearMonth + CampaignId + KeywordText
    const searchTermsByKeyword = {};

    for (const key in searchTermAgg) {
      const st = searchTermAgg[key];
      const keywordKey = `${st.YearMonth}|${st.CampaignId}|${st.KeywordText}`;

      if (!searchTermsByKeyword[keywordKey]) {
        searchTermsByKeyword[keywordKey] = [];
      }

      searchTermsByKeyword[keywordKey].push({
        term: st.SearchTerm,
        cost: st.Cost,
        clicks: st.Clicks,
        impressions: st.Impressions
      });
    }

    // Sort each keyword's search terms by cost desc and limit to top N
    for (const key in searchTermsByKeyword) {
      searchTermsByKeyword[key].sort((a, b) => b.cost - a.cost);
      searchTermsByKeyword[key] = searchTermsByKeyword[key].slice(0, SEARCH_TERMS_LIMIT);
    }

    // Step 4: Convert keywords to array and attach search terms
    const rows = [];
    for (const key in keywordAgg) {
      const k = keywordAgg[key];
      // Match search terms on YearMonth + CampaignId + KeywordText (ignoring MatchType)
      const searchTermKey = `${k.YearMonth}|${k.CampaignId}|${k.KeywordText}`;
      const searchTerms = searchTermsByKeyword[searchTermKey] || [];

      rows.push([
        k.YearMonth,
        k.CampaignId,
        k.CampaignName,
        k.KeywordText,
        k.MatchType,
        k.Cost,
        k.Clicks,
        k.Impressions,
        JSON.stringify(searchTerms)
      ]);
    }

    // Sort by YearMonth desc, then Cost desc
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return b[0].localeCompare(a[0]); // YearMonth desc
      return b[5] - a[5]; // Cost desc
    });

    return rows;
  },

  // =============================================================================
  // WRITING
  // =============================================================================

  /**
   * Writes data to a summary sheet, overwriting existing content.
   */
  writeSummary: function(sheetName, headers, data) {
    const ss = SpreadsheetApp.openById(Config.SPREADSHEETS.DASHBOARD);
    let sheet = ss.getSheetByName(sheetName);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Created new sheet: ${sheetName}`);
    }

    // Clear existing content
    sheet.clear();

    // Write headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Write data if any
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    }

    Logger.log(`Wrote ${data.length} rows to ${sheetName}`);
  },

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Extracts YYYY-MM from a date value.
   */
  getYearMonth: function(dateValue) {
    if (!dateValue) return null;

    let dateStr;
    if (dateValue instanceof Date) {
      dateStr = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      dateStr = String(dateValue);
    }

    // Handle YYYY-MM-DD format
    const match = dateStr.match(/^(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }

    return null;
  },

  /**
   * Formats a date value to YYYY-MM-DD string for comparison.
   */
  formatDateString: function(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }

    return String(dateValue).substring(0, 10);
  },

  /**
   * Normalizes device to uppercase (DESKTOP, MOBILE, TABLET).
   */
  normalizeDevice: function(device) {
    if (!device) return 'UNKNOWN';
    return String(device).toUpperCase();
  },

  /**
   * Converts value to number, defaulting to 0.
   */
  toNumber: function(value) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Gets the cutoff date for "last 12 months" calculation.
   * Returns YYYY-MM-DD string for 12 months ago.
   */
  getL12MCutoffDate: function(now) {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 12);
    return Utilities.formatDate(cutoff, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
};

// =============================================================================
// WRAPPER FUNCTIONS (for Apps Script triggers and manual calls)
// =============================================================================

/**
 * Nightly trigger function - call at 5 AM.
 * Set up via Apps Script > Triggers > Add Trigger > nightlyAggregation > Time-driven > Day timer > 5am-6am
 */
function nightlyAggregation() {
  return AggregationService.nightlyAggregation();
}

/**
 * Test function - runs aggregation and logs results.
 */
function testAggregation() {
  Logger.log('Testing aggregation...');
  const result = AggregationService.nightlyAggregation();
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  return result;
}
