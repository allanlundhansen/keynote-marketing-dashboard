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

> **Note:** Dashboard data fetching functions moved to Phase 2 (Dashboard Frontend).

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

### Device Dimension in Events (ADR-014)

- [x] Update `fetchGA4Events()` to include `deviceCategory` dimension
- [x] Update `HEADERS_EVENTS` constant to include Device
- [x] Update `processEventsResponse()` to include Device
- [x] Clear existing Raw_GA4_Events spreadsheet data
- [x] Re-backfill Events data for 2022-2026

### AggregationService.js (NEW)

- [x] Create new service for nightly aggregation
- [x] Implement `aggregateMonthly()` - aggregate Ads + Sessions by YearMonth × Campaign × Device
- [x] Implement `aggregateEvents()` - aggregate Events by YearMonth × Campaign × Device × EventName
- [x] Implement `aggregateCampaigns()` - compute campaign totals with JSON event counts
- [x] Implement `nightlyAggregation()` - main entry point
- [x] Set up time-driven trigger for 5 AM

### SheetManager.js

- [x] Basic sheet operations (find, create, append)

> **Note:** Sheets are created on-demand by AdsScript, AnalyticsService, and AggregationService. A formal `setupSheets()` function is not required.

### Config.js

- [x] Basic configuration with API IDs
- [x] Update sheet names and spreadsheet IDs:
  - Raw Ads: `Raw_Ads_Daily`, `Raw_Ads_Keywords`, `Raw_Ads_SearchTerms`, `Raw_Ads_Geographic`
  - Raw GA4: `Raw_GA4_Sessions`, `Raw_GA4_Pages`, `Raw_GA4_Events`
  - Summary: `Summary_Monthly`, `Summary_Campaigns`
  - System: `System_Logs`

## Verification & Deployment

> **Note:** Frontend implementation moved to Phase 2 (Dashboard Frontend). See `specs/phase_2_dashboard/`.

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

### Git

- [ ] Commit updated scripts with new data model
- [ ] Commit updated spec documents
- [ ] Push to GitHub

## Status Legend

- [x] Complete
- [ ] Pending
