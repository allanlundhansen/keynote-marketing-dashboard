/**
 * Configuration for the Marketing Dashboard
 */
const Config = {
  // API Credentials
  ADS_CUSTOMER_ID: '2354667197',
  ADS_DEVELOPER_TOKEN: 'T5G39bSDhaz09rWCDw6XaA',
  GA4_PROPERTY_ID: '286484256',

  // Date ranges for default views
  DEFAULT_LOOKBACK_DAYS: 30,

  // Multi-spreadsheet architecture (one per data type due to 10M cell limit)
  // See specs/spreadsheet_config.md for details
  SPREADSHEETS: {
    RAW_ADS_DAILY: '16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU',
    RAW_ADS_KEYWORDS: '1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8',
    RAW_ADS_SEARCH_TERMS: '1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY',
    RAW_ADS_GEOGRAPHIC: '1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo',
    RAW_GA4_SESSIONS: '1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c',
    RAW_GA4_PAGES: '1VVIkEDLOESahgxintmxVB5UHUr6HQxA2f2Bk0L1PxNQ',
    RAW_GA4_EVENTS: '1XYXcEqxqLEKHv-TUeNVF0FW2jr54aQ2S-eRe3ANqzVQ',
    DASHBOARD: '1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI'
  },

  // Sheet names within each spreadsheet
  SHEETS: {
    RAW_ADS_DAILY: 'Raw_Ads_Daily',
    RAW_ADS_KEYWORDS: 'Raw_Ads_Keywords',
    RAW_ADS_SEARCH_TERMS: 'Raw_Ads_SearchTerms',
    RAW_ADS_GEOGRAPHIC: 'Raw_Ads_Geographic',
    RAW_GA4_SESSIONS: 'Raw_GA4_Sessions',
    RAW_GA4_PAGES: 'Raw_GA4_Pages',
    RAW_GA4_EVENTS: 'Raw_GA4_Events',
    SUMMARY_MONTHLY: 'Summary_Monthly',
    SUMMARY_EVENTS: 'Summary_Events',
    SUMMARY_CAMPAIGNS: 'Summary_Campaigns',
    SYSTEM_LOGS: 'System_Logs'
  }
};
