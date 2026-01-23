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
│   ├── phase_1_foundation/       # Phase 1 detailed specs
│   │   ├── requirements.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   └── ADR.md
│   ├── phase_2_dashboard/        # Phase 2 detailed specs
│   │   ├── requirements.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   └── ADR.md
│   └── phase_3_compare/          # Phase 3 detailed specs
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

### Phase 1: Data Foundation — `specs/phase_1_foundation/`

**Status**: 🟡 In Progress (data pipeline complete, verification pending)

**Goal**: Establish core data infrastructure with two-tier data model (raw + summary) and verify data pipelines work correctly.

| Component | Status |
|-----------|--------|
| GA4 API integration | ✅ Verified |
| Basic Ads script (proof of concept) | ✅ Tested |
| Updated Ads script (new data model) | ✅ Complete |
| Historical backfill script (Ads) | ✅ Complete (2022-2026) |
| Raw Ads data sheets (4 sheets) | ✅ Populated |
| Raw GA4 data sheets (3 sheets) | ✅ Populated (2022-2026) |
| Daily triggers (Ads 3AM, GA4 4AM) | ✅ Configured |
| Nightly aggregation job | ✅ Complete (5AM trigger) |
| Summary sheets (3 sheets) | ✅ Populated |
| Data verification | ⏳ Pending |

> **Note**: Frontend/dashboard UI moved to Phase 2.

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

### Phase 2: Overview Dashboard — `specs/phase_2_dashboard/`

**Status**: ✅ Complete

**Goal**: Build the Overview dashboard that answers "Is my marketing working?" at a glance.

| Component | Status |
|-----------|--------|
| Vue 3 + Vue Router setup | ✅ Complete |
| PrimeVue 4 with Aura theme | ✅ Complete |
| Backend API functions | ✅ Complete |
| Overview: Primary KPIs (4 cards) | ✅ Complete |
| Overview: Funnel Visualization | ✅ Complete |
| Overview: Supporting Metrics (6 cards) | ✅ Complete |
| Overview: Trend Sparkline with Metric Presets | ✅ Complete |
| Overview: Quick Insights (Keywords) | ✅ Complete |
| Filter controls (Campaign, Device, Type) | ✅ Complete |
| Date range & comparison mode | ✅ Complete |
| Analysis views (Campaigns, Devices, etc.) | ➡️ Deferred to Phase 3 |

**Tech Stack**:
- Vue 3 via CDN (no build tooling)
- Vue Router with hash mode for browser history/deep linking
- PrimeVue 4 components (DataTable, Select, DatePicker, etc.)
- Chart.js for visualizations

**Key Features Delivered**:
- Overview dashboard with KPIs, funnel, trends, quick insights
- Flexible date range with comparison modes (Previous Period, YoY, Custom)
- Metric presets for trend analysis (Cost & Clicks, Sessions & Engaged, etc.)
- Quick Insights showing top keywords with expandable search terms
- Responsive layout

**Deferred to Phase 3**: Campaign Analysis, Device Analysis, Campaign Type Analysis, Geographic Analysis, Conversion Configuration. These were replaced by a more powerful Compare Workspace design.

**Detailed specs**: See `specs/phase_2_dashboard/`

---

### Phase 3: Compare Workspace — `specs/phase_3_compare/`

**Status**: ⏳ Not Started

**Goal**: Build a flexible comparison workspace that answers "How do I optimize?" by enabling deep side-by-side analysis of campaigns and time periods.

| Component | Status |
|-----------|--------|
| Navigation update (Overview + Compare) | ⏳ Pending |
| Workspace state management | ⏳ Pending |
| Column system (Campaign + Time Period) | ⏳ Pending |
| Duration lock mechanism | ⏳ Pending |
| Component system (add/remove metrics) | ⏳ Pending |
| KPIs component | ⏳ Pending |
| Keywords component | ⏳ Pending |
| Search Terms component | ⏳ Pending |
| Landing Pages component | ⏳ Pending |
| Device/Type/Geographic breakdown components | ⏳ Pending |
| Funnel & Sparkline components | ⏳ Pending |
| Conversion configuration | ⏳ Pending |
| localStorage persistence | ⏳ Pending |

**Key Concept**: Column-based comparison workspace where:
- **Columns** = Campaign + Time Period combinations (e.g., "Campaign A, Q1 2024" vs "Campaign A, Q1 2025")
- **Components** = Addable/removable metric blocks (KPIs, Keywords, Search Terms, etc.)
- **Duration Lock** = All columns must have same duration for fair comparison
- **Persistence** = Component configuration saved to localStorage

**Why This Approach**: The original Phase 2 design had 5 separate analysis views (Campaigns, Devices, Types, Countries, Conversions). This fragmented the analysis experience. Real optimization work requires comparing data side-by-side, not navigating between isolated views. The Compare Workspace consolidates all analysis into one flexible tool.

**Detailed specs**: See `specs/phase_3_compare/`

---

### Phase 4: Automation & Polish

**Status**: ⏳ Not Started

**Goal**: Production-ready system with automated alerts, refinements, and advanced diagnostics.

**Planned Features**:
- Email alerts for significant changes (anomaly detection)
- Diagnostic insights: "Campaign X has high clicks but low engagement - check landing page"
- Dashboard UI refinements based on usage feedback
- Error recovery and retry logic improvements
- Export functionality (if needed)
- Event sequence analysis (what actions precede conversions?)

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
