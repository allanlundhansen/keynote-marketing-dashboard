# Keynote Speaker Marketing Analytics Dashboard

A custom Google Apps Script + Sheets solution to analyze marketing spend, campaign performance, and conversion funnel for keynote speaking business.

## Problem Statement

As a keynote speaker running Google Ads campaigns, the need is to:

- Understand if campaigns are underperforming vs. external factors (seasonality, economy)
- Compare current performance against historical data (YoY)
- Analyze the full funnel: Ads → Landing Page → Booking Inquiry
- Have a clean, customizable view without the noise of native interfaces

---

## Architecture Overview

### Data Flow

```
┌─────────────────────┐         ┌──────────────────┐
│  Google Ads Script  │────────→│  Raw_Ads_Data    │
│  (runs IN account)  │  Push   │     Sheet        │
└─────────────────────┘ Daily   └────────┬─────────┘
                                         │
                                         ▼
┌─────────────────────┐         ┌──────────────────┐
│  GA4 Data API       │────────→│  Apps Script     │──→ Web App Dashboard
│  (direct access)    │  Pull   │  Backend         │
└─────────────────────┘         └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │  Raw_GA4_Data    │
                                │     Sheet        │
                                └──────────────────┘
```

### Hybrid Data Ingestion Model

| Source | Method | Reason |
|--------|--------|--------|
| **Google Ads** | Push (internal script) | API access requires approval; internal scripts have native access |
| **GA4** | Pull (direct API) | Analytics API is readily accessible |

> **Note**: Once Google Ads API access is approved, the system can optionally switch to direct API calls. The hybrid model will continue to work as a fallback.

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
| **Database** | Google Sheets | Inspectable, no cost, sufficient for daily aggregates |
| **UI** | Apps Script Web App | Custom HTML/CSS/JS, no external hosting needed |
| **Ads Data** | Hybrid (internal script) | Bypasses API approval requirement |
| **Rendering** | Client-side fetch | Fast first paint, async data loading |
| **Historical Data** | Up to 7 years | Daily aggregates fit within Sheets limits |

---

## Project Structure

```
/keynote-marketing-dashboard/
├── src/                          # Apps Script source files
│   ├── Code.js                   # Main entry point (doGet, refreshData)
│   ├── Config.js                 # Centralized configuration
│   ├── AdsService.js             # Reads Ads data from Sheets
│   ├── AnalyticsService.js       # GA4 API integration
│   ├── SheetManager.js           # Sheet CRUD operations
│   ├── Test.js                   # API connection verification
│   ├── AdsScript_Internal.js     # Standalone script for Google Ads account
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

### Sheets Structure

| Sheet | Purpose | Population Method |
|-------|---------|-------------------|
| `Raw_Ads_Data` | Daily Google Ads metrics | Google Ads internal script (daily push) |
| `Raw_GA4_Data` | Daily GA4 metrics | Apps Script (on-demand pull) |
| `System_Logs` | Error/debug logging | Apps Script |

---

## Implementation Phases

### Phase 1: Foundation (MVP) — `specs/phase_1_foundation/`

**Status**: 🟡 In Progress

**Goal**: Establish core infrastructure and verify data pipelines work.

| Component | Status |
|-----------|--------|
| Google Ads internal script | ✅ Complete |
| GA4 API integration | ✅ Verified |
| Sheet data storage | ✅ Complete |
| Basic dashboard UI | 🟡 Skeleton built |
| Web App deployment | ⏳ Pending |

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
- YoY metric calculations
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
3. **Dashboard Review**: Visual inspection of rendered metrics
4. **User Sign-off**: Explicit agreement before marking phase complete

### Built-in Resilience

- Mock data fallbacks when APIs are unavailable
- Error logging to `System_Logs` sheet and Apps Script execution transcript
- Data freshness indicators on dashboard

---

## Blockers & Workarounds

| Blocker | Status | Workaround |
|---------|--------|------------|
| Google Ads API access | Applied, pending approval | Using internal Ads script (hybrid model) |

---

## Links

- **Repository**: [GitHub](https://github.com/allanlundhansen/keynote-marketing-dashboard)
- **Google Sheet**: `1-JSj1Ky2WJU0ebMmHX-8H8sqzby6b06DTojB8kuzgRI`
- **Apps Script Project**: See `.clasp.json` for script ID
