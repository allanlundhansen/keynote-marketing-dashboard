# Spreadsheet Configuration

This document tracks all Google Spreadsheets used by the Keynote Marketing Dashboard.

## Architecture Decision

Due to Google Sheets' 10 million cell limit per spreadsheet, we use **one spreadsheet per data type** to ensure scalability for 7+ years of historical data.

## Spreadsheet Registry

| Data Type               | Spreadsheet Name          | Spreadsheet ID                                 | Purpose                                            |
| ----------------------- | ------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| **Raw_Ads_Daily**       | Keynote Ads - Daily       | `16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU` | Campaign metrics by Date × Device × NetworkType    |
| **Raw_Ads_Keywords**    | Keynote Ads - Keywords    | `1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8` | Keyword-level metrics with QualityScore            |
| **Raw_Ads_SearchTerms** | Keynote Ads - SearchTerms | `1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY` | Search term data for intent analysis               |
| **Raw_Ads_Geographic**  | Keynote Ads - Geographic  | `1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo` | Campaign metrics by Date × CountryCriterionId      |
| **Raw_GA4_Daily**       | Keynote GA4 - Daily       | `1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c` | GA4 session metrics by Campaign × Device × Country |
| **Dashboard**           | Keynote Dashboard         | `1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI` | Summary_Monthly, Summary_Campaigns, System_Logs    |

## Sheet Structure Per Spreadsheet

### Raw_Ads_Daily Spreadsheet

- `Raw_Ads_Daily` (single sheet)

### Raw_Ads_Keywords Spreadsheet

- `Raw_Ads_Keywords` (single sheet)

### Raw_Ads_SearchTerms Spreadsheet

- `Raw_Ads_SearchTerms` (single sheet)

### Raw_Ads_Geographic Spreadsheet

- `Raw_Ads_Geographic` (single sheet)

### Raw_GA4_Daily Spreadsheet

- `Raw_GA4_Daily` (single sheet)

### Dashboard Spreadsheet

- `Summary_Monthly` - Pre-aggregated monthly data for fast dashboard queries
- `Summary_Campaigns` - Campaign-level totals
- `System_Logs` - Error and debug logging

## Estimated Cell Usage (7 Years)

| Spreadsheet         | Est. Rows | Columns | Est. Cells | % of 10M Limit |
| ------------------- | --------- | ------- | ---------- | -------------- |
| Raw_Ads_Daily       | ~35,000   | 15      | ~525,000   | 5%             |
| Raw_Ads_Keywords    | ~210,000  | 19      | ~4,000,000 | 40%            |
| Raw_Ads_SearchTerms | ~500,000+ | 14      | ~7,000,000 | 70%            |
| Raw_Ads_Geographic  | ~50,000   | 10      | ~500,000   | 5%             |
| Raw_GA4_Daily       | ~50,000   | 10      | ~500,000   | 5%             |
| Dashboard           | ~5,000    | 20      | ~100,000   | 1%             |

## Config Usage

### Google Ads Scripts (AdsScript_Internal.js, AdsScript_Backfill.js)

```javascript
const CONFIG = {
  SPREADSHEETS: {
    DAILY: "16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU",
    KEYWORDS: "1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8",
    SEARCH_TERMS: "1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY",
    GEOGRAPHIC: "1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo",
  },
  // ... rest of config
};
```

### Apps Script Backend (Config.js)

```javascript
const CONFIG = {
  SPREADSHEETS: {
    RAW_ADS_DAILY: "16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU",
    RAW_ADS_KEYWORDS: "1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8",
    RAW_ADS_SEARCH_TERMS: "1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY",
    RAW_ADS_GEOGRAPHIC: "1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo",
    RAW_GA4_DAILY: "1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c",
    DASHBOARD: "1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI",
  },
  // ... rest of config
};
```

## Setup Instructions

1. Create 5 new Google Spreadsheets (one for each raw data type)
2. Name them according to the "Spreadsheet Name" column above
3. Copy each Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
4. Update this config file with the IDs
5. Update `AdsScript_Internal.js` and `AdsScript_Backfill.js` with the IDs
6. Update `src/Config.js` with the IDs
