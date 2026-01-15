/**
 * Google Ads Internal Script - Historical Backfill
 *
 * One-time script to export historical data for a specified date range.
 * Run multiple times with different date ranges to backfill all history.
 *
 * Exports 4 levels of data (matching daily export structure):
 * - Daily: Campaign metrics by Date x Device x NetworkType
 * - Keywords: Keyword-level metrics for bid optimization
 * - Search Terms: Actual user queries for intent analysis
 * - Geographic: Campaign metrics by Country (via geographic_view)
 *
 * INSTRUCTIONS:
 * 1. Set START_DATE and END_DATE below (max 1 year per run recommended)
 * 2. Go to ads.google.com > Tools & Settings > Bulk Actions > Scripts
 * 3. Create a New Script named "Keynote Dashboard Backfill"
 * 4. Copy-Paste this entire code into the editor
 * 5. Click Preview first to test, then Run to execute
 * 6. Repeat with different date ranges until all history is loaded
 *
 * RECOMMENDED SCHEDULE:
 *   Run 1: 2018-01-01 to 2018-12-31
 *   Run 2: 2019-01-01 to 2019-12-31
 *   Run 3: 2020-01-01 to 2020-12-31
 *   Run 4: 2021-01-01 to 2021-12-31
 *   Run 5: 2022-01-01 to 2022-12-31
 *   Run 6: 2023-01-01 to 2023-12-31
 *   Run 7: 2024-01-01 to 2024-12-31
 *   Run 8: 2025-01-01 to 2026-01-14 (up to yesterday)
 *
 * NOTE: Keyword and Search Term data may only be available for ~2-3 years
 * due to Google Ads data retention limits.
 */

// ============================================================
// CONFIGURE THESE DATES FOR EACH RUN
// ============================================================
const START_DATE = '2024-01-01';  // Format: YYYY-MM-DD
const END_DATE = '2024-12-31';    // Format: YYYY-MM-DD
// ============================================================

const CONFIG = {
  // Each data type has its own spreadsheet (10M cell limit per spreadsheet)
  SPREADSHEETS: {
    DAILY: '16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU',
    KEYWORDS: '1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8',
    SEARCH_TERMS: '1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY',
    GEOGRAPHIC: '1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo'
  },

  SHEETS: {
    DAILY: 'Raw_Ads_Daily',
    KEYWORDS: 'Raw_Ads_Keywords',
    SEARCH_TERMS: 'Raw_Ads_SearchTerms',
    GEOGRAPHIC: 'Raw_Ads_Geographic'
  },

  HEADERS: {
    DAILY: [
      'Date', 'CampaignId', 'CampaignName', 'CampaignType', 'Status',
      'Device', 'NetworkType',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'AvgCPC',
      'Conversions', 'CostPerConversion', 'ImpressionShare'
    ],
    KEYWORDS: [
      'Date', 'CampaignId', 'CampaignName', 'CampaignType',
      'AdGroupId', 'AdGroupName',
      'KeywordId', 'KeywordText', 'MatchType', 'Status', 'QualityScore',
      'Device', 'NetworkType',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'AvgCPC', 'Conversions'
    ],
    SEARCH_TERMS: [
      'Date', 'CampaignId', 'CampaignName', 'CampaignType',
      'AdGroupId', 'AdGroupName',
      'KeywordText', 'SearchTerm',
      'Device',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'Conversions'
    ],
    GEOGRAPHIC: [
      'Date', 'CampaignId', 'CampaignName', 'CampaignType',
      'CountryCriterionId',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'Conversions'
    ]
  }
};

/**
 * Main entry point - exports all 4 data levels for the configured date range
 */
function main() {
  Logger.log(`=== Starting Historical Backfill ===`);
  Logger.log(`Date Range: ${START_DATE} to ${END_DATE}`);
  const startTime = new Date();

  // Validate dates
  if (!isValidDate(START_DATE) || !isValidDate(END_DATE)) {
    Logger.log('ERROR: Invalid date format. Use YYYY-MM-DD.');
    return;
  }

  if (START_DATE > END_DATE) {
    Logger.log('ERROR: START_DATE must be before END_DATE.');
    return;
  }

  exportDaily();
  exportKeywords();
  exportSearchTerms();
  exportGeographic();

  const duration = (new Date() - startTime) / 1000;
  Logger.log(`=== Backfill Complete (${duration.toFixed(1)}s) ===`);
  Logger.log(`Next: Update START_DATE and END_DATE for the next period.`);
}

/**
 * Export Daily campaign data (Date x Campaign x Device x NetworkType)
 */
function exportDaily() {
  Logger.log('--- Exporting Daily Campaign Data ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      campaign.status,
      segments.device,
      segments.ad_network_type,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.search_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '${START_DATE}' AND '${END_DATE}'
    ORDER BY segments.date ASC, metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.advertisingChannelType,
      row.campaign.status,
      row.segments.device,
      row.segments.adNetworkType,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      microsToCurrency(row.metrics.averageCpc),
      row.metrics.conversions,
      microsToCurrency(row.metrics.costPerConversion),
      row.metrics.searchImpressionShare || 0
    ]);
  }

  Logger.log(`Found ${rows.length} daily records.`);
  writeToSheet(CONFIG.SPREADSHEETS.DAILY, CONFIG.SHEETS.DAILY, CONFIG.HEADERS.DAILY, rows);
}

/**
 * Export Keyword-level data
 */
function exportKeywords() {
  Logger.log('--- Exporting Keywords ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      ad_group.id,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      segments.device,
      segments.ad_network_type,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions
    FROM keyword_view
    WHERE segments.date BETWEEN '${START_DATE}' AND '${END_DATE}'
    ORDER BY segments.date ASC, metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.advertisingChannelType,
      row.adGroup.id,
      row.adGroup.name,
      row.adGroupCriterion.criterionId,
      row.adGroupCriterion.keyword.text,
      row.adGroupCriterion.keyword.matchType,
      row.adGroupCriterion.status,
      row.adGroupCriterion.qualityInfo ? row.adGroupCriterion.qualityInfo.qualityScore : null,
      row.segments.device,
      row.segments.adNetworkType,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      microsToCurrency(row.metrics.averageCpc),
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} keywords.`);
  writeToSheet(CONFIG.SPREADSHEETS.KEYWORDS, CONFIG.SHEETS.KEYWORDS, CONFIG.HEADERS.KEYWORDS, rows);
}

/**
 * Export Search Term data
 */
function exportSearchTerms() {
  Logger.log('--- Exporting Search Terms ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      ad_group.id,
      ad_group.name,
      segments.keyword.info.text,
      search_term_view.search_term,
      segments.device,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.conversions
    FROM search_term_view
    WHERE segments.date BETWEEN '${START_DATE}' AND '${END_DATE}'
    ORDER BY segments.date ASC, metrics.impressions DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.advertisingChannelType,
      row.adGroup.id,
      row.adGroup.name,
      row.segments.keyword.info.text || '',
      row.searchTermView.searchTerm,
      row.segments.device,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} search terms.`);
  writeToSheet(CONFIG.SPREADSHEETS.SEARCH_TERMS, CONFIG.SHEETS.SEARCH_TERMS, CONFIG.HEADERS.SEARCH_TERMS, rows);
}

/**
 * Export Geographic data (Campaign x Country)
 * Uses geographic_view resource which returns criterion IDs instead of country names.
 * Note: Country segment cannot be combined with Device/NetworkType
 */
function exportGeographic() {
  Logger.log('--- Exporting Geographic ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.advertising_channel_type,
      geographic_view.country_criterion_id,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.conversions
    FROM geographic_view
    WHERE segments.date BETWEEN '${START_DATE}' AND '${END_DATE}'
      AND metrics.impressions > 0
    ORDER BY segments.date ASC, metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.advertisingChannelType,
      row.geographicView.countryCriterionId || 0,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} geographic records.`);
  writeToSheet(CONFIG.SPREADSHEETS.GEOGRAPHIC, CONFIG.SHEETS.GEOGRAPHIC, CONFIG.HEADERS.GEOGRAPHIC, rows);
}

/**
 * Write data to a specific sheet in a specific spreadsheet
 * @param {string} spreadsheetId - ID of the target spreadsheet
 * @param {string} sheetName - Name of the target sheet
 * @param {string[]} headers - Column headers
 * @param {Array[]} rows - Data rows to write
 */
function writeToSheet(spreadsheetId, sheetName, headers, rows) {
  if (rows.length === 0) {
    Logger.log(`No data to write to ${sheetName}.`);
    return;
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);

  // Get or create sheet
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    Logger.log(`Created new sheet: ${sheetName}`);
  }

  // Append data
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`Wrote ${rows.length} rows to ${sheetName}.`);
}

/**
 * Convert micros to currency (divide by 1,000,000)
 * @param {number} micros - Value in micros
 * @returns {number} - Value in currency units
 */
function microsToCurrency(micros) {
  if (micros === null || micros === undefined) return 0;
  return micros / 1000000;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid
 */
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}
