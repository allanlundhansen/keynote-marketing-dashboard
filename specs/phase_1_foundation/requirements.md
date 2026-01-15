# Phase 1: Foundation (MVP) Requirements

## Overview

This phase establishes the core infrastructure for collecting Google Ads and GA4 data, storing it in a two-tier model (raw + summary sheets), and providing a fast-loading dashboard for time-based performance analysis.

## Functional Requirements

### 1. Data Integration - Google Ads (via Internal Script)

#### 1.1 Daily Export Script

- [ ] Script must run inside Google Ads account (not via external API)
- [ ] Script must export to 4 raw data sheets:
  - Campaign-level by Device × NetworkType → `Raw_Ads_Daily`
  - Keyword-level → `Raw_Ads_Keywords`
  - Search Term-level → `Raw_Ads_SearchTerms`
  - Campaign-level by Country → `Raw_Ads_Geographic`
- [ ] Script must be schedulable for daily automated runs (3 AM)
- [ ] Script must handle the case where sheets don't exist (create with headers)

#### 1.2 Historical Backfill Script

- [ ] One-time script to export historical data (up to 7 years where available)
- [ ] Must populate all 4 raw Ads sheets with historical data
- [ ] Must handle Google Ads script execution time limits (chunk by year if necessary)

#### 1.3 Raw_Ads_Daily Metrics (per Date × Campaign × Device × NetworkType)

- [ ] Date
- [ ] Campaign ID, Name, Type (SEARCH, DISPLAY, etc.)
- [ ] Status (ENABLED, PAUSED, REMOVED)
- [ ] Device (DESKTOP, MOBILE, TABLET)
- [ ] NetworkType (SEARCH, DISPLAY, YOUTUBE, etc.)
- [ ] Cost (converted from micros)
- [ ] Clicks, Impressions, CTR
- [ ] Average CPC
- [ ] Conversions, Cost per Conversion
- [ ] Search Impression Share

**Note:** Country is in a separate sheet due to Google Ads API segment restrictions.

#### 1.4 Raw_Ads_Keywords Metrics (per Date × Keyword × Device × NetworkType)

- [ ] Date
- [ ] Campaign ID, Name, Type
- [ ] Ad Group ID, Name
- [ ] Keyword ID, Text, Match Type
- [ ] Status, Quality Score
- [ ] Device, NetworkType
- [ ] Cost, Clicks, Impressions, CTR, AvgCPC, Conversions

#### 1.5 Raw_Ads_SearchTerms Metrics (per Date × SearchTerm × Device)

- [ ] Date
- [ ] Campaign ID, Name, Type
- [ ] Ad Group ID, Name
- [ ] Matched Keyword Text
- [ ] Actual Search Term (user query)
- [ ] Device
- [ ] Cost, Clicks, Impressions, CTR, Conversions

#### 1.6 Raw_Ads_Geographic Metrics (per Date × Campaign × CountryCriterionId)

- [ ] Date
- [ ] Campaign ID, Name, Type
- [ ] CountryCriterionId (numeric geo target criterion ID, e.g., 2840 = USA)
- [ ] Cost, Clicks, Impressions, CTR, Conversions

**Note:** Cannot include Device or NetworkType due to API segment incompatibility. Uses `geographic_view` resource which returns criterion IDs instead of country names. Country names resolved in dashboard/aggregation layer.

### 2. Data Integration - GA4 (via API)

- [ ] System must authenticate with GA4 Data API using configured Property ID
- [ ] System must fetch daily metrics by campaign, device, and country:
  - Sessions, Users, Engaged Sessions
  - Bounce Rate, Average Session Duration
  - Conversions
- [ ] Data must be stored in `Raw_GA4_Daily` sheet
- [ ] API configuration stored in `Config.js`
- [ ] Daily pull scheduled at 4 AM (after Ads script completes)

### 3. Data Storage (Google Sheets)

#### 3.1 Raw Data Sheets (Source of Truth)

- [ ] System must automatically create required sheets if they do not exist:
  - `Raw_Ads_Daily`
  - `Raw_Ads_Keywords`
  - `Raw_Ads_SearchTerms`
  - `Raw_Ads_Geographic`
  - `Raw_GA4_Daily`
  - `System_Logs`
- [ ] Each sheet must have appropriate headers on first row
- [ ] New data fetches must append rows (not overwrite history)
- [ ] All data must include a Date column for historical analysis

#### 3.2 Summary Sheets (Dashboard Source)

- [ ] System must create and maintain summary sheets:
  - `Summary_Monthly` - Monthly aggregates by Campaign × Device × NetworkType
  - `Summary_Campaigns` - Campaign-level totals (all-time, YTD, last 12 months)
- [ ] Summary sheets must be recomputed nightly (5 AM trigger)
- [ ] Summary sheets are overwritten (not appended) on each computation

### 4. Nightly Aggregation Job

- [ ] Apps Script time-driven trigger at 5 AM
- [ ] Reads from raw data sheets
- [ ] Computes monthly aggregates with both Ads and GA4 metrics
- [ ] Handles GA4 join limitation (no NetworkType in GA4)
- [ ] Writes to summary sheets
- [ ] Logs success/failure to System_Logs

### 5. Dashboard (Frontend)

#### 5.1 Performance Requirements

- [ ] Initial page load under 2 seconds
- [ ] Dashboard reads from Summary sheets only (not raw data)
- [ ] Client-side filtering/aggregation on loaded data

#### 5.2 Core Views

- [ ] **Overall Performance**: Total spend, clicks, impressions, sessions, conversions
- [ ] **Time Comparison**: Current month vs same month last year (YoY)
- [ ] **Trend View**: Monthly performance over time
- [ ] **Campaign Breakdown**: Performance by campaign
- [ ] **Network Analysis**: SEARCH vs DISPLAY vs other network types
- [ ] **Device Analysis**: DESKTOP vs MOBILE vs TABLET

#### 5.3 Drill-Down Capability

- [ ] Keyword-level detail view (reads from Raw_Ads_Keywords)
- [ ] Search term view (reads from Raw_Ads_SearchTerms)
- [ ] Acceptable delay for drill-down views (2-3 seconds)

#### 5.4 UI States

- [ ] Loading state while data is being fetched
- [ ] Error state if data fetch fails
- [ ] Empty state if no data for selected filters

### 6. Configuration

- [ ] All environment-specific values in `Config.js`:
  - Google Ads Customer ID
  - GA4 Property ID
  - Google Sheet ID
  - Sheet names (raw and summary)
  - Default lookback period

## Non-Functional Requirements

### Performance

| Operation | Target |
|-----------|--------|
| Dashboard initial load | < 2 seconds |
| Filter/view change | < 0.5 seconds |
| Keyword drill-down | < 3 seconds |
| Nightly aggregation | < 10 minutes |
| Daily Ads script | < 15 minutes |

### Reliability

- API/script failures logged to `System_Logs` sheet
- Nightly aggregation failure should not affect raw data
- Dashboard should show "data as of" timestamp

### Security

- No hardcoded secrets in codebase
- OAuth handled automatically by Apps Script
- Google Sheet accessible only to account owner

### Maintainability

- Clear separation of concerns (Config, Services, SheetManager, Aggregation)
- Consistent naming conventions across sheets and code
- Two-tier data model: raw (audit) + summary (speed)

## Acceptance Criteria

### Data Pipeline

- [ ] Daily Ads script populates Raw_Ads_Daily, Raw_Ads_Keywords, Raw_Ads_SearchTerms, Raw_Ads_Geographic
- [ ] Daily GA4 pull populates Raw_GA4_Daily
- [ ] Backfill script successfully loads 2+ years of historical data
- [ ] Nightly aggregation produces Summary_Monthly and Summary_Campaigns
- [ ] All sheets have correct headers and data types

### Dashboard

- [ ] Opening Web App URL shows dashboard with real data in < 2 seconds
- [ ] Can view January 2024 vs January 2025 performance comparison
- [ ] Can filter by Campaign, Device, NetworkType
- [ ] Can drill down to keyword detail for a specific campaign
- [ ] Metrics displayed match source data (spot-check verification)

### Verification

- [ ] `testGA4Connection()` returns success with real data
- [ ] Ads script Preview shows success logs
- [ ] Manual comparison of 3 random dates against Google Ads UI matches
- [ ] Summary_Monthly totals match Raw_Ads_Daily totals for same period
