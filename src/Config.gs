/**
 * Configuration for the Marketing Dashboard
 */
const Config = {
  ADS_CUSTOMER_ID: "INSERT_CUSTOMER_ID_HERE", // No dashes, e.g., '1234567890'
  GA4_PROPERTY_ID: "INSERT_PROPERTY_ID_HERE", // e.g., '345678901'

  // Date ranges for default views
  DEFAULT_LOOKBACK_DAYS: 30,

  // Sheet Names
  SHEETS: {
    ADS_DATA: "Raw_Ads_Data",
    GA4_DATA: "Raw_GA4_Data",
    LOGS: "System_Logs",
  },
};
