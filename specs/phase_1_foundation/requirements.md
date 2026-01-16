# Phase 1: Foundation (MVP) Requirements

## Overview

This phase establishes the core infrastructure for collecting Google Ads and GA4 data, storing it in a two-tier model (raw + summary sheets), and providing a fast-loading dashboard for time-based performance analysis.

## Functional Requirements

### 1. Data Integration - Google Ads (via Internal Script)

#### 1.1 Daily Export Script

- [x] Script must run inside Google Ads account (not via external API)
- [x] Script must export to 4 raw data sheets:
  - Campaign-level by Device × NetworkType → `Raw_Ads_Daily`
  - Keyword-level → `Raw_Ads_Keywords`
  - Search Term-level → `Raw_Ads_SearchTerms`
  - Campaign-level by Country → `Raw_Ads_Geographic`
- [x] Script must be schedulable for daily automated runs (3 AM)
- [x] Script must handle the case where sheets don't exist (create with headers)

#### 1.2 Historical Backfill Script

- [x] One-time script to export historical data (up to 7 years where available)
- [x] Must populate all 4 raw Ads sheets with historical data
- [x] Must handle Google Ads script execution time limits (chunk by year if necessary)

#### 1.3 Raw_Ads_Daily Metrics (per Date × Campaign × Device × NetworkType)

- [x] Date
- [x] Campaign ID, Name, Type (SEARCH, DISPLAY, etc.)
- [x] Status (ENABLED, PAUSED, REMOVED)
- [x] Device (DESKTOP, MOBILE, TABLET)
- [x] NetworkType (SEARCH, DISPLAY, YOUTUBE, etc.)
- [x] Cost (converted from micros)
- [x] Clicks, Impressions, CTR
- [x] Average CPC
- [x] Conversions, Cost per Conversion
- [x] Search Impression Share

**Note:** Country is in a separate sheet due to Google Ads API segment restrictions.

#### 1.4 Raw_Ads_Keywords Metrics (per Date × Keyword × Device × NetworkType)

- [x] Date
- [x] Campaign ID, Name, Type
- [x] Ad Group ID, Name
- [x] Keyword ID, Text, Match Type
- [x] Status, Quality Score
- [x] Device, NetworkType
- [x] Cost, Clicks, Impressions, CTR, AvgCPC, Conversions

#### 1.5 Raw_Ads_SearchTerms Metrics (per Date × SearchTerm × Device)

- [x] Date
- [x] Campaign ID, Name, Type
- [x] Ad Group ID, Name
- [x] Matched Keyword Text
- [x] Actual Search Term (user query)
- [x] Device
- [x] Cost, Clicks, Impressions, CTR, Conversions

#### 1.6 Raw_Ads_Geographic Metrics (per Date × Campaign × CountryCriterionId)

- [x] Date
- [x] Campaign ID, Name, Type
- [x] CountryCriterionId (numeric geo target criterion ID, e.g., 2840 = USA)
- [x] Cost, Clicks, Impressions, CTR, Conversions

**Note:** Cannot include Device or NetworkType due to API segment incompatibility. Uses `geographic_view` resource which returns criterion IDs instead of country names. Country names resolved in dashboard/aggregation layer.

### 2. Data Integration - GA4 (via API)

#### 2.1 Purpose: Understanding Post-Click Behavior

Google Ads tells us how much we spend and how many clicks we get. GA4 tells us what happens **after** users click on our ads. This is critical for answering:

- Are we paying for clicks that lead nowhere (high bounce)?
- Which landing pages actually convert visitors to inquiries?
- What actions do engaged users take before converting?
- Is there a difference in behavior between countries or devices?

Without GA4 data, we only know cost-per-click. With GA4 data, we can calculate cost-per-engaged-session, cost-per-lead, and understand the full funnel from ad click to booking inquiry.

#### 2.2 Three-Table Architecture

GA4 data is split into three tables, each answering different questions. This separation exists because:
1. Combining all dimensions (Campaign × Device × Country × LandingPage × EventName) would create an explosion of rows with most combinations empty
2. Different analyses require different grains - landing page analysis doesn't need device breakdown
3. Event-level data must be preserved independently because what constitutes a "conversion" may change over time

##### Table 1: Raw_GA4_Sessions (Traffic Volume & Quality)

**Purpose:** Understand how much traffic each campaign drives and whether that traffic is engaged or bouncing. This is the primary table for joining to Ads data to calculate ROI metrics.

**Grain:** Date × Campaign × Device × Country

**Key Questions Answered:**
- How many sessions did each campaign drive?
- What percentage of sessions were engaged (>10 seconds, or had a conversion/pageview)?
- Are mobile users from Germany more engaged than desktop users from USA?
- Which campaigns drive quality traffic vs wasted clicks?

**Metrics:**
- [x] Sessions (total session count)
- [x] Users (unique visitors)
- [x] NewUsers (first-time visitors - indicates reach vs retention)
- [x] EngagedSessions (sessions with meaningful interaction)
- [x] BounceRate (% of sessions with no engagement)
- [x] AvgSessionDuration (time spent - interest indicator)

##### Table 2: Raw_GA4_Pages (Landing Page Effectiveness)

**Purpose:** Understand which landing pages convert visitors and which lose them. A campaign might have great click volume but send users to a page that doesn't resonate. This table separates "is the targeting right?" from "is the page right?"

**Grain:** Date × Campaign × LandingPage

**Key Questions Answered:**
- Which landing pages have the highest engagement rates?
- Are users landing on the right pages for their search intent?
- Which pages should we optimize or replace?
- Do certain campaigns perform better with specific landing pages?

**Metrics:**
- [x] Sessions (traffic volume to this page)
- [x] EngagedSessions (did users stay and interact?)
- [x] BounceRate (did they leave immediately?)
- [x] PageViews (did they explore further?)

##### Table 3: Raw_GA4_Events (User Behavior & Conversions)

**Purpose:** Capture the specific actions users take on the site. This is the behavioral data that tells the story of what users actually DO, not just aggregate metrics.

Events are critical because:
1. **Behavior tells a story:** A user who scrolls 90% and clicks "Contact" is more valuable than one who bounces
2. **Conversions evolve:** What counts as a "conversion" changes over time. Maybe initially it was just `form_submit`, but later you add `calendar_booking` or `phone_click`. By storing raw events, historical data remains useful.
3. **Funnel analysis:** You can see the progression: page_view → scroll → click_contact → form_submit
4. **Attribution flexibility:** The dashboard can let users define "conversion = form_submit + generate_lead + phone_click" without re-collecting data

**Grain:** Date × Campaign × EventName

**Key Questions Answered:**
- How many form submissions did each campaign generate?
- What's the scroll depth on our pages (engagement proxy)?
- Are users clicking CTAs but not completing forms (UX issue)?
- Which campaigns drive actual leads vs just pageviews?

**Metrics:**
- [x] EventCount (number of times this event fired)

**Common Events to Track:**
- `page_view` - basic traffic
- `scroll` - engagement indicator
- `click` - interaction with elements
- `form_start` - intent to convert
- `form_submit` / `generate_lead` - actual conversion
- `file_download` - research behavior
- Custom events specific to the site

#### 2.3 Data Filtering

- [x] Only pull campaign traffic (exclude direct/organic sessions)
- [x] Filter: `sessionCampaignName` is not "(not set)" or "(direct)"
- [x] Rationale: This dashboard is for analyzing ad spend effectiveness. Direct traffic analysis is a separate concern.

#### 2.4 Technical Requirements

- [x] System must authenticate with GA4 Data API using configured Property ID
- [x] API configuration stored in `Config.js`
- [x] Three separate API calls per fetch (sessions, pages, events)
- [x] Daily pull scheduled at 4 AM (after Ads script completes)
- [x] Each table stored in its own spreadsheet (see `specs/spreadsheet_config.md`)

### 3. Data Storage (Google Sheets)

#### 3.1 Raw Data Sheets (Source of Truth)

- [x] System must automatically create required sheets if they do not exist:
  - `Raw_Ads_Daily` - Campaign metrics by Device × NetworkType
  - `Raw_Ads_Keywords` - Keyword-level performance
  - `Raw_Ads_SearchTerms` - Search term analysis
  - `Raw_Ads_Geographic` - Campaign metrics by Country
  - `Raw_GA4_Sessions` - Session metrics by Campaign × Device × Country
  - `Raw_GA4_Pages` - Landing page effectiveness
  - `Raw_GA4_Events` - User behavior and conversion events
  - `System_Logs` - Error and debug logging
- [x] Each sheet must have appropriate headers on first row
- [x] New data fetches must append rows (not overwrite history)
- [x] All data must include a Date column for historical analysis

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
- [ ] Landing page performance view (reads from Raw_GA4_Pages)
- [ ] Acceptable delay for drill-down views (2-3 seconds)

#### 5.4 Conversion Event Selection

- [ ] User can select which events count as "conversions" from available events
- [ ] Selection persists across sessions (stored in config or localStorage)
- [ ] Dashboard recalculates conversion metrics based on selection
- [ ] Rationale: Conversion tracking evolves over time; this flexibility ensures historical data remains useful

#### 5.5 UI States

- [ ] Loading state while data is being fetched
- [ ] Error state if data fetch fails
- [ ] Empty state if no data for selected filters

### 6. Configuration

- [x] All environment-specific values in `Config.js`:
  - Google Ads Customer ID
  - GA4 Property ID
  - Google Sheet IDs (multi-spreadsheet architecture)
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

- [x] Daily Ads script populates Raw_Ads_Daily, Raw_Ads_Keywords, Raw_Ads_SearchTerms, Raw_Ads_Geographic
- [x] Daily GA4 pull populates all three GA4 tables:
  - Raw_GA4_Sessions (traffic volume and quality by Campaign × Device × Country)
  - Raw_GA4_Pages (landing page effectiveness by Campaign × LandingPage)
  - Raw_GA4_Events (user behavior by Campaign × EventName)
- [x] Backfill script successfully loads 2+ years of historical data (both Ads and GA4)
- [ ] Nightly aggregation produces Summary_Monthly and Summary_Campaigns
- [x] All sheets have correct headers and data types

### Dashboard

- [ ] Opening Web App URL shows dashboard with real data in < 2 seconds
- [ ] Can view January 2024 vs January 2025 performance comparison
- [ ] Can filter by Campaign, Device, NetworkType
- [ ] Can drill down to keyword detail for a specific campaign
- [ ] Metrics displayed match source data (spot-check verification)

### Verification

- [x] `testGA4Connection()` returns success with real data
- [x] Ads script Preview shows success logs
- [ ] Manual comparison of 3 random dates against Google Ads UI matches
- [ ] Summary_Monthly totals match Raw_Ads_Daily totals for same period
