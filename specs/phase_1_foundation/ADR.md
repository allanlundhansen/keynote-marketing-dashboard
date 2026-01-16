# Phase 1: Architecture Decision Records (ADR)

## ADR-001: Use of Google Apps Script

- **Status**: Accepted
- **Context**: User needs a low-maintenance, cost-effective way to analyze Google ecosystem data (Ads, Analytics).
- **Decision**: We will use Google Apps Script.
- **Consequences**:
  - (+) Free hosting and execution.
  - (+) Native OAuth handling for Google services (no managing tokens manually).
  - (+) Easy access to Sheets as a database.
  - (-) Execution time limits (6 mins for manual, 30 mins for scheduled).
  - (-) "clasp" workflow required for modern development experience.

## ADR-002: Google Sheets as Database

- **Status**: Accepted (Updated)
- **Context**: We need to store historical daily data for comparison (YoY) at multiple levels of granularity.
- **Decision**: We will use Google Sheets with a two-tier data model:
  - **Raw Data Sheets** (source of truth, append-only):
    - `Raw_Ads_Daily` - Campaign-level daily metrics with Device, NetworkType, Country
    - `Raw_Ads_Keywords` - Keyword-level daily metrics
    - `Raw_Ads_SearchTerms` - Search term-level daily metrics
    - `Raw_GA4_Daily` - GA4 session metrics by Campaign, Device, Country
  - **Summary Sheets** (pre-aggregated for fast dashboard):
    - `Summary_Monthly` - Monthly aggregates by Campaign × Device × NetworkType
    - `Summary_Campaigns` - Campaign-level totals
  - **System**:
    - `System_Logs` - Error and debug logging
- **Consequences**:
  - (+) User can easily inspect, fix, or manually chart data.
  - (+) No external database costs (SQL, Firebase).
  - (+) Fast dashboard loads via pre-aggregated summary sheets.
  - (+) Raw data preserved for audit and drill-down.
  - (-) Row limit (10M cells) - need to monitor search terms volume.
  - (-) Requires nightly aggregation job to keep summaries fresh.

## ADR-003: Client-Side vs Server-Side Rendering

- **Status**: Accepted
- **Context**: We need a snappy dashboard with < 2 second load times.
- **Decision**: We will use a hybrid approach. The server returns a basic HTML shell (`HtmlService`), and client-side JavaScript fetches data asynchronously via `google.script.run` from **summary sheets** (not raw data).
- **Consequences**:
  - (+) Faster "First Paint" (user sees UI while data loads).
  - (+) Dashboard reads small summary sheets (~4,000 rows) instead of large raw data (~100,000+ rows).
  - (+) Client-side filtering/aggregation is fast on small datasets.
  - (-) Drill-down to raw data is slower (acceptable trade-off).

## ADR-004: Hybrid Data Ingestion Model

- **Status**: Accepted
- **Context**: Google Ads API requires basic access approval, which can take days/weeks. We need to start collecting data immediately.
- **Decision**: We will use a hybrid approach:
  - **Google Ads**: Internal script running IN the Google Ads account pushes data to Sheets daily. This bypasses API access requirements.
  - **GA4**: Direct API pull via Apps Script (Analytics Data API is readily accessible).
- **Consequences**:
  - (+) Unblocked by API approval process.
  - (+) Internal scripts have native access to all account data.
  - (+) Can switch to direct API later if/when approved.
  - (-) Two separate codebases to maintain (Ads script + Apps Script).
  - (-) Ads data push is fire-and-forget (no real-time querying).

## ADR-005: Raw Data Model with Separate Geographic Sheet

- **Status**: Accepted (Updated)
- **Context**: We need visibility at multiple levels for analysis. Initially we tried to consolidate into 3 sheets with Country as a column in Raw_Ads_Daily, but discovered that Google Ads API has segment restrictions that prevent combining geo segments with device/network segments in a single query.
- **Decision**: We will store Google Ads raw data in 4 sheets:
  1. **Raw_Ads_Daily** - Campaign-level by Date × Device × NetworkType (no Country)
  2. **Raw_Ads_Keywords** - Keyword-level detail for QualityScore tracking and bid optimization
  3. **Raw_Ads_SearchTerms** - Search term detail for intent analysis
  4. **Raw_Ads_Geographic** - Campaign-level by Date × Country (no Device/NetworkType)
- **Rationale**:
  - Google Ads API prohibits combining `segments.geo_target_country` with `segments.device` or `segments.ad_network_type` in the same query
  - Separate Geographic sheet allows both analyses without compromising either
  - AdGroup metrics can be derived from Keywords if needed
- **Consequences**:
  - (+) Both Device/NetworkType and Country analyses are possible.
  - (+) Clean separation respects API constraints.
  - (-) Two separate queries for campaign data (slightly more execution time).
  - (-) No combined Device × Country analysis (API limitation).

## ADR-006: Historical Backfill Strategy

- **Status**: Accepted
- **Context**: The daily script only captures yesterday's data. We need historical data for YoY analysis.
- **Decision**: We will create a separate one-time backfill script that:
  - Exports up to 7 years of historical data (where available)
  - Populates all 3 raw Ads sheets
  - Handles execution time limits by chunking date ranges (one year per run)
- **Consequences**:
  - (+) Complete historical dataset from day one.
  - (+) Enables immediate YoY analysis.
  - (+) Separate script keeps daily script simple.
  - (-) One-time manual effort to run and verify.
  - (-) Keyword/SearchTerm data only available ~2 years back (Google retention limit).

## ADR-007: Pre-Aggregated Summary Sheets for Dashboard Performance

- **Status**: Accepted
- **Context**: Raw data sheets will contain 100,000+ rows over 7 years. Reading and aggregating this data on every dashboard load would take 10+ seconds, which is unacceptable for user experience.
- **Decision**: We will maintain pre-aggregated summary sheets that the dashboard reads from:
  - **Summary_Monthly**: Monthly aggregates (~4,000 rows) for time-based comparisons
  - **Summary_Campaigns**: Campaign totals (~20 rows) for quick reference
- **Aggregation Schedule**: Nightly at 5 AM via Apps Script time-driven trigger
- **Alternatives Considered**:
  - Real-time aggregation: Rejected - too slow for dashboard UX
  - Caching (CacheService): Rejected - limited size (100KB), 6-hour TTL
  - External database: Rejected - adds cost and complexity
- **Consequences**:
  - (+) Dashboard loads in < 2 seconds.
  - (+) Client-side filtering on ~4,000 rows is instant.
  - (+) Raw data preserved for audit and drill-down.
  - (-) Data is up to 24 hours stale (acceptable for daily metrics).
  - (-) Additional complexity of aggregation job.
  - (-) Must keep aggregation logic in sync with raw data schema.

## ADR-008: Separate Ads and GA4 Raw Data (Join Limitation)

- **Status**: Accepted
- **Context**: We want to join Ads spend data with GA4 session/conversion data to calculate metrics like CostPerSession. However, the data sources have different available dimensions.
- **Decision**: We will keep Ads and GA4 data in separate raw sheets and join them at aggregation time.
- **The Limitation**:
  - Google Ads has: Date, Campaign, Device, **NetworkType**, Country
  - GA4 has: Date, Campaign, Device, Country (NO NetworkType)
  - GA4 cannot distinguish whether a session came from Search vs Display ads
- **Join Strategy**:
  - Raw sheets remain separate with their native dimensions
  - Summary_Monthly joins at Campaign × Device level
  - GA4 metrics are repeated across NetworkType rows in Summary_Monthly
  - This is documented clearly to avoid confusion
- **Alternatives Considered**:
  - Force single table: Rejected - would require dropping NetworkType or duplicating GA4 data in raw sheets
  - UTM parameter parsing: Rejected - would require custom UTM setup and still wouldn't capture NetworkType
- **Consequences**:
  - (+) Honest data model that reflects actual source capabilities.
  - (+) No data loss or artificial constraints.
  - (+) Clear documentation of the limitation.
  - (-) Cannot calculate CostPerSession at NetworkType level.
  - (-) Summary sheet has some redundancy (GA4 metrics repeated across NetworkType).

## ADR-009: Device and NetworkType as Critical Dimensions

- **Status**: Accepted
- **Context**: User needs to analyze performance across different devices (DESKTOP, MOBILE, TABLET) and network types (SEARCH, DISPLAY, YOUTUBE) to optimize budget allocation.
- **Decision**: Device and NetworkType will be included as dimensions in Raw_Ads_Daily and carried through to Summary_Monthly.
- **Rationale**:
  - NetworkType is critical to evaluate spend efficiency (Search tends to be higher intent than Display)
  - Device is critical because mobile vs desktop behavior differs significantly
  - Speaking gig inquiries may come disproportionately from desktop users (researching for events)
- **Consequences**:
  - (+) Can analyze SEARCH vs DISPLAY ROI.
  - (+) Can optimize budget by device type.
  - (+) Enables more granular performance insights.
  - (-) Increases row count in raw data (~3x for Device, ~3x for Network).
  - (-) GA4 cannot match NetworkType dimension (see ADR-008).

## ADR-010: Country-Only Geographic Analysis (No Region)

- **Status**: Accepted
- **Context**: User initially wanted geographic analysis. We discussed whether to include Region-level granularity.
- **Decision**: We will include Country as a dimension but NOT Region. Geographic data is stored in a separate `Raw_Ads_Geographic` sheet.
- **Rationale**:
  - Speaking gigs are location-dependent, so geographic data is valuable
  - Country-level is sufficient for strategic decisions (which markets to target)
  - Region-level would significantly increase data volume without proportional value
  - User confirmed Region is not needed
  - Separate sheet is required due to Google Ads API segment restrictions (see ADR-005)
- **Consequences**:
  - (+) Geographic insights available at Country level.
  - (+) Manageable data volume.
  - (-) Cannot drill down to state/region level within a country.
  - (-) Cannot combine Country with Device/NetworkType analysis (API limitation).

## ADR-011: Google Ads API Segment Restrictions and Geographic View

- **Status**: Accepted (Updated)
- **Context**: During implementation, we discovered multiple Google Ads API limitations:
  1. `segments.geo_target_country` cannot be combined with `segments.device` or `segments.ad_network_type`
  2. `segments.geo_target_country` is NOT compatible with the `campaign` resource at all
  3. Geographic data must be queried via the `geographic_view` resource, which returns criterion IDs instead of country names
- **Decision**: Use `geographic_view` resource for geographic data, storing criterion IDs instead of country names.
- **The Limitations**:
  - `segments.geo_target_country` with `campaign` resource: "QueryError.PROHIBITED_SEGMENT_IN_SELECT_OR_WHERE_CLAUSE"
  - Must use `geographic_view` resource which provides `geographic_view.country_criterion_id` (numeric ID)
  - Examples: USA = 2840, UK = 2826, Canada = 2124, Australia = 2036
- **Impact**:
  - Cannot have a single sheet with Device × NetworkType × Country
  - Geographic sheet stores numeric criterion IDs, not human-readable country names
  - Country name resolution needed in dashboard/aggregation layer
- **Mitigation**:
  - Separate `Raw_Ads_Daily` (Device × NetworkType) and `Raw_Ads_Geographic` (CountryCriterionId) sheets
  - Use `geographic_view` resource with `country_criterion_id` field
  - Resolve country names via lookup table or `geo_target_constant` API in dashboard/aggregation layer
  - Summary sheets can combine data at Campaign level for joined analysis
- **Consequences**:
  - (+) Geographic analysis is possible with criterion IDs.
  - (+) Clear separation respects API constraints.
  - (+) Criterion IDs are stable identifiers.
  - (-) Extra step needed to resolve IDs to country names.
  - (-) Some combined analyses (e.g., "mobile users in Germany") not directly available.

## ADR-012: Multi-Spreadsheet Architecture for Scalability

- **Status**: Accepted
- **Context**: During historical backfill testing, we hit Google Sheets' 10 million cell limit. With 7 years of data across all raw sheets, the cell count exceeds this limit - particularly SearchTerms (~7M cells) and Keywords (~4M cells).
- **Decision**: Use **one spreadsheet per data type** instead of a single spreadsheet.
- **Spreadsheet Structure**:
  1. `Raw_Ads_Daily` spreadsheet - Campaign metrics by Date × Device × NetworkType
  2. `Raw_Ads_Keywords` spreadsheet - Keyword-level metrics
  3. `Raw_Ads_SearchTerms` spreadsheet - Search term data (highest volume)
  4. `Raw_Ads_Geographic` spreadsheet - Campaign metrics by CountryCriterionId
  5. `Raw_GA4_Daily` spreadsheet - GA4 session metrics
  6. `Dashboard` spreadsheet - Summary_Monthly, Summary_Campaigns, System_Logs
- **Alternatives Considered**:
  - Single spreadsheet with reduced history: Rejected - loses valuable historical data
  - Aggregate high-volume data: Rejected - loses granularity needed for analysis
  - Skip SearchTerms: Rejected - search term analysis is critical for optimization
- **Configuration**: All spreadsheet IDs tracked in `specs/spreadsheet_config.md`
- **Consequences**:
  - (+) Each spreadsheet has its own 10M cell limit - future-proof for 7+ years
  - (+) Clean isolation - if one corrupts, others unaffected
  - (+) Easy to manage/archive individual data types
  - (+) Can share different spreadsheets with different access levels if needed
  - (-) 6 spreadsheet IDs to manage in config
  - (-) Scripts need to reference multiple spreadsheets

## ADR-013: GA4 Three-Table Architecture for Post-Click Funnel Analysis

- **Status**: Accepted

### Context

The initial GA4 implementation used a single table (`Raw_GA4_Daily`) with aggregate metrics (sessions, bounce rate, conversions) by Campaign × Device × Country. This approach was fundamentally flawed because it treated GA4 as just "more metrics" rather than understanding its true purpose.

**The core insight:** Google Ads tells us cost and clicks. GA4 tells us what happens *after* the click. This is the post-click funnel:

```
Ad Click → Landing Page → User Behavior → Conversion (or Bounce)
```

To optimize ad spend, we need to answer:
1. **Where do users land?** - Which pages receive traffic, and do they convert or bounce?
2. **What do users do?** - What actions indicate engagement vs abandonment?
3. **What counts as success?** - Which events represent actual business value?

The single-table approach couldn't answer these questions because:
- It lacked landing page data entirely (can't diagnose "bad targeting" vs "bad page")
- It used a pre-aggregated "conversions" metric (what if conversion tracking changed over time?)
- It provided no visibility into user behavior patterns

### Decision

Split GA4 data into three specialized tables, each serving a distinct analytical purpose:

| Table | Grain | Analytical Purpose |
|-------|-------|-------------------|
| `Raw_GA4_Sessions` | Date × Campaign × Device × Country | Traffic volume, quality, and geographic performance. Primary join point for Ads ROI calculations. |
| `Raw_GA4_Pages` | Date × Campaign × LandingPage | Landing page effectiveness. Answers "is the page converting?" separately from "is the targeting right?" |
| `Raw_GA4_Events` | Date × Campaign × EventName | User behavior and conversion tracking. Preserves raw event data so conversion definitions can evolve. |

### Why Three Tables Instead of One?

**Dimensionality explosion:** If we combined all dimensions (Date × Campaign × Device × Country × LandingPage × EventName), most row combinations would be empty while the few with data would be extremely granular. Three focused tables keep each dataset manageable.

**Different questions, different grains:** Landing page analysis doesn't need device breakdown. Event analysis doesn't need country breakdown. Separating concerns keeps each table focused on its purpose.

**Event data is special:** Unlike aggregate metrics, events tell a story. A user who fires `page_view → scroll → click_contact → form_submit` is showing progressive engagement. A user who fires only `page_view` bounced. By storing event counts, we preserve this behavioral signal.

### Why Events Matter (Beyond "Flexible Conversions")

Events are not just for letting the UI pick what counts as a conversion. Events are the behavioral data layer that tells us *what users actually do*:

1. **Engagement signals:** Scroll events indicate interest. Click events show interaction. Time-based events show attention span.

2. **Funnel visibility:** By tracking `form_start` vs `form_submit`, we can see form abandonment. By tracking `click_contact` vs actual contact, we can see intent that doesn't convert.

3. **Historical continuity:** Conversion tracking changes. Maybe in 2022 you only had `form_submit`. In 2023 you added `calendar_booking`. In 2024 you added `phone_click`. By storing raw events, historical data doesn't become useless when tracking evolves.

4. **Diagnostic power:** High sessions + low `scroll` events = landing page doesn't capture attention. High `form_start` + low `form_submit` = form UX problem. This diagnostic capability is lost with aggregate "conversion" metrics.

### Data Filtering Decision

We filter to campaign traffic only (exclude `(direct)` and `(not set)` sessions). This dashboard exists to analyze ad spend effectiveness. Direct traffic analysis is valuable but is a different question with different answers.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Single table with all dimensions | Row explosion, most combinations empty, unfocused analysis |
| Drop landing page dimension | Loses ability to diagnose page vs targeting problems |
| Drop country dimension | User pushed back; important for understanding which markets perform |
| Pre-aggregate conversions | Loses historical flexibility when tracking changes |
| Skip events entirely | Loses behavioral insights and funnel visibility |

### Consequences

**Positive:**
- Landing page analysis enables "fix the page" vs "fix the targeting" diagnosis
- Event-level data preserves behavioral insights and conversion flexibility
- Country analysis enables market performance comparison
- Each table serves a focused purpose with manageable row counts
- Historical data remains useful even as tracking evolves

**Negative:**
- 3 GA4 spreadsheets instead of 1 (8 total spreadsheets now)
- 3 separate API calls per daily fetch
- Dashboard aggregation logic becomes more complex
- Joins across tables required for some analyses
