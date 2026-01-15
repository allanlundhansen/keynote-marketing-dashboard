# Keynote Speaker Marketing Analytics Dashboard

A custom Google Apps Script + Sheets solution to analyze marketing spend, campaign performance, and conversion funnel for keynote speaking business.

## Problem Statement

As a keynote speaker running Google Ads campaigns, the need is to:

- Understand if campaigns are underperforming vs. external factors (seasonality, economy)
- Compare current performance against historical data (YoY, MoM)
- Analyze the full funnel: Ads → Landing Page → Booking Inquiry
- Have a clean, customizable view without the noise of native interfaces
- Get fast dashboard load times (< 2 seconds)

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA INGESTION (Daily)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐              ┌──────────────────────────────────┐  │
│  │  Google Ads Script  │─────────────→│  RAW DATA SHEETS                 │  │
│  │  (runs IN account)  │    Push      │  ├─ Raw_Ads_Daily                │  │
│  │  @ 3 AM daily       │    Daily     │  ├─ Raw_Ads_Keywords             │  │
│  └─────────────────────┘              │  ├─ Raw_Ads_SearchTerms          │  │
│                                       │  └─ Raw_Ads_Geographic           │  │
│  ┌─────────────────────┐              │                                  │  │
│  │  GA4 Data API       │─────────────→│  └─ Raw_GA4_Daily                │  │
│  │  (Apps Script)      │    Pull      └──────────────────────────────────┘  │
│  │  @ 4 AM daily       │    Daily                    │                      │
│  └─────────────────────┘                             │                      │
│                                                      ▼                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NIGHTLY AGGREGATION (@ 5 AM)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐              ┌──────────────────────────────────┐  │
│  │  Apps Script        │─────────────→│  SUMMARY SHEETS                  │  │
│  │  Aggregation Job    │   Compute    │  ├─ Summary_Monthly              │  │
│  │                     │              │  └─ Summary_Campaigns            │  │
│  └─────────────────────┘              └──────────────────────────────────┘  │
│                                                      │                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐              ┌──────────────────────────────────┐  │
│  │  User via Browser   │◄────────────→│  Apps Script Web App             │  │
│  │                     │    HTML      │  (reads from Summary sheets)     │  │
│  └─────────────────────┘              └──────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hybrid Data Ingestion Model

| Source | Method | Reason |
|--------|--------|--------|
| **Google Ads** | Push (internal script) | API access requires approval; internal scripts have native access |
| **GA4** | Pull (direct API) | Analytics API is readily accessible |

> **Note**: Once Google Ads API access is approved, the system can optionally switch to direct API calls. The hybrid model will continue to work as a fallback.

### Two-Tier Data Model

| Tier | Sheets | Purpose | Read By |
|------|--------|---------|---------|
| **Raw Data** | Raw_Ads_Daily, Raw_Ads_Keywords, Raw_Ads_SearchTerms, Raw_Ads_Geographic, Raw_GA4_Daily | Source of truth, audit trail | Nightly aggregation, drill-down queries |
| **Summary Data** | Summary_Monthly, Summary_Campaigns | Fast dashboard queries | Dashboard (< 2 sec load) |

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Google Apps Script (V8) | Serverless execution, OAuth handling |
| **Data Store** | Google Sheets | Structured storage, easy inspection |
| **Frontend** | HTML/CSS/JS Web App | Custom dashboard UI |
| **Dev Tools** | clasp + Git | Local development, version control |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Platform** | Google Apps Script | Free, native Google API access, no infrastructure |
| **Database** | Google Sheets (two-tier) | Inspectable, no cost, raw + summary for speed |
| **UI** | Apps Script Web App | Custom HTML/CSS/JS, no external hosting needed |
| **Ads Data** | Hybrid (internal script) | Bypasses API approval requirement |
| **Rendering** | Client-side fetch from summaries | Fast first paint, < 2 sec load |
| **Historical Data** | Up to 7 years | Daily aggregates fit within Sheets limits |

---

## Project Structure

```
/keynote-marketing-dashboard/
├── src/                          # Apps Script source files
│   ├── Code.js                   # Main entry point (doGet, refreshData)
│   ├── Config.js                 # Centralized configuration
│   ├── AdsService.js             # Reads Ads data from Summary sheets
│   ├── AnalyticsService.js       # GA4 API integration
│   ├── AggregationService.js     # Nightly aggregation job
│   ├── SheetManager.js           # Sheet CRUD operations
│   ├── Test.js                   # API connection verification
│   ├── AdsScript_Internal.js     # Daily export script for Google Ads account
│   ├── AdsScript_Backfill.js     # One-time historical data export
│   └── index.html                # Dashboard frontend
├── specs/                        # Specification documentation
│   ├── implementation_plan.md    # This file (high-level roadmap)
│   └── phase_1_foundation/       # Phase 1 detailed specs
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       └── ADR.md
├── .clasp.json                   # Apps Script project config
├── appsscript.json               # Manifest (scopes, runtime)
├── package.json                  # npm scripts for clasp
└── README.md                     # Quick setup guide
```

### Multi-Spreadsheet Structure

Due to Google Sheets' 10M cell limit, each raw data type is stored in its own spreadsheet. See `specs/spreadsheet_config.md` for all IDs.

| Spreadsheet | Sheet(s) | Type | Purpose | Population Method |
|-------------|----------|------|---------|-------------------|
| Raw_Ads_Daily | `Raw_Ads_Daily` | Raw | Campaign metrics by Date × Device × NetworkType | Google Ads script (daily push) |
| Raw_Ads_Keywords | `Raw_Ads_Keywords` | Raw | Keyword-level metrics with QualityScore | Google Ads script (daily push) |
| Raw_Ads_SearchTerms | `Raw_Ads_SearchTerms` | Raw | Search term data for intent analysis | Google Ads script (daily push) |
| Raw_Ads_Geographic | `Raw_Ads_Geographic` | Raw | Campaign metrics by Date × CountryCriterionId | Google Ads script (daily push) |
| Raw_GA4_Daily | `Raw_GA4_Daily` | Raw | GA4 metrics by Campaign × Device × Country | Apps Script (daily pull) |
| Dashboard | `Summary_Monthly` | Summary | Monthly aggregates (Ads + GA4 joined) | Apps Script (nightly) |
| Dashboard | `Summary_Campaigns` | Summary | Campaign totals for quick reference | Apps Script (nightly) |
| Dashboard | `System_Logs` | System | Error/debug logging | Apps Script |

**Notes:**
- `Raw_Ads_Daily` and `Raw_Ads_Geographic` use separate queries due to Google Ads API segment restrictions
- Geographic data uses `geographic_view` resource returning criterion IDs (not country names)

---

## Implementation Phases

### Phase 1: Foundation (MVP) — `specs/phase_1_foundation/`

**Status**: 🟡 In Progress

**Goal**: Establish core infrastructure with two-tier data model (raw + summary) and verify data pipelines work with fast dashboard performance.

| Component | Status |
|-----------|--------|
| GA4 API integration | ✅ Verified |
| Basic Ads script (proof of concept) | ✅ Tested |
| Updated Ads script (new data model) | 🟡 In Progress |
| Historical backfill script | 🟡 In Progress |
| Raw data sheets (4 sheets) | ⏳ Pending |
| Summary sheets (2 sheets) | ⏳ Pending |
| Nightly aggregation job | ⏳ Pending |
| Basic dashboard UI | 🟡 Skeleton built |
| Web App deployment | ⏳ Pending |

**Data Model**:
- **Raw_Ads_Daily**: Campaign × Device × NetworkType (daily metrics)
- **Raw_Ads_Keywords**: Keyword-level with QualityScore
- **Raw_Ads_SearchTerms**: Search term detail
- **Raw_Ads_Geographic**: Campaign × Country (separate due to API segment restrictions)
- **Raw_GA4_Daily**: Sessions by Campaign × Device × Country
- **Summary_Monthly**: Pre-aggregated for fast dashboard (Ads + GA4 joined)
- **Summary_Campaigns**: Campaign totals

**Detailed specs**: See `specs/phase_1_foundation/`

---

### Phase 2: Funnel Analysis

**Status**: ⏳ Not Started

**Goal**: Connect Ads clicks to GA4 sessions and track the full conversion funnel.

**Planned Features**:
- Map Ad clicks → GA4 sessions via UTM parameters
- Track funnel: Impressions → Clicks → Sessions → Engagement → Inquiry
- Calculate drop-off rates at each stage
- Landing page performance comparison

**Specs**: `specs/phase_2_funnel/` (to be created)

---

### Phase 3: Historical Comparison

**Status**: ⏳ Not Started

**Goal**: Enable Year-over-Year analysis and trend visualization.

**Planned Features**:
- Date range selector (custom periods)
- YoY metric calculations (built into Summary_Monthly)
- Trend charts (weekly/monthly)
- Anomaly detection and highlighting

**Specs**: `specs/phase_3_historical/` (to be created)

---

### Phase 4: Automation & Polish

**Status**: ⏳ Not Started

**Goal**: Production-ready system with automated refreshes and alerts.

**Planned Features**:
- Scheduled daily data refresh (time-driven triggers)
- Email alerts for significant changes
- Dashboard UI refinements
- Error recovery and retry logic

**Specs**: `specs/phase_4_automation/` (to be created)

---

## Verification Strategy

### Per-Phase Verification

Each phase includes specific acceptance criteria in its `requirements.md`. General approach:

1. **API Connection Tests**: Run `Test.js` functions to verify connectivity
2. **Data Accuracy**: Spot-check values against native Google interfaces
3. **Summary Verification**: Confirm Summary totals match Raw totals
4. **Performance**: Verify dashboard loads < 2 seconds
5. **User Sign-off**: Explicit agreement before marking phase complete

### Built-in Resilience

- Mock data fallbacks when APIs are unavailable
- Error logging to `System_Logs` sheet and Apps Script execution transcript
- Data freshness indicators on dashboard ("Data as of: ...")

---

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Google Sheets 10M cell limit | Single spreadsheet cannot hold 7 years of all data types | Multi-spreadsheet architecture (one per data type); see `specs/spreadsheet_config.md` |
| Google Ads API segment restrictions | Cannot combine geo segments with device/network segments; `segments.geo_target_country` not compatible with `campaign` resource | Use `geographic_view` resource; store criterion IDs; resolve names in dashboard |
| GA4 has no NetworkType dimension | Cannot calculate CostPerSession at SEARCH vs DISPLAY level | Document in dashboard; analyze at Campaign × Device level |
| Keyword/SearchTerm data retention | Only ~2-3 years available from Google | Backfill what's available; older data has campaign-level only |
| Apps Script execution limits | 30 min max for scheduled scripts | Chunk backfill by year; nightly aggregation is fast |
| Dashboard data staleness | Up to 24 hours old | Acceptable for daily metrics; show "as of" timestamp |

---

## Blockers & Workarounds

| Blocker | Status | Workaround |
|---------|--------|------------|
| Google Ads API access | Applied, pending approval | Using internal Ads script (hybrid model) |

---

## Links

- **Repository**: [GitHub](https://github.com/allanlundhansen/keynote-marketing-dashboard)
- **Spreadsheet Config**: See `specs/spreadsheet_config.md` for all spreadsheet IDs
- **Apps Script Project**: See `.clasp.json` for script ID
