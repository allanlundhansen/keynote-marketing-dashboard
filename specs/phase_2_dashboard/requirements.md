# Phase 2: Dashboard Frontend Requirements

## Overview

This phase delivers the web-based dashboard UI that visualizes marketing performance data from the summary sheets created in Phase 1. The dashboard enables analysis of ad spend effectiveness, campaign performance trends, and conversion funnel insights.

## Goals

1. **Fast Performance** - Initial load under 2 seconds by reading from pre-aggregated summary sheets
2. **Actionable Insights** - Answer "Is my marketing working?" with clear metrics and comparisons
3. **Flexible Analysis** - Filter, drill-down, and customize what counts as a "conversion"
4. **Self-Service** - User can explore data without technical knowledge

## User Stories

### As a keynote speaker managing Google Ads campaigns, I want to...

1. **See overall performance at a glance** so I can quickly assess if campaigns are working
2. **Compare current month vs same month last year** so I can understand seasonal trends
3. **View performance trends over time** so I can spot patterns and anomalies
4. **Break down performance by campaign** so I can identify winners and losers
5. **Analyze by device type** so I can optimize for desktop vs mobile
6. **Analyze by campaign type** so I can compare Search vs Display effectiveness
7. **Analyze by country** so I can understand which markets perform best
8. **Define what counts as a conversion** so I can track the metrics that matter to my business
9. **Drill down to keyword detail** so I can optimize bids and identify opportunities
10. **Drill down to search terms** so I can find negative keyword opportunities
11. **See landing page performance** so I can diagnose page vs targeting issues

## Functional Requirements

### 1. Dashboard Home (Primary View)

The Overview answers "Is my marketing working?" at a glance through a hierarchical layout with 5 sections.

#### 1.1 Primary KPIs (4 Large Cards)

- [ ] Display 4 key metrics prominently:
  - Total Cost (what we're spending)
  - Conversions (what we're getting - based on selected events)
  - Cost per Conversion (efficiency metric)
  - Engagement Rate (Engaged Sessions / Sessions - funnel health)
- [ ] Show percentage change vs comparison period
- [ ] Color-code changes (green for improvement, red for decline)
- [ ] These 4 metrics answer the core question directly

#### 1.2 Funnel Visualization

- [ ] Display horizontal funnel: Impressions → Clicks → Sessions → Engaged Sessions → Conversions
- [ ] Show absolute number at each stage
- [ ] Show conversion rate between each stage (CTR, Click→Session, Session→Engaged, Engaged→Conversion)
- [ ] Show rate change vs comparison period (▲/▼ indicators)
- [ ] Visual width proportional to volume (funnel narrows)
- [ ] Diagnostic value: identifies WHERE in funnel problems occur

#### 1.3 Supporting Metrics (6 Smaller Cards)

- [ ] Display context metrics in secondary prominence:
  - Impressions
  - Clicks
  - CTR (Clicks / Impressions)
  - Sessions
  - Avg CPC (Cost / Clicks)
  - Cost per Session
- [ ] Show percentage change vs comparison period
- [ ] Color-code changes

#### 1.4 Trend Sparkline (with Metric Presets)

- [x] Line chart showing trends over selected date range
- [x] Metric preset selector with options:
  - Cost & Clicks (default)
  - Cost & Sessions
  - Sessions & Engaged Sessions
  - Clicks & Impressions
- [x] Solid lines for current period
- [x] When comparison mode enabled: overlay comparison period as dashed lines
- [x] X-axis aligned by relative position so periods overlay correctly
- [x] Tooltip shows all values (current + comparison) on hover
- [x] Reveals trend pattern differences, not just point-in-time comparison

> **Note:** Metric presets replace the need for a separate Trend Analysis View. See ADR-027.

#### 1.5 Quick Insights (Keywords)

- [ ] Lazy-load after main Overview renders (preserves <2s initial load)
- [ ] Display "Top 5 Keywords by Cost" table with columns: Keyword, Cost, vs Prev, Clicks, Conversions
- [ ] Display "Top 5 Keywords by Conversions" table with columns: Keyword, Conversions, vs Prev, Cost, CTR
- [ ] "vs Prev" shows % change vs comparison period with color coding (▲ green, ▼ red)
- [ ] When comparison mode is "none", show "—" in vs Prev column
- [ ] Surfaces actionable keyword data without requiring drill-down

#### 1.6 Date Range Selection

- [ ] Default view: Last 12 months
- [ ] Custom date range picker (by month, since data is monthly granularity)
- [ ] Comparison mode dropdown with options:
  - None (no comparison)
  - Previous Period (same length, immediately preceding)
  - Same Period Last Year (YoY)
  - Custom (user picks comparison date range)
- [ ] Comparison data flows to all sections (KPIs, funnel, sparkline, keywords)

#### 1.7 Filter Controls

- [ ] Filter by Campaign (multi-select)
- [ ] Filter by Campaign Type (SEARCH, DISPLAY, VIDEO, PERFORMANCE_MAX)
- [ ] Filter by Device (DESKTOP, MOBILE, TABLET)
- [ ] Filters apply to all views and metrics
- [ ] Clear all filters button
- [ ] Filters accessible via sidebar drawer

### 2. Trend Analysis ~~View~~ (Merged into Overview)

> **Decision:** Trend analysis functionality has been merged into the Overview sparkline via metric presets, eliminating the need for a separate Trends view. See ADR-027.

#### 2.1 Time Series Charts - ✅ Merged into Overview Section 1.4

- [x] Monthly trend chart for selected metrics → Implemented as Overview sparkline with presets
- [x] Ability to overlay multiple metrics → Metric preset combinations (e.g., Cost & Sessions)
- [x] Visual comparison line for same period previous year → Dashed lines when comparison enabled

#### 2.2 Metrics Available for Trending - ✅ Available via Presets

Available through preset selector:
- [x] Cost & Clicks (default)
- [x] Cost & Sessions
- [x] Sessions & Engaged Sessions
- [x] Clicks & Impressions

### 3. Campaign Analysis View

> **Reorganized:** Drill-down views (Keywords, Search Terms, Landing Pages) are now part of Campaign Analysis as tabs within Campaign Detail View.

#### 3.1 Campaign List

- [ ] Sortable table with all campaigns
- [ ] Columns: Campaign Name, Type, Cost, Clicks, Impressions, CTR, Sessions, Engaged Sessions, Conversions
- [ ] Click row to navigate to Campaign Detail View

#### 3.2 Campaign Detail View

- [ ] Route: `#/campaigns/:id`
- [ ] Campaign summary metrics at top
- [ ] Tab navigation: Keywords | Search Terms | Landing Pages
- [ ] Back button to return to campaign list

#### 3.3 Keywords Tab (within Campaign Detail)

- [ ] Shows keyword-level performance for selected campaign/date range
- [ ] Columns: Keyword, Match Type, Cost, Clicks, Impressions, CTR, Avg CPC
- [ ] Sortable by any column
- [ ] Expandable rows showing search terms per keyword
- [ ] Acceptable load time: 2-3 seconds

#### 3.4 Search Terms Tab (within Campaign Detail)

- [ ] Shows actual user queries for selected campaign/date range
- [ ] Columns: Search Term, Matched Keyword, Cost, Clicks, Impressions, CTR
- [ ] Useful for negative keyword identification
- [ ] Acceptable load time: 2-3 seconds

#### 3.5 Landing Pages Tab (within Campaign Detail)

- [ ] Shows landing page performance for selected campaign/date range
- [ ] Columns: Landing Page URL, Sessions, Engaged Sessions, Engagement Rate
- [ ] Helps diagnose page vs targeting issues
- [ ] Acceptable load time: 2-3 seconds

#### 3.6 Campaign Comparison (Deferred)

- [ ] Side-by-side comparison of selected campaigns
- [ ] Percentage of total spend/clicks/conversions for each campaign

### 4. Device Analysis View

- [ ] Breakdown of metrics by device (DESKTOP, MOBILE, TABLET)
- [ ] Pie/bar chart showing distribution
- [ ] Table with device-level metrics
- [ ] Identify device with best/worst conversion rate

### 5. Campaign Type Analysis View

- [ ] Breakdown of metrics by campaign type (SEARCH, DISPLAY, etc.)
- [ ] Compare cost efficiency across campaign types
- [ ] Table with campaign-type-level metrics

### 6. Geographic Analysis View

- [ ] Breakdown of metrics by country (from Raw_Ads_Geographic)
- [ ] Map country criterion IDs to country names via lookup table
- [ ] Table showing: Country, Cost, Clicks, Impressions, CTR, Conversions
- [ ] Sortable by any metric
- [ ] Identify top-performing countries by cost efficiency

### 7. Conversion Configuration

#### 7.1 Event Selection

- [ ] Display list of all available events from Summary_Events
- [ ] User can select which events count as "conversions"
- [ ] Multiple events can be selected (e.g., form_submit + phone_click)
- [ ] Selection persists across sessions (localStorage or config sheet)

#### 7.2 Conversion Metrics Update

- [ ] All conversion-related metrics recalculate when selection changes
- [ ] Affected metrics: Conversion Count, Cost per Conversion, Conversion Rate

### ~~8. Drill-Down Views~~ (Consolidated into Section 3)

> **Moved:** Keyword, Search Term, and Landing Page drill-down views have been consolidated into Section 3 (Campaign Analysis) as tabs within the Campaign Detail View. This reflects the actual user flow: Campaign List → Campaign Detail → Keywords/Search Terms/Landing Pages tabs.

### 9. UI States

#### 9.1 Loading State

- [ ] Show loading indicator while data is being fetched
- [ ] Skeleton screens for cards/tables during load

#### 9.2 Error State

- [ ] Display user-friendly error message if data fetch fails
- [ ] Offer retry button
- [ ] Log error details for debugging

#### 9.3 Empty State

- [ ] Show meaningful message when no data matches current filters
- [ ] Suggest actions (e.g., "Try adjusting your date range or filters")

#### 9.4 Data Freshness

- [ ] Display "Data as of: [timestamp]" indicator
- [ ] Timestamp from last successful aggregation

## Non-Functional Requirements

### Performance

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 2 seconds |
| Filter/view change | < 0.5 seconds |
| Drill-down to keywords | < 3 seconds |
| Drill-down to search terms | < 3 seconds |
| Chart rendering | < 1 second |

### Browser Support

- [ ] Chrome (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Mobile browsers (responsive design)

### Accessibility

- [ ] Keyboard navigation for core functionality
- [ ] Sufficient color contrast for text
- [ ] Screen reader compatible labels

### Security

- [ ] Dashboard accessible only to authorized Google account
- [ ] No sensitive data exposed in client-side code
- [ ] OAuth handled by Apps Script

## Data Sources

| View | Primary Data Source | Notes |
|------|---------------------|-------|
| Dashboard Home | Summary_Monthly, Summary_Events | Fast load from summaries |
| Trend Analysis | Summary_Monthly | Pre-aggregated monthly data |
| Campaign Analysis | Summary_Monthly, Summary_Campaigns | Campaign totals for overview |
| Device Analysis | Summary_Monthly | Grouped by Device |
| Campaign Type Analysis | Summary_Monthly | Grouped by CampaignType |
| Geographic Analysis | Raw_Ads_Geographic | Criterion IDs mapped to country names |
| Conversion Config | Summary_Events | List of available events |
| Keyword Drill-down | Raw_Ads_Keywords | Direct read, filtered |
| Search Term Drill-down | Raw_Ads_SearchTerms | Direct read, filtered |
| Landing Page Drill-down | Raw_GA4_Pages | Direct read, filtered |

## Key Decisions

1. **Frontend Framework** - Vue 3 via CDN with Vue Router (hash mode) and PrimeVue components. Rationale: Vue loads easily via CDN without build step, Vue Router supports hash-based routing for browser history/deep linking, PrimeVue provides quality components (tables, dropdowns, charts) via CDN. Keeps deployment simple while providing modern component architecture. Can migrate to full Vite build later if needed.

2. **Routing & Navigation** - Hash-based routing for browser back/forward support and direct URL access to views. URLs like `#/campaigns`, `#/devices`, `#/trends?dateFrom=2025-01` enable bookmarkable/shareable links.

3. **Chart Library** - Chart.js for simplicity and features. Can migrate to D3 later if custom visualizations needed.

4. **Mobile Experience** - Simplified mobile view (summary cards only). Full analysis features on desktop/tablet. Rationale: charts and data tables are difficult to optimize for small screens; better to do mobile well with limited scope than poorly with full scope.

5. **Export** - Not included in Phase 2. Users can access raw data in Google Sheets if needed.

6. **Alerts/Notifications** - Deferred to future phase. Automatic anomaly detection (e.g., "Cost up 50% vs last month") is nice-to-have but not MVP.

7. **Geographic Analysis** - Included. Country criterion IDs will be mapped to country names via static lookup table.

## Acceptance Criteria

### Core Functionality

- [ ] Dashboard loads with real data in under 2 seconds
- [ ] Can view January 2024 vs January 2025 performance comparison
- [ ] Can filter by Campaign, Device, and Campaign Type
- [ ] Can select custom conversion events and see metrics update
- [ ] Can drill down to keyword detail for a specific campaign
- [ ] Metrics displayed match source data (spot-check verification)

### UI/UX

- [ ] All interactive elements have hover/focus states
- [ ] Loading states shown during data fetches
- [ ] Error messages are user-friendly
- [ ] Mobile-responsive layout works on tablet/phone

### Deployment

- [ ] Deployed as Apps Script Web App
- [ ] Accessible via stable URL
- [ ] Only authorized users can access

