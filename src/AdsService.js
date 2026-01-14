/**
 * Service to interact with Google Ads Data (Hybrid Model)
 * In this model, an external Google Ads Script pushes data to Sheets.
 * This service simply reads that data for the dashboard.
 */

const AdsService = {
  /**
   * Retrieves campaign performance data from the Sheet (populated by external script)
   * The date params are kept for API consistency, but we filter the sheet data.
   * 
   * @param {string} customerId - Unused in hybrid model (kept for interface compatibility)
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @return {Array} List of campaign metrics
   */
  getCampaignReport: function(customerId, startDate, endDate) {
    // We read from the Sheet defined in Config
    const data = SheetManager.getData(Config.SHEETS.ADS_DATA);
    
    if (!data || data.length === 0) {
      console.warn('No Ads data found in Sheet.');
      return this.getMockData();
    }

    // Filter by date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Convert sheet rows to object format
    // Sheet Headers: Date, Campaign ID, Campaign Name, Cost, Clicks, Impressions, Conversions
    const rows = [];
    
    data.forEach(row => {
      // Row[0] is Date string (YYYY-MM-DD)
      const rowDate = new Date(row[0]);
      
      // Check if date is within range
      if (rowDate >= start && rowDate <= end) {
        rows.push({
          date: row[0],
          campaignId: row[1],
          name: row[2],
          cost: parseFloat(row[3]) || 0,
          clicks: parseInt(row[4]) || 0,
          impressions: parseInt(row[5]) || 0,
          conversions: parseFloat(row[6]) || 0
        });
      }
    });

    return rows;
  },

  /**
   * Returns mock data if sheet is empty
   */
  getMockData: function() {
    return [
      {
        campaignId: '123456789',
        name: 'Keynote - Leadership - Search (Mock)',
        cost: 150.00,
        clicks: 120,
        impressions: 4500,
        conversions: 3
      },
      {
        campaignId: '987654321',
        name: 'Display - Retargeting (Mock)',
        cost: 45.50,
        clicks: 300,
        impressions: 25000,
        conversions: 1
      }
    ];
  }
};
