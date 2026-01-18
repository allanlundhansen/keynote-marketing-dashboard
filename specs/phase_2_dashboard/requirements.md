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

#### 1.1 Performance Summary Cards

- [ ] Display key metrics in prominent cards:
  - Total Cost (spend)
  - Total Clicks
  - Total Impressions
  - Total Sessions (from GA4)
  - Total Engaged Sessions
  - Conversion Count (based on selected events)
- [ ] Show percentage change vs previous period (configurable: MoM or YoY)
- [ ] Color-code changes (green for improvement, red for decline)

#### 1.2 Date Range Selection

- [ ] Default view: Current month
- [ ] Quick selectors: This Month, Last Month, Last 3 Months, Last 12 Months, YTD
- [ ] Custom date range picker (by month, since data is monthly granularity)
- [ ] Comparison toggle: Compare to same period last year

#### 1.3 Filter Controls

- [ ] Filter by Campaign (multi-select)
- [ ] Filter by Campaign Type (SEARCH, DISPLAY, VIDEO, PERFORMANCE_MAX)
- [ ] Filter by Device (DESKTOP, MOBILE, TABLET)
- [ ] Filters apply to all views and metrics
- [ ] Clear all filters button

### 2. Trend Analysis View

#### 2.1 Time Series Charts

- [ ] Monthly trend chart for selected metrics
- [ ] Ability to overlay multiple metrics (e.g., Cost and Sessions)
- [ ] Visual comparison line for same period previous year (when enabled)

#### 2.2 Metrics Available for Trending

- [ ] Cost, Clicks, Impressions, CTR, Avg CPC
- [ ] Sessions, Engaged Sessions, Bounce Rate
- [ ] Conversions (based on selected events)
- [ ] Calculated: Cost per Session, Cost per Engaged Session, Cost per Conversion

### 3. Campaign Analysis View

#### 3.1 Campaign Performance Table

- [ ] Sortable table with all campaigns
- [ ] Columns: Campaign Name, Type, Cost, Clicks, Impressions, CTR, Sessions, Engaged Sessions, Conversions
- [ ] Sparkline showing trend for each campaign
- [ ] Click to drill down to campaign detail

#### 3.2 Campaign Comparison

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

### 8. Drill-Down Views

#### 8.1 Keyword Detail (from Raw_Ads_Keywords)

- [ ] Accessible from campaign drill-down
- [ ] Shows keyword-level performance for selected campaign/date range
- [ ] Columns: Keyword, Match Type, Cost, Clicks, Impressions, CTR, Avg CPC, Quality Score
- [ ] Sortable by any column
- [ ] Acceptable load time: 2-3 seconds

#### 8.2 Search Term Detail (from Raw_Ads_SearchTerms)

- [ ] Shows actual user queries for selected campaign/date range
- [ ] Columns: Search Term, Matched Keyword, Cost, Clicks, Impressions, CTR
- [ ] Useful for negative keyword identification
- [ ] Acceptable load time: 2-3 seconds

#### 8.3 Landing Page Detail (from Raw_GA4_Pages)

- [ ] Shows landing page performance for selected campaign/date range
- [ ] Columns: Landing Page URL, Sessions, Engaged Sessions, Bounce Rate
- [ ] Helps diagnose "page problem" vs "targeting problem"
- [ ] Acceptable load time: 2-3 seconds

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

