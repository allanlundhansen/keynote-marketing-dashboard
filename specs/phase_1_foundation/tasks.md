# Phase 1: Foundation (MVP) Tasks

## Setup & Configuration

- [x] Initialize project structure (clasp, git)
- [x] Create centralized `Config.js`
- [x] Configure OAuth scopes in `appsscript.json`
- [x] Validate GA4 API access with real credentials
- [x] Update `Config.js` with new sheet names (raw + summary sheets)

## Google Ads Internal Scripts

### Daily Export Script (`AdsScript_Internal.js`)

- [x] Basic script structure with config
- [x] Export to `Raw_Ads_Daily` (Date × Campaign × Device × NetworkType)
- [x] Export to `Raw_Ads_Keywords` (Keyword-level with Device, NetworkType)
- [x] Export to `Raw_Ads_SearchTerms` (Search term with Device)
- [x] Export to `Raw_Ads_Geographic` (Date × Campaign × CountryCriterionId via `geographic_view`)
- [x] Ensure sheets are created with headers if missing
- [x] Test with Preview in Google Ads
- [x] Deploy and schedule for daily run (3 AM)

**Note:** Device/NetworkType and Country require separate queries due to Google Ads API segment restrictions. Geographic uses `geographic_view` resource which returns criterion IDs.

### Historical Backfill Script (`AdsScript_Backfill.js`)

- [x] Create backfill script with configurable date range
- [x] Update to match new sheet structure (Raw_Ads_Daily, Raw_Ads_Keywords, Raw_Ads_SearchTerms, Raw_Ads_Geographic)
- [x] Handle execution time limits (chunk by year via configurable START_DATE/END_DATE)
- [x] Test with Preview (2024 data - 5424 daily, 30777 keywords, 83954 search terms, 7462 geographic)
- [x] Run one-time to populate historical data (2022-2025 complete; 2018-2021 deferred)

## Backend Services (Apps Script)

### AdsService.js

- [x] Basic implementation reading from sheets
- [ ] Update to read from `Summary_Monthly` for dashboard
- [ ] Update to read from `Summary_Campaigns` for campaign list
- [ ] Add drill-down methods for raw data (keywords, search terms)

### AnalyticsService.js

**Three-Table Architecture** (see ADR-013):
- `Raw_GA4_Sessions` - Session metrics by Campaign × Device × Country
- `Raw_GA4_Pages` - Landing page metrics by Campaign × LandingPage
- `Raw_GA4_Events` - Event counts by Campaign × EventName

**Setup:**
- [x] Create 3 new Google Spreadsheets for GA4 data
- [x] Update `specs/spreadsheet_config.md` with new spreadsheet IDs
- [x] Update `src/Config.js` with new spreadsheet IDs

**Implementation:**
- [x] Implement `getBasicReport()` with GA4 Data API
- [x] Verify connection with `testGA4Connection()`
- [x] Rewrite `fetchGA4Data()` to use three-table architecture:
  - [x] `fetchGA4Sessions(startDate, endDate)` - Campaign × Device × Country
  - [x] `fetchGA4Pages(startDate, endDate)` - Campaign × LandingPage
  - [x] `fetchGA4Events(startDate, endDate)` - Campaign × EventName
- [x] Filter to campaign traffic only (exclude direct/organic)
- [x] Implement `pullDailyGA4()` to call all three fetch functions
- [x] Test with `testGA4Fetch()` function
- [x] Backfill historical GA4 data (2022-2026)
- [x] Schedule daily pull at 4 AM

### AggregationService.js (NEW)

- [ ] Create new service for nightly aggregation
- [ ] Implement `aggregateMonthly()` - aggregate raw data by YearMonth × Campaign × Device × NetworkType
- [ ] Implement `aggregateCampaigns()` - compute campaign totals (all-time, YTD, 12mo)
- [ ] Implement `joinGA4Data()` - merge GA4 metrics at Campaign × Device level
- [ ] Implement `nightlyAggregation()` - main entry point
- [ ] Handle GA4 join limitation (repeat GA4 metrics across NetworkType rows)
- [ ] Set up time-driven trigger for 5 AM

### SheetManager.js

- [x] Basic sheet operations (find, create, append)
- [ ] Update `setupSheets()` for new 10-sheet structure:
  - Raw Ads: `Raw_Ads_Daily`, `Raw_Ads_Keywords`, `Raw_Ads_SearchTerms`, `Raw_Ads_Geographic`
  - Raw GA4: `Raw_GA4_Sessions`, `Raw_GA4_Pages`, `Raw_GA4_Events`
  - Summary: `Summary_Monthly`, `Summary_Campaigns`
  - System: `System_Logs`
- [ ] Add sheet-specific header definitions
- [ ] Add `overwriteSheet()` method for summary sheets

### Config.js

- [x] Basic configuration with API IDs
- [x] Update sheet names and spreadsheet IDs:
  - Raw Ads: `Raw_Ads_Daily`, `Raw_Ads_Keywords`, `Raw_Ads_SearchTerms`, `Raw_Ads_Geographic`
  - Raw GA4: `Raw_GA4_Sessions`, `Raw_GA4_Pages`, `Raw_GA4_Events`
  - Summary: `Summary_Monthly`, `Summary_Campaigns`
  - System: `System_Logs`

## Frontend Implementation

### Dashboard UI (`index.html`)

- [x] Basic HTML skeleton
- [ ] Add CSS styling for metric cards
- [ ] Implement responsive grid layout
- [ ] Add loading state indicator
- [ ] Add error state handling
- [ ] Add "data as of" timestamp display

### Client-Side Logic

- [ ] Implement `google.script.run.getDashboardData()` call
- [ ] Render overall performance metrics (Spend, Clicks, Impressions, Sessions, Conversions)
- [ ] Implement YoY comparison view (current month vs same month last year)
- [ ] Implement campaign breakdown view
- [ ] Implement network type breakdown (SEARCH vs DISPLAY)
- [ ] Implement device breakdown (DESKTOP vs MOBILE vs TABLET)
- [ ] Add drill-down to keyword detail
- [ ] Add drill-down to search term detail
- [ ] Add landing page performance view (from Raw_GA4_Pages)
- [ ] Add conversion event selector (let user pick which events = "conversion" from Raw_GA4_Events)

## Verification & Deployment

### Data Pipeline Verification

- [x] Test GA4 API connection
- [x] Test basic Ads script execution
- [x] Verify Raw_Ads_Daily populates correctly with Device, NetworkType
- [x] Verify Raw_Ads_Keywords populates correctly
- [x] Verify Raw_Ads_SearchTerms populates correctly
- [x] Verify Raw_Ads_Geographic populates correctly with CountryCriterionId
- [x] Verify Raw_GA4_Sessions populates correctly (Campaign × Device × Country)
- [x] Verify Raw_GA4_Pages populates correctly (Campaign × LandingPage)
- [x] Verify Raw_GA4_Events populates correctly (Campaign × EventName)
- [ ] Verify Summary_Monthly is computed correctly
- [ ] Verify Summary_Campaigns is computed correctly
- [ ] Spot-check 3 random dates against Google Ads UI
- [ ] Verify Summary totals match Raw totals for same period

### Web App Deployment

- [ ] Deploy as Test Deployment
- [ ] Verify dashboard loads with real data
- [ ] Verify load time < 2 seconds
- [ ] Verify YoY comparison works
- [ ] Verify drill-down views work

### Git

- [ ] Commit updated scripts with new data model
- [ ] Commit updated spec documents
- [ ] Push to GitHub

## Status Legend

- [x] Complete
- [ ] Pending
