# Phase 1: Foundation (MVP) Requirements

## Overview

This phase establishes the core infrastructure for collecting Google Ads and GA4 data, storing it in Google Sheets with full granularity (Campaign → Ad Group → Keyword → Search Term), and providing a basic dashboard to verify the pipeline works.

## Functional Requirements

### 1. Data Integration - Google Ads (via Internal Script)

#### 1.1 Daily Export Script
- [ ] Script must run inside Google Ads account (not via external API)
- [ ] Script must export data for 4 levels of granularity:
  - Campaign level → `Raw_Ads_Campaigns` sheet
  - Ad Group level → `Raw_Ads_AdGroups` sheet
  - Keyword level → `Raw_Ads_Keywords` sheet
  - Search Term level → `Raw_Ads_SearchTerms` sheet
- [ ] Script must be schedulable for daily automated runs (e.g., 3 AM)
- [ ] Script must handle the case where sheets don't exist (create with headers)

#### 1.2 Historical Backfill Script
- [ ] One-time script to export historical data (minimum 2 years)
- [ ] Must populate all 4 Ads sheets with historical data
- [ ] Must handle Google Ads script execution time limits (chunk if necessary)

#### 1.3 Campaign Metrics (per day)
- [ ] Date
- [ ] Campaign ID & Name
- [ ] Status (ENABLED, PAUSED, REMOVED)
- [ ] Cost (converted from micros)
- [ ] Clicks, Impressions, CTR
- [ ] Average CPC
- [ ] Conversions, Cost per Conversion
- [ ] Search Impression Share

#### 1.4 Ad Group Metrics (per day)
- [ ] Date
- [ ] Campaign ID & Name (parent)
- [ ] Ad Group ID & Name
- [ ] Status
- [ ] Cost, Clicks, Impressions, CTR
- [ ] Average CPC, Conversions

#### 1.5 Keyword Metrics (per day)
- [ ] Date
- [ ] Campaign ID & Name (parent)
- [ ] Ad Group ID & Name (parent)
- [ ] Keyword ID, Text, Match Type
- [ ] Status
- [ ] Quality Score (when available)
- [ ] Cost, Clicks, Impressions, CTR
- [ ] Average CPC, Conversions

#### 1.6 Search Term Metrics (per day)
- [ ] Date
- [ ] Campaign ID & Name
- [ ] Ad Group ID & Name
- [ ] Matched Keyword Text
- [ ] Actual Search Term (user query)
- [ ] Cost, Clicks, Impressions, CTR
- [ ] Conversions

### 2. Data Integration - GA4 (via API)

- [ ] System must authenticate with GA4 Data API using configured Property ID
- [ ] System must fetch daily session metrics:
  - Sessions, Users, Conversions, Bounce Rate
- [ ] Data must be stored in `Raw_GA4_Data` sheet
- [ ] API configuration stored in `Config.js`

### 3. Data Storage (Google Sheets)

- [ ] System must automatically create required sheets if they do not exist:
  - `Raw_Ads_Campaigns`
  - `Raw_Ads_AdGroups`
  - `Raw_Ads_Keywords`
  - `Raw_Ads_SearchTerms`
  - `Raw_GA4_Data`
  - `System_Logs`
- [ ] Each sheet must have appropriate headers on first row
- [ ] New data fetches must append rows (not overwrite history)
- [ ] All data must include a Date column for historical analysis

### 4. Basic Dashboard (Frontend)

- [ ] Web App served via Apps Script (`doGet`)
- [ ] Display summary metrics (Last 30 days):
  - Total Spend
  - Total Clicks
  - Total Impressions
  - Total Sessions (from GA4)
  - Total Conversions
- [ ] Display list of active campaigns with key metrics
- [ ] Loading state while data is being fetched
- [ ] Error state if data fetch fails

### 5. Configuration

- [ ] All environment-specific values in `Config.js`:
  - Google Ads Customer ID
  - GA4 Property ID
  - Google Sheet ID (for Ads scripts)
  - Sheet names
  - Default lookback period

## Non-Functional Requirements

### Performance
- Dashboard load time under 3 seconds for basic view
- Google Ads scripts must complete within execution time limits (30 min for scheduled)

### Reliability
- API/script failures logged to `System_Logs` sheet
- Mock data fallback for development/testing when APIs unavailable

### Security
- No hardcoded secrets in codebase
- OAuth handled automatically by Apps Script
- Google Sheet accessible only to account owner

### Maintainability
- Clear separation of concerns (Config, Services, SheetManager)
- Consistent naming conventions across sheets and code

## Acceptance Criteria

### Data Pipeline
- [ ] Running daily Ads script populates all 4 Ads sheets with yesterday's data
- [ ] Running backfill script populates historical data (2+ years)
- [ ] Running `refreshData()` in Apps Script populates `Raw_GA4_Data`
- [ ] All sheets have correct headers and data types

### Dashboard
- [ ] Opening Web App URL shows dashboard with real data
- [ ] Metrics displayed match data in sheets (spot-check verification)
- [ ] Dashboard loads within 3 seconds

### Verification
- [ ] `testGA4Connection()` returns success with real data
- [ ] Ads script Preview shows success logs
- [ ] Manual comparison of 3 random dates against Google Ads UI matches
