# Phase 1: Foundation (MVP) Tasks

## Setup & Configuration

- [x] Initialize project structure (clasp, git)
- [x] Create centralized `Config.js`
- [x] Configure OAuth scopes in `appsscript.json`
- [x] Validate GA4 API access with real credentials
- [ ] Update `Config.js` with new sheet names (4 Ads sheets)

## Google Ads Internal Scripts

### Daily Export Script (`AdsScript_Internal.js`)

- [x] Basic script structure with config
- [ ] Expand to export Campaign-level data with all metrics
- [ ] Add Ad Group-level query and export
- [ ] Add Keyword-level query and export
- [ ] Add Search Term-level query and export
- [ ] Ensure sheets are created with headers if missing
- [ ] Test with Preview in Google Ads
- [ ] Deploy and schedule for daily run (3 AM)

### Historical Backfill Script (`AdsScript_Backfill.js`)

- [ ] Create backfill script with configurable date range
- [ ] Implement Campaign backfill (2+ years)
- [ ] Implement Ad Group backfill
- [ ] Implement Keyword backfill
- [ ] Implement Search Term backfill
- [ ] Handle execution time limits (chunking if needed)
- [ ] Test with Preview
- [ ] Run one-time to populate historical data

## Backend Services (Apps Script)

### AdsService.js
- [x] Basic implementation reading from sheets
- [ ] Update to read from new sheet structure (4 sheets)
- [ ] Add methods for each data level (campaigns, adGroups, keywords, searchTerms)

### AnalyticsService.js
- [x] Implement `getBasicReport()` with GA4 Data API
- [x] Verify connection with `testGA4Connection()`

### SheetManager.js
- [x] Basic sheet operations (find, create, append)
- [ ] Update `setupSheets()` for new 6-sheet structure
- [ ] Add sheet-specific header definitions

### Config.js
- [x] Basic configuration with API IDs
- [ ] Add new sheet names:
  - `Raw_Ads_Campaigns`
  - `Raw_Ads_AdGroups`
  - `Raw_Ads_Keywords`
  - `Raw_Ads_SearchTerms`

## Frontend Implementation

### Dashboard UI (`index.html`)
- [x] Basic HTML skeleton
- [ ] Add CSS styling for metric cards
- [ ] Implement responsive grid layout
- [ ] Add loading state indicator
- [ ] Add error state handling

### Client-Side Logic
- [ ] Implement `google.script.run.getDashboardData()` call
- [ ] Render summary metrics (Spend, Clicks, Impressions, Sessions, Conversions)
- [ ] Render campaign list with key metrics
- [ ] Add data refresh button

## Verification & Deployment

### Data Pipeline Verification
- [x] Test GA4 API connection
- [x] Test basic Ads script execution
- [ ] Verify all 4 Ads sheets populate correctly
- [ ] Verify GA4 sheet populates correctly
- [ ] Spot-check 3 random dates against Google Ads UI

### Web App Deployment
- [ ] Deploy as Test Deployment
- [ ] Verify dashboard loads with real data
- [ ] Verify load time < 3 seconds

### Git
- [ ] Commit expanded script and spec updates
- [ ] Push to GitHub

## Status Legend

- [x] Complete
- [ ] Pending
