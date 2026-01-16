# Keynote Speaker Marketing Analytics Dashboard

A custom Google Apps Script + Sheets solution to analyze marketing spend, campaign performance, and conversion funnel for keynote speaking business.

## Problem Statement

As a keynote speaker running Google Ads campaigns, the need is to:

- Understand if campaigns are underperforming vs. external factors (seasonality, economy)
- Compare current performance against historical data (YoY, MoM)
- Analyze the full funnel: Ads → Landing Page → Booking Inquiry
- Have a clean, customizable view without the noise of native interfaces
- Get fast dashboard load times (< 2 seconds)

## Analytics Approach: Connecting Ad Spend to Business Outcomes

The core challenge is connecting **what we spend** (Google Ads) to **what we get** (booking inquiries). This requires understanding the full post-click funnel:

```
Ad Impression → Ad Click → Landing Page → User Engagement → Conversion
     ↓              ↓            ↓               ↓              ↓
   (Ads)         (Ads)        (GA4)           (GA4)          (GA4)
  "reach"       "cost"       "where"         "what"        "outcome"
```

**Google Ads data answers:** How much did we spend? How many clicks? Which keywords/search terms drove traffic? Which countries/devices?

**GA4 data answers:** What happened after the click? Did users bounce or engage? Which landing pages work? What actions did users take? Did they convert?

By joining these data sources, we can calculate the metrics that matter:
- **Cost per engaged session** (not just cost per click)
- **Cost per conversion** (actual business outcome)
- **Landing page effectiveness** (diagnose page vs targeting problems)
- **Conversion funnel drop-off** (where are we losing people?)

This is why GA4 data is split into three tables (Sessions, Pages, Events) - each answers different questions in the funnel. See ADR-013 for detailed rationale.

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
│  │  GA4 Data API       │─────────────→│  ├─ Raw_GA4_Sessions             │  │
│  │  (Apps Script)      │    Pull      │  ├─ Raw_GA4_Pages                │  │
│  │  @ 4 AM daily       │    Daily     │  └─ Raw_GA4_Events               │  │
│  └─────────────────────┘              └──────────────────────────────────┘  │
│                                                      │                      │
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
| **Raw Data** | Raw_Ads_Daily, Raw_Ads_Keywords, Raw_Ads_SearchTerms, Raw_Ads_Geographic, Raw_GA4_Sessions, Raw_GA4_Pages, Raw_GA4_Events | Source of truth, audit trail | Nightly aggregation, drill-down queries |
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
| **GA4 Data** | Three tables (Sessions, Pages, Events) | Each answers different funnel questions; preserves event-level data for flexible analysis (ADR-013) |
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
| Raw_GA4_Sessions | `Raw_GA4_Sessions` | Raw | Session metrics by Campaign × Device × Country | Apps Script (daily pull) |
| Raw_GA4_Pages | `Raw_GA4_Pages` | Raw | Landing page metrics by Campaign × LandingPage | Apps Script (daily pull) |
| Raw_GA4_Events | `Raw_GA4_Events` | Raw | Event counts by Campaign × EventName | Apps Script (daily pull) |
| Dashboard | `Summary_Monthly` | Summary | Monthly aggregates (Ads + GA4 joined) | Apps Script (nightly) |
| Dashboard | `Summary_Campaigns` | Summary | Campaign totals for quick reference | Apps Script (nightly) |
| Dashboard | `System_Logs` | System | Error/debug logging | Apps Script |

**Notes:**
- `Raw_Ads_Daily` and `Raw_Ads_Geographic` use separate queries due to Google Ads API segment restrictions
- Geographic data uses `geographic_view` resource returning criterion IDs (not country names)
- GA4 data split into three tables to answer different questions in the post-click funnel (see ADR-013):
  - **Sessions**: "How much quality traffic did each campaign drive?" - joins to Ads for cost-per-engaged-session
  - **Pages**: "Which landing pages work?" - separates targeting problems from page problems
  - **Events**: "What do users actually do?" - captures behavior (scroll, click, form_submit) and enables flexible conversion definition as tracking evolves

---

## Implementation Phases

### Phase 1: Foundation (MVP) — `specs/phase_1_foundation/`

**Status**: 🟡 In Progress

**Goal**: Establish core infrastructure with two-tier data model (raw + summary) and verify data pipelines work with fast dashboard performance.

| Component | Status |
|-----------|--------|
| GA4 API integration | ✅ Verified |
| Basic Ads script (proof of concept) | ✅ Tested |
| Updated Ads script (new data model) | ✅ Complete |
| Historical backfill script (Ads) | ✅ Complete (2022-2026) |
| Raw Ads data sheets (4 sheets) | ✅ Populated |
| Raw GA4 data sheets (3 sheets) | ✅ Populated (2022-2026) |
| Daily triggers (Ads 3AM, GA4 4AM) | ✅ Configured |
| Summary sheets (2 sheets) | ⏳ Pending |
| Nightly aggregation job | ⏳ Pending |
| Basic dashboard UI | 🟡 Skeleton built |
| Web App deployment | ⏳ Pending |

**Data Model** (see `specs/phase_1_foundation/design.md` for full schema):

*Pre-click data (Google Ads) - "What are we spending and where?"*
- **Raw_Ads_Daily**: Campaign performance by Device × NetworkType - core spend/click metrics
- **Raw_Ads_Keywords**: Keyword-level metrics - for bid optimization and QualityScore tracking
- **Raw_Ads_SearchTerms**: Actual user queries - for intent analysis and negative keyword discovery
- **Raw_Ads_Geographic**: Campaign performance by Country - for market analysis

*Post-click data (GA4) - "What happens after users click?"*
- **Raw_GA4_Sessions**: Traffic quality by Campaign × Device × Country - joins to Ads for ROI
- **Raw_GA4_Pages**: Landing page effectiveness - diagnose page vs targeting issues
- **Raw_GA4_Events**: User behavior and conversions - funnel visibility, flexible conversion definition

*Aggregated data (Dashboard source) - "Fast queries for the UI"*
- **Summary_Monthly**: Pre-aggregated Ads + GA4 joined at Campaign × Device level
- **Summary_Campaigns**: Campaign totals for quick reference

**Detailed specs**: See `specs/phase_1_foundation/`

---

### Phase 2: Advanced Funnel Visualization & Diagnostics

**Status**: ⏳ Not Started

**Goal**: Build on the Phase 1 data infrastructure to provide deeper funnel insights and diagnostic tools.

**Note**: Phase 1 establishes the *data foundation* for funnel analysis (GA4 Sessions, Pages, Events tables). Phase 2 focuses on *visualization and diagnostics* using that data.

**Planned Features**:
- Visual funnel diagram: Impressions → Clicks → Sessions → Engaged Sessions → Conversions
- Drop-off rate calculations at each funnel stage
- Landing page comparison view (side-by-side performance)
- Event sequence analysis (what actions precede conversions?)
- Diagnostic alerts: "Campaign X has high clicks but low engagement - check landing page"
- A/B landing page insights (if multiple pages receive traffic from same campaign)

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
