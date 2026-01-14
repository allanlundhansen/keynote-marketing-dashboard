/**
 * Verification Script for API Credentials
 * Run these functions manually in the Apps Script Editor to test connections.
 */

function testAdsConnection() {
  Logger.log('--- Testing Google Ads API Connection ---');
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format date as YYYY-MM-DD
    const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    Logger.log(`Fetching Ads data for Customer: ${Config.ADS_CUSTOMER_ID}`);
    const results = AdsService.getCampaignReport(Config.ADS_CUSTOMER_ID, fmt(yesterday), fmt(yesterday));
    
    Logger.log('Success! API responded.');
    Logger.log(`Rows retrieved: ${results.length}`);
    if (results.length > 0) {
      Logger.log('Sample Data (First Row):');
      Logger.log(JSON.stringify(results[0]));
    } else {
      Logger.log('No data returned (Account might be idle yesterday).');
    }
  } catch (e) {
    Logger.log('FAILURE: Ads API Test Failed');
    Logger.log(e.toString());
  }
}

function testGA4Connection() {
  Logger.log('--- Testing GA4 Data API Connection ---');
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const fmt = (d) => Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    Logger.log(`Fetching GA4 data for Property: ${Config.GA4_PROPERTY_ID}`);
    const results = AnalyticsService.getBasicReport(Config.GA4_PROPERTY_ID, fmt(yesterday), fmt(yesterday));
    
    if (results.rows) {
      Logger.log('Success! API responded.');
      Logger.log(`Rows retrieved: ${results.rows.length}`);
      if (results.rows.length > 0) {
        Logger.log('Sample Row:');
        Logger.log(results.rows[0]);
      }
    } else {
       Logger.log('Success! API responded but returned no rows (Website might be idle).');
       Logger.log('Raw Response: ' + JSON.stringify(results));
    }
    
  } catch (e) {
    Logger.log('FAILURE: GA4 API Test Failed');
    Logger.log(e.toString());
  }
}
