/**
 * Service to interact with Google Analytics 4 (GA4) Data API
 * Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

const AnalyticsService = {
  /**
   * Fetches session and user metrics
   * @param {string} propertyId - GA4 Property ID
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @return {Object} Aggregated metrics
   */
  getBasicReport: function(propertyId, startDate, endDate) {
    if (!propertyId || propertyId.includes('INSERT')) {
       console.warn('Skipping GA4 API call: Property ID not configured.');
       return this.getMockData();
    }

    // GA4 Data API Endpoint
    // https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const token = ScriptApp.getOAuthToken();

    const requestBody = {
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      metrics: [
        { name: 'sessions' }, 
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'bounceRate' }
      ],
      dimensions: [
        { name: 'date' }
      ]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      const content = response.getContentText();

      if (code !== 200) {
        throw new Error(`GA4 API Error (${code}): ${content}`);
      }

      return JSON.parse(content);

    } catch (e) {
      console.error('Failed to fetch GA4 data:', e.message);
      Logger.log('Falling back to mock GA4 data.');
      return this.getMockData();
    }
  },

  /**
   * Mock data for dev
   */
  getMockData: function() {
    return {
      rows: [
        {
          dimensionValues: [{ value: '2023-10-01' }],
          metricValues: [
            { value: '150' }, // sessions
            { value: '120' }, // users
            { value: '5' },   // conversions
            { value: '0.45' } // bounce rate
          ]
        }
      ]
    };
  }
};
