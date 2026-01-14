# Phase 1: Architecture Decision Records (ADR)

## ADR-001: Use of Google Apps Script

- **Status**: Accepted
- **Context**: User needs a low-maintenance, cost-effective way to analyze Google ecosystem data (Ads, Analytics).
- **Decision**: We will use Google Apps Script.
- **Consequences**:
  - (+) Free hosting and execution.
  - (+) Native OAuth handling for Google services (no managing tokens manually).
  - (+) Easy access to Sheets as a database.
  - (-) Execution time limits (6 mins).
  - (-) "clasp" workflow required for modern development experience.

## ADR-002: Google Sheets as Database

- **Status**: Accepted
- **Context**: We need to store historical daily data for comparison (YoY).
- **Decision**: We will append daily aggregation rows to Google Sheets (`Raw_Ads_Data`, `Raw_GA4_Data`).
- **Consequences**:
  - (+) User can easily inspect, fix, or manually charts data.
  - (+) No external database costs (SQL, Firebase).
  - (-) Row limit (10M cells) - though likely fine for 7 years of aggregated daily data.
  - (-) Querying large datasets in Apps Script is slower than SQL.

## ADR-003: Client-Side vs Server-Side Rendering

- **Status**: Accepted
- **Context**: We need a snappy dashboard.
- **Decision**: We will use a hybrid approach. The server returns a basic HTML shell (`HtmlService`), and client-side JavaScript fetches data asynchronously via `google.script.run`.
- **Consequences**:
  - (+) Faster "First Paint" (user sees UI while data loads).
  - (+) Prevents the "blank white screen" while Apps Script wakes up and fetches Sheet data.
