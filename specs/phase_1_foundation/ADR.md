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
- **Decision**: We will use Google Sheets with 6 dedicated sheets:
  - `Raw_Ads_Campaigns` - Campaign-level daily metrics
  - `Raw_Ads_AdGroups` - Ad Group-level daily metrics
  - `Raw_Ads_Keywords` - Keyword-level daily metrics
  - `Raw_Ads_SearchTerms` - Search term-level daily metrics
  - `Raw_GA4_Data` - GA4 session metrics
  - `System_Logs` - Error and debug logging
- **Consequences**:
  - (+) User can easily inspect, fix, or manually chart data.
  - (+) No external database costs (SQL, Firebase).
  - (+) Clear separation of data by granularity level.
  - (-) Row limit (10M cells) - need to monitor search terms volume.
  - (-) Querying large datasets in Apps Script is slower than SQL.

## ADR-003: Client-Side vs Server-Side Rendering

- **Status**: Accepted
- **Context**: We need a snappy dashboard.
- **Decision**: We will use a hybrid approach. The server returns a basic HTML shell (`HtmlService`), and client-side JavaScript fetches data asynchronously via `google.script.run`.
- **Consequences**:
  - (+) Faster "First Paint" (user sees UI while data loads).
  - (+) Prevents the "blank white screen" while Apps Script wakes up and fetches Sheet data.

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

## ADR-005: 4-Level Google Ads Data Granularity

- **Status**: Accepted
- **Context**: To properly analyze the marketing funnel and optimize performance, we need visibility at multiple levels - not just campaigns.
- **Decision**: We will collect Google Ads data at 4 levels of granularity:
  1. **Campaign** - Strategic overview, budget allocation
  2. **Ad Group** - Tactical analysis, messaging performance
  3. **Keyword** - Bid optimization, quality score tracking
  4. **Search Term** - Intent analysis, negative keyword discovery
- **Alternatives Considered**:
  - Campaign-only: Rejected - insufficient for optimization decisions
  - Campaign + Ad Group: Rejected - missing keyword-level insights
  - Exclude Search Terms: Rejected - critical for understanding actual user intent
- **Consequences**:
  - (+) Full visibility into the Ads funnel.
  - (+) Can analyze performance at any level.
  - (+) Search terms reveal optimization opportunities.
  - (-) More complex script (4 queries instead of 1).
  - (-) Higher data volume, especially for search terms.
  - (-) Longer script execution time.

## ADR-006: Historical Backfill Strategy

- **Status**: Accepted
- **Context**: The daily script only captures yesterday's data. We need historical data for YoY analysis (Phase 3 goal).
- **Decision**: We will create a separate one-time backfill script that:
  - Exports 2+ years of historical data
  - Populates all 4 Ads sheets
  - Handles execution time limits by chunking date ranges if needed
- **Consequences**:
  - (+) Complete historical dataset from day one.
  - (+) Enables immediate YoY analysis once Phase 3 is built.
  - (+) Separate script keeps daily script simple.
  - (-) One-time manual effort to run and verify.
  - (-) May need to run in chunks if data volume exceeds execution limits.
