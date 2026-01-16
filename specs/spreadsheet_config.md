# Spreadsheet Configuration

This document tracks all Google Spreadsheets used by the Keynote Marketing Dashboard.

## Architecture Decision

Due to Google Sheets' 10 million cell limit per spreadsheet, we use **one spreadsheet per data type** to ensure scalability for 7+ years of historical data.

## Spreadsheet Registry

| Data Type               | Spreadsheet Name          | Spreadsheet ID                                 | Purpose                                         |
| ----------------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| **Raw_Ads_Daily**       | Keynote Ads - Daily       | `16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU` | Campaign metrics by Date × Device × NetworkType |
| **Raw_Ads_Keywords**    | Keynote Ads - Keywords    | `1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8` | Keyword-level metrics with QualityScore         |
| **Raw_Ads_SearchTerms** | Keynote Ads - SearchTerms | `1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY` | Search term data for intent analysis            |
| **Raw_Ads_Geographic**  | Keynote Ads - Geographic  | `1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo` | Campaign metrics by Date × CountryCriterionId   |
| **Raw_GA4_Sessions**    | Keynote GA4 - Sessions    | `1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c` | Session metrics by Campaign × Device × Country  |
| **Raw_GA4_Pages**       | Keynote GA4 - Pages       | `1VVIkEDLOESahgxintmxVB5UHUr6HQxA2f2Bk0L1PxNQ` | Landing page metrics by Campaign × LandingPage  |
| **Raw_GA4_Events**      | Keynote GA4 - Events      | `1XYXcEqxqLEKHv-TUeNVF0FW2jr54aQ2S-eRe3ANqzVQ` | Event counts by Campaign × EventName            |
| **Dashboard**           | Keynote Dashboard         | `1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI` | Summary_Monthly, Summary_Campaigns, System_Logs |

**Note:** The old `Raw_GA4_Daily` spreadsheet (`1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c`) is deprecated and replaced by the three tables above.

## Sheet Structure Per Spreadsheet

### Raw_Ads_Daily Spreadsheet

- `Raw_Ads_Daily` (single sheet)

### Raw_Ads_Keywords Spreadsheet

- `Raw_Ads_Keywords` (single sheet)

### Raw_Ads_SearchTerms Spreadsheet

- `Raw_Ads_SearchTerms` (single sheet)

### Raw_Ads_Geographic Spreadsheet

- `Raw_Ads_Geographic` (single sheet)

### Raw_GA4_Sessions Spreadsheet

- `Raw_GA4_Sessions` (single sheet) - Session metrics by Campaign × Device × Country

### Raw_GA4_Pages Spreadsheet

- `Raw_GA4_Pages` (single sheet) - Landing page metrics by Campaign × LandingPage

### Raw_GA4_Events Spreadsheet

- `Raw_GA4_Events` (single sheet) - Event counts by Campaign × EventName

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
| Raw_GA4_Sessions    | ~50,000   | 10      | ~500,000   | 5%             |
| Raw_GA4_Pages       | ~30,000   | 7       | ~210,000   | 2%             |
| Raw_GA4_Events      | ~20,000   | 4       | ~80,000    | <1%            |
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
const Config = {
  SPREADSHEETS: {
    RAW_ADS_DAILY: "16fP5C-GXSaw3GZrjcETVZug9NW3HV9RBOgNbFcgo0AU",
    RAW_ADS_KEYWORDS: "1hv2Nn-db3OztbtVbGBGmiq4siF1Z3UJJCO7FwIeKJ_8",
    RAW_ADS_SEARCH_TERMS: "1foLJZJ0Pt6FTgZ6UDrzDebW29AlEfOLK_TvZ2Ym8xzY",
    RAW_ADS_GEOGRAPHIC: "1LGuWxT2Dr-phyg2oaew4cbAnK6HZuKi54L3bfGDZWxo",
    RAW_GA4_SESSIONS: "1GVFWLyyK1nhVAdSluvbSoyKP6T6gH9Rnf6rXH9goK7c",
    RAW_GA4_PAGES: "1VVIkEDLOESahgxintmxVB5UHUr6HQxA2f2Bk0L1PxNQ",
    RAW_GA4_EVENTS: "1XYXcEqxqLEKHv-TUeNVF0FW2jr54aQ2S-eRe3ANqzVQ",
    DASHBOARD: "1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI",
  },
  SHEETS: {
    RAW_GA4_SESSIONS: "Raw_GA4_Sessions",
    RAW_GA4_PAGES: "Raw_GA4_Pages",
    RAW_GA4_EVENTS: "Raw_GA4_Events",
    // ... other sheet names
  },
  // ... rest of config
};
```

## Setup Instructions

### Initial Setup (Ads - Complete)

1. ✅ Created 4 Google Ads spreadsheets
2. ✅ Updated `AdsScript_Internal.js` and `AdsScript_Backfill.js` with IDs
3. ✅ Backfilled historical Ads data

### GA4 Setup (Complete)

1. ✅ Created 3 Google Spreadsheets for GA4 data
2. ✅ Updated this config file with the IDs
3. ✅ Updated `src/Config.js` with the IDs
4. ✅ Updated `src/AnalyticsService.js` for three-table architecture
5. ✅ Backfilled historical GA4 data (2022-2026)
6. ✅ Set up daily trigger (4 AM)
