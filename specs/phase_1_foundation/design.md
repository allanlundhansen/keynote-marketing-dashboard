# Phase 1: Foundation (MVP) Design

## Architecture Overview

We are using a **Serverless-like architecture** hosted on Google Apps Script with a **hybrid data ingestion model** and **pre-aggregated summary sheets** for fast dashboard performance.

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
| **Google Ads** | Push via internal script | API access requires approval; internal scripts have native access |
| **GA4** | Pull via API | Analytics Data API is readily accessible |

### Two-Tier Data Model

| Tier | Purpose | Read By | Update Frequency |
|------|---------|---------|------------------|
| **Raw Data** | Source of truth, audit trail | Nightly aggregation job | Daily append |
| **Summary Data** | Fast dashboard queries | Dashboard | Nightly recompute |

### Multi-Spreadsheet Architecture

Due to Google Sheets' 10 million cell limit, each data type is stored in its own spreadsheet for scalability (see ADR-012).

| Spreadsheet | Contents | Est. Cells (7yr) |
|-------------|----------|------------------|
| Raw_Ads_Daily | Campaign × Device × NetworkType metrics | ~525,000 |
| Raw_Ads_Keywords | Keyword-level metrics | ~4,000,000 |
| Raw_Ads_SearchTerms | Search term data | ~7,000,000 |
| Raw_Ads_Geographic | Campaign × Country metrics | ~500,000 |
| Raw_GA4_Sessions | Session metrics by Campaign × Device × Country | ~500,000 |
| Raw_GA4_Pages | Landing page metrics by Campaign × LandingPage | ~300,000 |
| Raw_GA4_Events | Event counts by Campaign × EventName | ~200,000 |
| Dashboard | Summary_Monthly, Summary_Campaigns, System_Logs | ~100,000 |

Configuration: See `specs/spreadsheet_config.md` for all spreadsheet IDs.

## Component Design

### 1. Backend Services (`src/`)

| File | Purpose |
|------|---------|
| `Config.js` | Centralized configuration (API IDs, sheet names) |
| `Code.js` | Main entry points (`doGet`, `refreshData`, `getDashboardData`) |
| `AdsService.js` | Reads Ads data from Summary sheets |
| `AnalyticsService.js` | GA4 Data API integration |
| `SheetManager.js` | Sheet CRUD operations (find, create, append, read) |
| `AggregationService.js` | Nightly job to compute summary sheets |
| `Test.js` | API connection verification functions |

### 2. Google Ads Internal Scripts (`src/`)

| File | Purpose |
|------|---------|
| `AdsScript_Internal.js` | Daily export script (runs in Google Ads account) |
| `AdsScript_Backfill.js` | One-time historical data export |

### 3. Frontend Design (`src/index.html`)

- **Single Page Application (SPA)** feel with server-side template delivery
- **CSS Framework**: Custom minimal CSS with CSS Variables for theming
- **Data Loading**: Asynchronous via `google.script.run` reading from **Summary sheets**
- **Performance Target**: < 2 seconds initial load

## Data Schema

### Raw Data Sheets (Source of Truth)

Each raw data type is stored in its **own spreadsheet** to avoid the 10M cell limit (see Multi-Spreadsheet Architecture above). These sheets store daily granular data. They are append-only and rarely read directly by the dashboard.

#### Sheet: `Raw_Ads_Daily`

Daily campaign-level metrics by device and network type.

**Grain:** Date × Campaign × Device × NetworkType

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Unique campaign ID |
| CampaignName | String | Human-readable name |
| CampaignType | String | SEARCH, DISPLAY, VIDEO, etc. |
| Status | String | ENABLED, PAUSED, REMOVED |
| Device | String | DESKTOP, MOBILE, TABLET |
| NetworkType | String | SEARCH, DISPLAY, YOUTUBE, etc. |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| AvgCPC | Number | Average cost per click |
| Conversions | Number | Count |
| CostPerConversion | Number | Cost / Conversions |
| ImpressionShare | Number | Search impression share (decimal) |

**Note:** Country is in a separate sheet (Raw_Ads_Geographic) due to Google Ads API segment restrictions - geo segments cannot be combined with device/network segments in a single query.

**Estimated rows (7 years):** ~100,000-150,000

#### GA4 Data Architecture (Three Tables)

**Purpose:** GA4 answers "what happens after users click on our ads?" This is the post-click funnel that connects ad spend to business outcomes.

```
Ad Click → Landing Page → User Behavior → Conversion (or Bounce)
              ↓                ↓                ↓
         GA4_Pages       GA4_Events      GA4_Sessions
```

GA4 data is split into three tables because each answers different questions:

1. **Sessions** - "How much quality traffic did each campaign drive?"
   - Traffic volume and engagement by Campaign × Device × Country
   - Primary join point for Ads data to calculate cost-per-engaged-session
   - Enables geographic performance analysis (which markets convert?)

2. **Pages** - "Which landing pages work?"
   - Separates "is the targeting right?" from "is the page right?"
   - A campaign might drive clicks to a page that bounces everyone
   - Enables landing page optimization independently from targeting optimization

3. **Events** - "What do users actually do, and what counts as success?"
   - Captures user behavior: scroll, click, form_start, form_submit, etc.
   - Enables funnel analysis: page_view → engagement → conversion
   - Preserves raw events so "conversion" definition can evolve over time
   - Diagnostic power: high form_start + low form_submit = UX problem

**Filtering:** Only campaign traffic is pulled (excludes direct/organic). This dashboard exists to analyze ad spend effectiveness. Direct traffic is a different analysis.

See ADR-013 for full rationale on this architecture.

#### Sheet: `Raw_GA4_Sessions`

Session-level metrics for joining to Ads data and geographic analysis.

**Grain:** Date × Campaign × Device × Country

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| Campaign | String | Campaign name (from UTM or auto-tag) |
| Device | String | desktop, mobile, tablet |
| Country | String | Country name |
| Sessions | Number | Session count |
| Users | Number | Total users |
| NewUsers | Number | First-time visitors |
| EngagedSessions | Number | Sessions with engagement (>10s or conversion) |
| BounceRate | Number | Decimal (0-1) |
| AvgSessionDuration | Number | Seconds |

**Note:** GA4 does not have NetworkType dimension. This is a known limitation when joining with Ads data.

**Estimated rows (7 years):** ~50,000-75,000

#### Sheet: `Raw_GA4_Pages`

Landing page performance for understanding which pages convert.

**Grain:** Date × Campaign × LandingPage

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| Campaign | String | Campaign name |
| LandingPage | String | Landing page path (e.g., /speaking, /contact) |
| Sessions | Number | Session count |
| EngagedSessions | Number | Sessions with engagement |
| BounceRate | Number | Decimal (0-1) |
| PageViews | Number | Total page views |

**Estimated rows (7 years):** ~30,000-50,000

#### Sheet: `Raw_GA4_Events`

Event-level data for flexible conversion definition and device-level conversion analysis. The UI can let users select which events count as "conversions" rather than hardcoding this at data collection time.

**Grain:** Date × Campaign × Device × EventName

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| Campaign | String | Campaign name |
| Device | String | desktop, mobile, tablet |
| EventName | String | GA4 event name (e.g., page_view, scroll, form_submit, generate_lead) |
| EventCount | Number | Number of times event fired |

**Note:** Device dimension added per ADR-014 to enable device-level conversion analysis (e.g., "Do mobile users convert better than desktop?").

**Estimated rows (7 years):** ~60,000-120,000 (depends on number of event types)

#### Sheet: `Raw_Ads_Keywords`

Keyword-level detail for bid optimization and quality analysis.

**Grain:** Date × Campaign × AdGroup × Keyword × Device × NetworkType

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Parent campaign ID |
| CampaignName | String | Parent campaign name |
| CampaignType | String | SEARCH, DISPLAY, etc. |
| AdGroupId | String | Parent ad group ID |
| AdGroupName | String | Parent ad group name |
| KeywordId | String | Unique keyword ID |
| KeywordText | String | The keyword text |
| MatchType | String | EXACT, PHRASE, BROAD |
| Status | String | ENABLED, PAUSED, REMOVED |
| QualityScore | Number | 1-10 score (if available) |
| Device | String | DESKTOP, MOBILE, TABLET |
| NetworkType | String | SEARCH, DISPLAY, etc. |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| AvgCPC | Number | Average cost per click |
| Conversions | Number | Count |

**Estimated rows (7 years):** ~500,000+

#### Sheet: `Raw_Ads_SearchTerms`

Search term data for intent analysis and negative keyword discovery.

**Grain:** Date × Campaign × AdGroup × Keyword × SearchTerm × Device

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| CampaignType | String | Campaign type |
| AdGroupId | String | Ad group ID |
| AdGroupName | String | Ad group name |
| KeywordText | String | Matched keyword |
| SearchTerm | String | Actual user search query |
| Device | String | DESKTOP, MOBILE, TABLET |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| Conversions | Number | Count |

**Estimated rows (7 years):** ~1,000,000+ (highest volume sheet)

#### Sheet: `Raw_Ads_Geographic`

Campaign-level metrics by country. Separate from Raw_Ads_Daily due to Google Ads API segment restrictions. Uses `geographic_view` resource which returns criterion IDs instead of country names.

**Grain:** Date × Campaign × CountryCriterionId

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| CampaignType | String | SEARCH, DISPLAY, etc. |
| CountryCriterionId | Number | Google Ads geo target criterion ID (e.g., 2840 = USA, 2826 = UK) |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| Conversions | Number | Count |

**Note:** Cannot include Device or NetworkType in this query due to API segment incompatibility. Country names can be resolved from criterion IDs via a lookup table in the dashboard/aggregation layer (see Google Ads API `geo_target_constant` resource for ID mappings).

**Estimated rows (7 years):** ~50,000-75,000

### Summary Sheets (Dashboard Source)

These sheets are pre-aggregated for fast dashboard queries. Recomputed nightly at 5 AM.

**Architecture Decision:** We use three summary tables to avoid data redundancy issues:
- **Summary_Monthly** - Ads + GA4 Sessions joined at Campaign × Device level
- **Summary_Events** - Event counts at Campaign × Device × EventName level (for flexible conversion selection)
- **Summary_Campaigns** - Campaign totals with JSON for event aggregates

This separation exists because GA4 doesn't have NetworkType dimension. Rather than repeat GA4 metrics across NetworkType rows (which would cause confusion and potential triple-counting), we aggregate Ads data by Campaign × Device (using CampaignType for SEARCH vs DISPLAY analysis instead of NetworkType).

#### Sheet: `Summary_Monthly`

Monthly aggregates for time-based comparisons (YoY, MoM).

**Grain:** YearMonth × Campaign × Device

| Column | Type | Description |
|--------|------|-------------|
| YearMonth | String | YYYY-MM format |
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| CampaignType | String | SEARCH, DISPLAY, VIDEO (use for network analysis) |
| Device | String | DESKTOP, MOBILE, TABLET |
| **Ads Metrics** | | |
| Cost | Number | Total spend |
| Clicks | Number | Total clicks |
| Impressions | Number | Total impressions |
| AdsConversions | Number | Google Ads tracked conversions |
| **GA4 Session Metrics** | | |
| Sessions | Number | Total sessions |
| Users | Number | Total users |
| NewUsers | Number | First-time visitors |
| EngagedSessions | Number | Sessions with engagement |

**Note:** NetworkType removed from grain. Use CampaignType for SEARCH vs DISPLAY analysis. This enables clean Ads + GA4 join without redundancy.

**Dashboard calculates:** CTR, AvgCPC, BounceRate, CostPerSession, CostPerEngagedSession at query time.

**Estimated rows:** ~2,500 (84 months × ~10 campaigns × 3 devices)

#### Sheet: `Summary_Events`

Monthly event counts for flexible conversion definition. Dashboard queries this to calculate cost-per-conversion based on user-selected events.

**Grain:** YearMonth × Campaign × Device × EventName

| Column | Type | Description |
|--------|------|-------------|
| YearMonth | String | YYYY-MM format |
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| Device | String | DESKTOP, MOBILE, TABLET |
| EventName | String | page_view, scroll, form_submit, etc. |
| EventCount | Number | Total occurrences |

**Dashboard flow:**
1. Query Summary_Monthly for Cost by Campaign × Device × YearMonth
2. Query Summary_Events for EventCount, filtered by user-selected events (e.g., form_submit + generate_lead)
3. Join on Campaign × Device × YearMonth
4. Calculate: CostPerConversion = Cost / SUM(selected EventCounts)

**Estimated rows:** ~7,500 (84 months × ~10 campaigns × 3 devices × ~3 key events)

#### Sheet: `Summary_Campaigns`

Campaign-level totals for quick reference (campaign picker, overall stats).

**Grain:** One row per Campaign

| Column | Type | Description |
|--------|------|-------------|
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| CampaignType | String | SEARCH, DISPLAY, VIDEO |
| Status | String | Current status (ENABLED, PAUSED, REMOVED) |
| FirstDate | String | First date with data |
| LastDate | String | Most recent date with data |
| **All-Time Totals** | | |
| AllTime_Cost | Number | Lifetime spend |
| AllTime_Clicks | Number | Lifetime clicks |
| AllTime_Impressions | Number | Lifetime impressions |
| AllTime_AdsConversions | Number | Lifetime Ads conversions |
| AllTime_Sessions | Number | Lifetime sessions |
| AllTime_EngagedSessions | Number | Lifetime engaged sessions |
| AllTime_EventCounts | JSON | `{"page_view":15000,"form_submit":500,...}` |
| **Last 12 Months** | | |
| L12M_Cost | Number | Rolling 12 months spend |
| L12M_Clicks | Number | Rolling 12 months clicks |
| L12M_Impressions | Number | Rolling 12 months impressions |
| L12M_AdsConversions | Number | Rolling 12 months Ads conversions |
| L12M_Sessions | Number | Rolling 12 months sessions |
| L12M_EngagedSessions | Number | Rolling 12 months engaged sessions |
| L12M_EventCounts | JSON | `{"page_view":5000,"form_submit":200,...}` |

**Note:** JSON columns store event totals for quick campaign-level conversion overview. YTD can be derived from Summary_Monthly.

**Estimated rows:** ~10-20 (one per campaign)

### System Sheet

#### Sheet: `System_Logs`

Error and debug logging.

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | DateTime | When the log was created |
| Level | String | INFO, WARN, ERROR |
| Source | String | Service/function name |
| Message | String | Log message |

## Google Ads Script Queries

### Daily Export Query (Raw_Ads_Daily)

```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.advertising_channel_type,
  campaign.status,
  segments.device,
  segments.ad_network_type,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversions,
  metrics.cost_per_conversion,
  metrics.search_impression_share
FROM campaign
WHERE segments.date DURING YESTERDAY
ORDER BY metrics.cost_micros DESC
```

### Keyword Query (Raw_Ads_Keywords)

```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.advertising_channel_type,
  ad_group.id,
  ad_group.name,
  ad_group_criterion.criterion_id,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.status,
  ad_group_criterion.quality_info.quality_score,
  segments.device,
  segments.ad_network_type,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversions
FROM keyword_view
WHERE segments.date DURING YESTERDAY
ORDER BY metrics.cost_micros DESC
```

### Search Term Query (Raw_Ads_SearchTerms)

```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.advertising_channel_type,
  ad_group.id,
  ad_group.name,
  segments.keyword.info.text,
  search_term_view.search_term,
  segments.device,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.conversions
FROM search_term_view
WHERE segments.date DURING YESTERDAY
ORDER BY metrics.impressions DESC
```

### Geographic Query (Raw_Ads_Geographic)

```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.advertising_channel_type,
  geographic_view.country_criterion_id,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.conversions
FROM geographic_view
WHERE segments.date DURING YESTERDAY
  AND metrics.impressions > 0
ORDER BY metrics.cost_micros DESC
```

**Note:** Uses `geographic_view` resource instead of `campaign` because `segments.geo_target_country` is not compatible with the `campaign` resource. The `geographic_view` returns `country_criterion_id` (a numeric ID) rather than country names. Country names can be resolved via Google Ads `geo_target_constant` resource or a static lookup table.

## Dashboard Data Flow

### Main Dashboard Load (Fast Path)

```
User opens dashboard
        │
        ▼
┌─────────────────────────┐
│ getDashboardData()      │  < 2 seconds
│ reads Summary_Monthly   │
│ reads Summary_Campaigns │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Client-side filtering   │  < 0.5 seconds
│ and aggregation         │
│ (in-memory, ~4000 rows) │
└───────────┬─────────────┘
            │
            ▼
    Dashboard renders
```

### Drill-Down (Slower Path - User Expects Delay)

```
User clicks "View Keywords" for Campaign X
        │
        ▼
┌─────────────────────────┐
│ getKeywordDetail()      │  2-3 seconds
│ reads Raw_Ads_Keywords  │
│ filtered by Campaign    │
└───────────┬─────────────┘
            │
            ▼
    Detail view renders
```

## Nightly Aggregation Job

Scheduled Apps Script trigger at 5 AM (after Ads script at 3 AM, GA4 pull at 4 AM):

```javascript
function nightlyAggregation() {
  // 1. Read raw data
  const rawAds = readSheet('Raw_Ads_Daily');
  const rawGA4 = readSheet('Raw_GA4_Daily');

  // 2. Aggregate by YearMonth × Campaign × Device × NetworkType
  const monthly = aggregateMonthly(rawAds, rawGA4);

  // 3. Calculate campaign summaries
  const campaigns = aggregateCampaigns(rawAds);

  // 4. Write summary sheets (overwrite)
  writeSheet('Summary_Monthly', monthly);
  writeSheet('Summary_Campaigns', campaigns);

  Logger.log('Nightly aggregation complete');
}
```

## Implementation Strategy

1. **Clasp** for local development with Git version control
2. **Hybrid Data Model**: Google Ads internal script pushes to Sheets; GA4 pulls via API
3. **Two-Tier Storage**: Raw sheets for audit, Summary sheets for speed
4. **Historical Backfill**: One-time script to populate 7 years of historical data
5. **Nightly Aggregation**: Time-driven trigger to keep summary sheets fresh
6. **Mock Data Fallback**: Services support fallback to mock data if APIs unavailable
