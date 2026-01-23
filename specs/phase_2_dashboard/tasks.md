# Phase 2: Dashboard Frontend Tasks

## 1. Project Setup

### 1.1 File Structure
- [x] Create `index.html` with base HTML structure
- [x] Add CDN script tags (Vue 3, Vue Router, PrimeVue, Chart.js)
- [x] Add PrimeVue CSS theme link
- [x] Create basic CSS file or `<style>` section with design tokens

### 1.2 Vue Application Bootstrap
- [x] Initialize Vue app with `Vue.createApp()`
- [x] Set up Vue Router with hash mode
- [x] Register PrimeVue components globally
- [x] Create root App component with router-view
- [x] Verify basic app renders with placeholder views

## 2. Backend API Layer (Apps Script)

### 2.1 Data Fetching Functions
- [x] Create `getDashboardData()` - returns Summary_Monthly + Summary_Events for date range
- [x] Create `getCampaignList()` - returns Summary_Campaigns for filter dropdowns
- [x] Create `getKeywordDetail(campaign, dateFrom, dateTo)` - returns Raw_Ads_Keywords filtered
- [x] Create `getSearchTermDetail(campaign, dateFrom, dateTo)` - returns Raw_Ads_SearchTerms filtered
- [x] Create `getLandingPageDetail(campaign, dateFrom, dateTo)` - returns Raw_GA4_Pages filtered
- [x] Create `getGeographicData(dateFrom, dateTo)` - returns Raw_Ads_Geographic with country mapping

> **Note:** `getKeywordDetail` and `getSearchTermDetail` are slow (~30k+ rows). Consider pagination or server-side filtering in future optimization pass.

### 2.2 Web App Configuration
- [x] Update `doGet()` to serve index.html via HtmlService
- [x] Configure `HtmlService.createHtmlOutputFromFile()` with proper settings
- [x] Test basic web app deployment

## 3. State Management

### 3.1 Global State
- [x] Create reactive state object with `Vue.reactive()`
- [x] Define state shape: `{ filters, dateRange, data, loading, error }`
- [x] Implement filter state: `{ campaigns: [], devices: [], campaignTypes: [] }`
- [x] Implement date range state: `{ from: '2025-01', to: '2025-12', comparison: false }`
- [x] Implement conversion selection state (load from localStorage)

### 3.2 URL ↔ State Synchronization
- [x] Sync filters to URL query params on change
- [x] Parse URL query params on app load
- [x] Handle browser back/forward navigation
- [x] Test: change filter → URL updates → refresh → filter restored

> **Note:** State management implemented in `store.html`. Date objects from sheets must be serialized to strings for `google.script.run` to work (see `sheetToObjects` in Code.js).

## 4. Core Components

### 4.1 Layout Components
- [x] Header with logo and navigation (kept inline in index.html)
- [x] Create `AppSidebar` component (PrimeVue Drawer with filters)
- [x] DataFreshness display (inline in header)

> **Note:** AppHeader and MainContent kept inline for simplicity. Drawer-based sidebar collapses automatically on mobile.

### 4.2 Shared Components
- [x] Create `MetricCard` component (value, label, change %, trend indicator)
- [x] Create `LoadingSpinner` component
- [x] Create `ErrorMessage` component with retry button
- [x] Create `EmptyState` component with helpful message

### 4.3 Filter Components
- [x] Create `DateRangePicker` component (PrimeVue DatePicker with presets)
- [x] Create `CampaignFilter` component (PrimeVue MultiSelect)
- [x] Create `DeviceFilter` component (PrimeVue MultiSelect)
- [x] Create `CampaignTypeFilter` component (PrimeVue MultiSelect)
- [x] Create `ClearFilters` button
- [x] Create `ComparisonMode` component (dropdown: None, Previous period, Same period last year, Custom with date picker)

> **Note:** Upgraded to PrimeVue 4 with Aura theme. Comparison mode supports flexible date range comparison including custom ranges.

## 5. Dashboard Home View (Overview)

### 5.1 Primary KPIs (4 Large Cards)
- [x] Display Total Cost card (with comparison %)
- [x] Display Clicks card (with comparison %) - replaced Conversions as primary KPI
- [x] Display Avg CPC card (with comparison %) - replaced Cost per Conversion
- [x] Display Engagement Rate card (EngagedSessions / Sessions, with comparison %)
- [x] Style these 4 cards prominently as the primary metrics

> **Rationale:** These 4 metrics answer "Is my marketing working?" — Cost + Clicks = effort vs reach, Avg CPC = efficiency, Engagement Rate = funnel health. Conversions remain in the funnel but not as primary KPI per user preference.

### 5.2 Funnel Visualization
- [x] Create horizontal funnel component showing: Impressions → Clicks → Sessions → Engaged Sessions → Conversions
- [x] Display absolute number at each stage
- [x] Display conversion rate between each stage (CTR, Click→Session rate, Session→Engaged rate, Engaged→Conversion rate)
- [x] Visual width proportional to volume (funnel narrows left to right)
- [x] Color indicators vs comparison period (green arrow if improved, red if declined)
- [x] Responsive design (stacks vertically on mobile)

> **Rationale:** The funnel visualization is the core value proposition of this dashboard. It answers "WHERE in my funnel am I losing people?" — the diagnostic tool the project exists to provide.

### 5.3 Supporting Metrics (6 Smaller Cards)
- [x] Display Impressions card
- [x] Display CTR card (Clicks / Impressions)
- [x] Display Sessions card
- [x] Display Engaged Sessions card
- [x] Display Cost per Session card
- [x] Display Cost per Engaged Session card
- [x] Style these 6 cards smaller/secondary to primary KPIs

### 5.4 Trend Sparkline
- [x] Create line chart showing Cost and Clicks over selected date range
- [x] Use Chart.js for rendering
- [x] Solid lines for current period (blue = Cost, green = Clicks)
- [x] When comparison mode enabled, overlay comparison period as dashed lines (same colors)
- [x] X-axis aligned by relative position (month 1, 2, 3... so periods overlay correctly)
- [x] Tooltip on hover shows all values (current + comparison if enabled)
- [x] Legend showing: Cost (Current), Cost (Comparison), Clicks (Current), Clicks (Comparison)
- [x] Responsive sizing
- [x] When comparison mode is "none", only show solid lines (2 lines total)

> **Rationale:** Addresses the goal "Understand if campaigns are underperforming vs. external factors (seasonality, economy)". Overlaying comparison period reveals trend pattern differences - not just point-in-time comparison but whether current period follows same seasonal curve as comparison period.

### 5.5 Quick Insights (Lazy-Loaded Keywords)
- [x] Create backend function `getKeywordsSummary(dateFrom, dateTo, compareDateFrom, compareDateTo, campaignIds, limit)` that returns top keywords with current and comparison period data (independently ranked)
- [x] Pre-aggregate keywords in Summary_Keywords sheet with embedded search terms (top 15 per keyword)
- [x] Lazy-load this section AFTER main Overview renders (async, non-blocking)
- [x] Display "Top 5 Keywords by Cost" mini-table using PrimeVue DataTable with expandable rows for search terms
- [x] Display "Top 5 Keywords by Clicks" mini-table using PrimeVue DataTable with expandable rows for search terms
- [x] When comparison enabled: show 4 tables (Current Cost vs Comparison Cost, Current Clicks vs Comparison Clicks) - each period has its own independently ranked top 5
- [x] Sort tables by current period value (not comparison)
- [x] Show loading spinner while keywords load
- [x] Handle empty state if no keyword data available

> **Rationale:** Keywords are the actionable lever for Google Ads optimization. Showing independent top 5 for each period allows comparison of strategy shifts over time (different keywords may be top performers in different periods).

### 5.6 Data Loading
- [x] Call `getDashboardData()` on mount (Summary sheets - fast)
- [x] Show loading skeleton while fetching
- [x] Handle errors gracefully
- [x] Apply filters to loaded data client-side
- [x] After main data loads, trigger lazy-load of Quick Insights (Keywords)

## 6. Trend Analysis ~~View~~ (Merged into Overview)

> **Decision:** Trend analysis merged into Overview sparkline with metric presets. See ADR-027.

### 6.1 Metric Preset Selector (in Overview)
- [x] Add SelectButton component above trend sparkline
- [x] Preset options:
  - Cost & Clicks (default)
  - Cost & Sessions
  - Sessions & Engaged
  - Clicks & Impressions
- [x] Switching preset updates chart data
- [x] Comparison overlay works with all presets

### 6.2 Remove Dedicated Trends View
- [x] Remove `/trends` route from index.html
- [x] Remove "Trends" from sidebar navigation
- [x] TrendsView.html can be deleted (was placeholder only)

### 6.3 Chart Interactions (already in Overview)
- [x] Hover tooltips showing exact values
- [x] Responsive chart sizing
- [x] Legend showing current + comparison series

## ~~7-11. Analysis Views~~ (Deferred to Phase 3)

> **Decision:** Sections 7-11 (Campaign Analysis, Device Analysis, Campaign Type Analysis, Geographic Analysis, and Conversion Configuration) have been superseded by Phase 3: Compare Workspace.
>
> **Rationale:** The original design fragmented analysis across 5 separate views. Phase 3 introduces a flexible comparison workspace where users can compare any combination of Campaign + Time Period side-by-side, with addable/removable metric components. This provides a more powerful and unified analysis experience.
>
> See ADR-029 for details.

## ~~12. Drill-Down Views~~ (Deferred to Phase 3)

> **Moved:** Drill-down views (Keywords, Search Terms, Landing Pages) are now components in the Phase 3 Compare Workspace.

## 13. UI States

### 13.1 Loading States
- [ ] Global loading indicator in header
- [ ] Skeleton screens for metric cards
- [ ] Skeleton screens for tables
- [ ] Loading spinner for charts

### 13.2 Error States
- [ ] User-friendly error message display
- [ ] Retry button that re-fetches data
- [ ] Console logging for debugging

### 13.3 Empty States
- [ ] "No data for selected filters" message
- [ ] Suggest actions (adjust date range, clear filters)

### 13.4 Data Freshness
- [ ] Display "Data as of: [timestamp]" in header/footer
- [ ] Timestamp from last aggregation run

## 14. Mobile Experience

### 14.1 Responsive Layout
- [ ] Detect screen width < 768px
- [ ] Hide sidebar on mobile (or make it a drawer)
- [ ] Stack metric cards vertically

### 14.2 Simplified Mobile View
- [ ] Show summary cards only on mobile
- [ ] Show message: "For full analysis, use tablet or desktop"
- [ ] Ensure touch-friendly tap targets

## 15. Styling & Polish

### 15.1 Visual Design
- [ ] Apply color palette from design.md
- [ ] Style metric cards with shadows and borders
- [ ] Style tables with alternating row colors
- [ ] Style charts with consistent colors

### 15.2 Interactions
- [ ] Hover states on clickable elements
- [ ] Focus states for keyboard navigation
- [ ] Transition animations for state changes

### 15.3 Accessibility
- [ ] Ensure sufficient color contrast
- [ ] Add aria-labels to interactive elements
- [ ] Test keyboard navigation

## 16. Testing & Verification

### 16.1 Data Verification
- [ ] Spot-check metrics against source sheets
- [ ] Verify filters apply correctly
- [ ] Verify YoY comparison calculates correctly
- [ ] Verify conversion selection affects metrics correctly

### 16.2 Performance Verification
- [ ] Initial load < 2 seconds
- [ ] Filter changes < 0.5 seconds
- [ ] Drill-down loads < 3 seconds
- [ ] Chart renders < 1 second

### 16.3 Browser Testing
- [ ] Test in Chrome
- [ ] Test in Safari
- [ ] Test in Firefox
- [ ] Test on mobile browsers

### 16.4 User Acceptance
- [ ] Walkthrough all user stories from requirements
- [ ] Verify acceptance criteria are met

## 17. Deployment

### 17.1 Web App Setup
- [ ] Deploy as test deployment first
- [ ] Verify all functionality works
- [ ] Deploy as production web app
- [ ] Document stable URL

### 17.2 Access Control
- [ ] Configure "Execute as: Me"
- [ ] Configure "Who has access: Only myself" (or specific users)
- [ ] Verify unauthorized users cannot access

## Status Legend

- [x] Complete
- [ ] Pending
