/**
 * Google Ads Internal Script - Daily Export
 *
 * Exports 4 levels of data granularity:
 * - Campaigns: Strategic overview
 * - Ad Groups: Tactical analysis
 * - Keywords: Bid optimization
 * - Search Terms: Intent analysis
 *
 * INSTRUCTIONS:
 * 1. Go to ads.google.com > Tools & Settings > Bulk Actions > Scripts.
 * 2. Create a New Script named "Keynote Dashboard Daily Export".
 * 3. Copy-Paste this entire code into the editor.
 * 4. Authorize and Run (Preview first, then Run).
 * 5. Schedule it to run "Daily" (e.g., at 3 AM).
 */

const CONFIG = {
  SPREADSHEET_ID: '1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI',

  SHEETS: {
    CAMPAIGNS: 'Raw_Ads_Campaigns',
    AD_GROUPS: 'Raw_Ads_AdGroups',
    KEYWORDS: 'Raw_Ads_Keywords',
    SEARCH_TERMS: 'Raw_Ads_SearchTerms'
  },

  HEADERS: {
    CAMPAIGNS: [
      'Date', 'CampaignId', 'CampaignName', 'Status',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'AvgCPC',
      'Conversions', 'CostPerConversion', 'ImpressionShare'
    ],
    AD_GROUPS: [
      'Date', 'CampaignId', 'CampaignName', 'AdGroupId', 'AdGroupName', 'Status',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'AvgCPC', 'Conversions'
    ],
    KEYWORDS: [
      'Date', 'CampaignId', 'CampaignName', 'AdGroupId', 'AdGroupName',
      'KeywordId', 'KeywordText', 'MatchType', 'Status', 'QualityScore',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'AvgCPC', 'Conversions'
    ],
    SEARCH_TERMS: [
      'Date', 'CampaignId', 'CampaignName', 'AdGroupId', 'AdGroupName',
      'KeywordText', 'SearchTerm',
      'Cost', 'Clicks', 'Impressions', 'CTR', 'Conversions'
    ]
  }
};

/**
 * Main entry point - exports all 4 data levels
 */
function main() {
  Logger.log('=== Starting Daily Export ===');
  const startTime = new Date();

  exportCampaigns();
  exportAdGroups();
  exportKeywords();
  exportSearchTerms();

  const duration = (new Date() - startTime) / 1000;
  Logger.log(`=== Daily Export Complete (${duration.toFixed(1)}s) ===`);
}

/**
 * Export Campaign-level data
 */
function exportCampaigns() {
  Logger.log('--- Exporting Campaigns ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.search_impression_share
    FROM campaign
    WHERE segments.date DURING YESTERDAY
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.status,
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

  Logger.log(`Found ${rows.length} campaigns.`);
  writeToSheet(CONFIG.SHEETS.CAMPAIGNS, CONFIG.HEADERS.CAMPAIGNS, rows);
}

/**
 * Export Ad Group-level data
 */
function exportAdGroups() {
  Logger.log('--- Exporting Ad Groups ---');

  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions
    FROM ad_group
    WHERE segments.date DURING YESTERDAY
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.adGroup.id,
      row.adGroup.name,
      row.adGroup.status,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      microsToCurrency(row.metrics.averageCpc),
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} ad groups.`);
  writeToSheet(CONFIG.SHEETS.AD_GROUPS, CONFIG.HEADERS.AD_GROUPS, rows);
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
      ad_group.id,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions
    FROM keyword_view
    WHERE segments.date DURING YESTERDAY
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.adGroup.id,
      row.adGroup.name,
      row.adGroupCriterion.criterionId,
      row.adGroupCriterion.keyword.text,
      row.adGroupCriterion.keyword.matchType,
      row.adGroupCriterion.status,
      row.adGroupCriterion.qualityInfo ? row.adGroupCriterion.qualityInfo.qualityScore : null,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      microsToCurrency(row.metrics.averageCpc),
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} keywords.`);
  writeToSheet(CONFIG.SHEETS.KEYWORDS, CONFIG.HEADERS.KEYWORDS, rows);
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
      ad_group.id,
      ad_group.name,
      segments.keyword.info.text,
      search_term_view.search_term,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING YESTERDAY
    ORDER BY metrics.impressions DESC
  `;

  const rows = [];
  const report = AdsApp.search(query);

  while (report.hasNext()) {
    const row = report.next();
    rows.push([
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.adGroup.id,
      row.adGroup.name,
      row.segments.keyword.info.text || '',
      row.searchTermView.searchTerm,
      microsToCurrency(row.metrics.costMicros),
      row.metrics.clicks,
      row.metrics.impressions,
      row.metrics.ctr || 0,
      row.metrics.conversions
    ]);
  }

  Logger.log(`Found ${rows.length} search terms.`);
  writeToSheet(CONFIG.SHEETS.SEARCH_TERMS, CONFIG.HEADERS.SEARCH_TERMS, rows);
}

/**
 * Write data to a specific sheet
 * @param {string} sheetName - Name of the target sheet
 * @param {string[]} headers - Column headers
 * @param {Array[]} rows - Data rows to write
 */
function writeToSheet(sheetName, headers, rows) {
  if (rows.length === 0) {
    Logger.log(`No data to write to ${sheetName}.`);
    return;
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

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
