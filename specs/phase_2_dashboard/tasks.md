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
- [ ] Create reactive state object with `Vue.reactive()`
- [ ] Define state shape: `{ filters, dateRange, data, loading, error }`
- [ ] Implement filter state: `{ campaigns: [], devices: [], campaignTypes: [] }`
- [ ] Implement date range state: `{ from: '2025-01', to: '2025-12', comparison: false }`
- [ ] Implement conversion selection state (load from localStorage)

### 3.2 URL ↔ State Synchronization
- [ ] Sync filters to URL query params on change
- [ ] Parse URL query params on app load
- [ ] Handle browser back/forward navigation
- [ ] Test: change filter → URL updates → refresh → filter restored

## 4. Core Components

### 4.1 Layout Components
- [ ] Create `AppHeader` component (logo, navigation tabs)
- [ ] Create `AppSidebar` component (filters panel)
- [ ] Create `MainContent` wrapper component
- [ ] Create responsive layout (sidebar collapses on mobile)

### 4.2 Shared Components
- [ ] Create `MetricCard` component (value, label, change %, trend indicator)
- [ ] Create `LoadingSpinner` component
- [ ] Create `ErrorMessage` component with retry button
- [ ] Create `EmptyState` component with helpful message
- [ ] Create `DataFreshness` component (shows "Data as of: X")

### 4.3 Filter Components
- [ ] Create `DateRangePicker` component (month selector with presets)
- [ ] Create `CampaignFilter` component (multiselect dropdown)
- [ ] Create `DeviceFilter` component (multiselect: DESKTOP, MOBILE, TABLET)
- [ ] Create `CampaignTypeFilter` component (multiselect: SEARCH, DISPLAY, etc.)
- [ ] Create `ClearFilters` button
- [ ] Create `ComparisonToggle` component (YoY comparison on/off)

## 5. Dashboard Home View

### 5.1 Summary Cards Row
- [ ] Display Total Cost card
- [ ] Display Total Clicks card
- [ ] Display Total Impressions card
- [ ] Display Total Sessions card
- [ ] Display Total Engaged Sessions card
- [ ] Display Conversion Count card (based on selected events)
- [ ] Calculate and show % change vs previous period
- [ ] Color-code changes (green = improvement, red = decline)

### 5.2 Quick Stats
- [ ] Calculate and display CTR (Clicks / Impressions)
- [ ] Calculate and display Avg CPC (Cost / Clicks)
- [ ] Calculate and display Cost per Session
- [ ] Calculate and display Cost per Conversion

### 5.3 Data Loading
- [ ] Call `getDashboardData()` on mount
- [ ] Show loading skeleton while fetching
- [ ] Handle errors gracefully
- [ ] Apply filters to loaded data client-side

## 6. Trend Analysis View

### 6.1 Time Series Chart
- [ ] Create line chart component using Chart.js
- [ ] Display monthly data points for selected date range
- [ ] Support metric selection (Cost, Clicks, Sessions, Conversions, etc.)
- [ ] Allow overlaying 2 metrics on same chart (dual Y-axis)
- [ ] Add comparison line for same period previous year (when enabled)

### 6.2 Metric Selector
- [ ] Create metric dropdown for primary metric
- [ ] Create metric dropdown for secondary metric (optional)
- [ ] Available metrics: Cost, Clicks, Impressions, CTR, Avg CPC, Sessions, Engaged Sessions, Conversions, Cost/Session, Cost/Conversion

### 6.3 Chart Interactions
- [ ] Hover tooltips showing exact values
- [ ] Responsive chart sizing
- [ ] Legend toggle to show/hide series

## 7. Campaign Analysis View

### 7.1 Campaign Table
- [ ] Create sortable DataTable with PrimeVue
- [ ] Columns: Campaign Name, Type, Cost, Clicks, Impressions, CTR, Sessions, Engaged Sessions, Conversions
- [ ] Enable sorting by any column
- [ ] Add pagination (20 rows per page)
- [ ] Add sparkline for each campaign (mini trend chart)

### 7.2 Campaign Comparison
- [ ] Allow selecting 2-3 campaigns for side-by-side comparison
- [ ] Show percentage of total for each metric
- [ ] Visual bar comparison

### 7.3 Campaign Drill-Down
- [ ] Click campaign row to navigate to detail view
- [ ] Campaign detail view shows keywords and search terms tabs

## 8. Device Analysis View

### 8.1 Device Breakdown
- [ ] Create pie/donut chart showing distribution by device
- [ ] Create bar chart comparing metrics across devices
- [ ] Create table with device-level metrics

### 8.2 Device Insights
- [ ] Highlight device with best conversion rate
- [ ] Highlight device with worst cost efficiency
- [ ] Show % of spend vs % of conversions per device

## 9. Campaign Type Analysis View

### 9.1 Campaign Type Breakdown
- [ ] Create pie/donut chart showing distribution by campaign type
- [ ] Create bar chart comparing metrics across types (SEARCH, DISPLAY, etc.)
- [ ] Create table with campaign-type-level metrics

### 9.2 Type Comparison
- [ ] Compare cost efficiency (Cost per Conversion) across types
- [ ] Show volume vs efficiency trade-off

## 10. Geographic Analysis View

### 10.1 Country Table
- [ ] Create sortable table with country data
- [ ] Columns: Country, Cost, Clicks, Impressions, CTR, Conversions
- [ ] Map criterion IDs to country names via lookup table
- [ ] Handle unknown criterion IDs gracefully

### 10.2 Geographic Insights
- [ ] Sort by cost to show top spending countries
- [ ] Calculate cost efficiency per country
- [ ] Highlight top performers

## 11. Conversion Configuration

### 11.1 Event Selection UI
- [ ] Display list of available events from Summary_Events
- [ ] Checkbox/toggle for each event
- [ ] Show event count next to each event name
- [ ] "Select All" / "Clear All" buttons

### 11.2 Persistence
- [ ] Save selection to localStorage on change
- [ ] Load selection from localStorage on app init
- [ ] Apply selection to all conversion calculations

### 11.3 Metric Recalculation
- [ ] Recalculate "Conversion Count" when selection changes
- [ ] Recalculate "Cost per Conversion" when selection changes
- [ ] Update all views that display conversion metrics

## 12. Drill-Down Views

### 12.1 Keyword Detail View
- [ ] Route: `#/keywords?campaign=X&dateFrom=Y&dateTo=Z`
- [ ] Call `getKeywordDetail()` backend function
- [ ] Display sortable table with keyword data
- [ ] Columns: Keyword, Match Type, Cost, Clicks, Impressions, CTR, Avg CPC, Quality Score
- [ ] Show loading state during fetch
- [ ] Back button to return to campaign view

### 12.2 Search Term Detail View
- [ ] Route: `#/search-terms?campaign=X&dateFrom=Y&dateTo=Z`
- [ ] Call `getSearchTermDetail()` backend function
- [ ] Display sortable table with search term data
- [ ] Columns: Search Term, Matched Keyword, Cost, Clicks, Impressions, CTR
- [ ] Useful for negative keyword identification
- [ ] Back button to return to campaign view

### 12.3 Landing Page Detail View
- [ ] Route: `#/landing-pages?campaign=X&dateFrom=Y&dateTo=Z`
- [ ] Call `getLandingPageDetail()` backend function
- [ ] Display sortable table with landing page data
- [ ] Columns: Landing Page URL, Sessions, Engaged Sessions, Bounce Rate
- [ ] Back button to return to campaign view

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
