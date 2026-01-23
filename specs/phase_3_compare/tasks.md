# Phase 3: Compare Workspace Tasks

## 1. Project Setup

### 1.1 Navigation & Routing
- [ ] Add `/compare` route to index.html
- [ ] Create placeholder CompareView.html
- [ ] Update navigation: remove Campaigns, Devices, Types, Countries, Conversions
- [ ] Update navigation: keep Overview, add Compare
- [ ] Verify routing works: Overview ↔ Compare

### 1.2 State Management Setup
- [ ] Create compareStore.html with workspace state structure
- [ ] Implement columns array state
- [ ] Implement components array state
- [ ] Implement duration derived state
- [ ] Implement loading/error states per component per column
- [ ] Implement data cache per component per column

### 1.3 Persistence Layer
- [ ] Implement saveWorkspaceConfig() to localStorage
- [ ] Implement loadWorkspaceConfig() from localStorage
- [ ] Auto-save on config changes (debounced)
- [ ] Load config on Compare view mount
- [ ] Test: change config → refresh → config restored

## 2. Backend API Extensions

### 2.1 Component Data Endpoints
- [ ] Create `getComponentData(type, campaignId, dateFrom, dateTo)` dispatcher
- [ ] Implement `getKPIsData()` - aggregate Summary_Monthly
- [ ] Implement `getKeywordsData()` - from Summary_Keywords with limit
- [ ] Implement `getSearchTermsData()` - from Raw_Ads_SearchTerms with limit
- [ ] Implement `getLandingPagesData()` - from Raw_GA4_Pages
- [ ] Implement `getDeviceBreakdownData()` - Summary_Monthly grouped by Device
- [ ] Implement `getTypeBreakdownData()` - Summary_Monthly grouped by CampaignType
- [ ] Implement `getGeographicData()` - Raw_Ads_Geographic with country mapping
- [ ] Implement `getFunnelData()` - aggregated funnel metrics
- [ ] Implement `getSparklineData()` - monthly trend data

### 2.2 Campaign List Enhancement
- [ ] Ensure getCampaignList() returns campaign IDs for selector
- [ ] Add "All Campaigns" option handling in data functions

## 3. Workspace Layout

### 3.1 CompareView Structure
- [ ] Create CompareView.html with main layout
- [ ] Add workspace header (duration indicator, settings button)
- [ ] Add column container (horizontal scroll wrapper)
- [ ] Add component stack container
- [ ] Add "Add Component" button area

### 3.2 CSS Layout
- [ ] Implement horizontal scroll container
- [ ] Set fixed column widths (350px)
- [ ] Implement scroll snap behavior
- [ ] Implement sticky column headers
- [ ] Implement responsive behavior (tablet/desktop)

## 4. Column System

### 4.1 CompareColumn Component
- [ ] Create CompareColumn.html component
- [ ] Column header with campaign selector
- [ ] Column header with date range selector
- [ ] Remove column button (hidden if only 1 column)
- [ ] Visual styling (card appearance)

### 4.2 Add Column Button
- [ ] Create AddColumnButton.html component
- [ ] Click adds new column with default values
- [ ] New column inherits duration from column 1
- [ ] Position at end of column row

### 4.3 Campaign Selector
- [ ] PrimeVue Select component
- [ ] Options: "All Campaigns" + individual campaigns
- [ ] On change: clear column data, refetch
- [ ] Show campaign type indicator (optional)

### 4.4 Date Range Selector
- [ ] Column 1: Full date range picker (from + to)
- [ ] Columns 2+: Start month only (end auto-calculated)
- [ ] Month picker mode (not daily)
- [ ] Display selected range clearly
- [ ] Presets dropdown: Last 3/6/12 months, YTD

### 4.5 Duration Lock Logic
- [ ] Calculate duration from column 1 date range
- [ ] Display duration badge (e.g., "3 months 🔒")
- [ ] When column 1 changes: recalculate all column end dates
- [ ] Prevent column 2+ from changing duration

## 5. Component System

### 5.1 ComponentWrapper
- [ ] Create ComponentWrapper.html
- [ ] Component header with title
- [ ] Settings dropdown button
- [ ] Remove button (except for KPIs)
- [ ] Slot for component content

### 5.2 Add Component Button
- [ ] Create AddComponentButton.html
- [ ] Click opens component picker
- [ ] Component picker shows available components
- [ ] Disable already-added components
- [ ] On select: add component, fetch data

### 5.3 Component Registration
- [ ] Define component type registry
- [ ] Map type → component, label, icon
- [ ] Map type → data fetcher
- [ ] Map type → default settings

## 6. Metric Components

### 6.1 KPIs Component (Default)
- [ ] Create KPIsComponent.html
- [ ] Display metrics: Cost, Clicks, Impressions, CTR, Sessions, Engaged Sessions, Engagement Rate, Avg CPC, Cost per Session
- [ ] Compact card layout per column
- [ ] Format numbers appropriately (currency, percent, number)
- [ ] Cannot be removed (always present)

### 6.2 Keywords Component
- [ ] Create KeywordsComponent.html
- [ ] PrimeVue DataTable per column
- [ ] Columns: Keyword, Cost, Clicks, Impressions, CTR, Avg CPC
- [ ] Sortable columns
- [ ] Expandable rows for search terms
- [ ] Settings: rows per page (10, 25, 50)
- [ ] Loading state per column
- [ ] Error state with retry

### 6.3 Search Terms Component
- [ ] Create SearchTermsComponent.html
- [ ] PrimeVue DataTable per column
- [ ] Columns: Search Term, Matched Keyword, Cost, Clicks, Impressions, CTR
- [ ] Sortable columns
- [ ] Settings: rows per page
- [ ] Loading/error states

### 6.4 Landing Pages Component
- [ ] Create LandingPagesComponent.html
- [ ] PrimeVue DataTable per column
- [ ] Columns: Landing Page URL, Sessions, Engaged Sessions, Engagement Rate
- [ ] Truncate long URLs with tooltip
- [ ] Sortable columns
- [ ] Loading/error states

### 6.5 Device Breakdown Component
- [ ] Create DeviceBreakdownComponent.html
- [ ] Show DESKTOP, MOBILE, TABLET breakdown
- [ ] Mini bar chart or table layout
- [ ] Key metrics: Cost, Clicks, Sessions, CTR
- [ ] Highlight best/worst performer

### 6.6 Campaign Type Breakdown Component
- [ ] Create TypeBreakdownComponent.html
- [ ] Show SEARCH, DISPLAY, VIDEO, PERFORMANCE_MAX breakdown
- [ ] Mini bar chart or table layout
- [ ] Only meaningful when "All Campaigns" selected
- [ ] Show message if single campaign selected

### 6.7 Geographic Breakdown Component
- [ ] Create GeographicComponent.html
- [ ] Top N countries table (default 10)
- [ ] Columns: Country, Cost, Clicks, CTR
- [ ] Sortable
- [ ] Settings: number of countries to show

### 6.8 Funnel Component
- [ ] Create FunnelComponent.html
- [ ] Visual funnel: Impressions → Clicks → Sessions → Engaged → Conversions
- [ ] Show conversion rates between stages
- [ ] Compact horizontal layout per column

### 6.9 Sparkline Component
- [ ] Create SparklineComponent.html
- [ ] Line chart showing trends within period
- [ ] Preset selector: Cost & Clicks, Cost & Sessions, etc.
- [ ] Compact size appropriate for column width
- [ ] Chart.js rendering

## 7. Data Loading

### 7.1 Fetch Logic
- [ ] Implement fetchComponentData(type, columnId)
- [ ] Set loading state before fetch
- [ ] Handle success: store data, clear loading
- [ ] Handle error: store error, clear loading
- [ ] Implement retry mechanism

### 7.2 Batch Fetching
- [ ] On initial load: fetch KPIs for all columns in parallel
- [ ] On add component: fetch data for all columns in parallel
- [ ] On column add: fetch all active components for new column
- [ ] On column change: refetch all components for that column

### 7.3 Request Management
- [ ] Debounce rapid config changes (300ms)
- [ ] Cancel pending requests on config change (if possible)
- [ ] Show stale data while refreshing (optional)

## 8. Conversion Configuration

### 8.1 Settings Modal
- [ ] Create ConversionConfigModal.html
- [ ] Open via settings button in workspace header
- [ ] List all events from Summary_Events
- [ ] Checkbox for each event
- [ ] Save/Cancel buttons

### 8.2 Event Selection
- [ ] Load available events on modal open
- [ ] Pre-select currently selected events
- [ ] On save: update state, persist to localStorage
- [ ] Trigger recalculation of conversion-related metrics

### 8.3 Conversion Metrics Update
- [ ] When selection changes, refetch components that use conversions
- [ ] Affected: KPIs (if showing conversions), Funnel

## 9. UI Polish

### 9.1 Loading States
- [ ] Skeleton screens for components while loading
- [ ] Spinner overlay for individual component cells
- [ ] Disable interactions while loading

### 9.2 Error States
- [ ] Error message display per component cell
- [ ] Retry button per failed component
- [ ] Don't block workspace if one component fails

### 9.3 Empty States
- [ ] Handle no data for campaign/date range
- [ ] Helpful message suggesting adjustments

### 9.4 Visual Polish
- [ ] Consistent spacing and alignment
- [ ] Hover states on interactive elements
- [ ] Focus states for keyboard navigation
- [ ] Smooth transitions for add/remove

## 10. Testing & Verification

### 10.1 Functionality Tests
- [ ] Create 2 columns, compare same campaign different years
- [ ] Create 3 columns, compare different campaigns same period
- [ ] Add/remove components
- [ ] Verify duration lock works
- [ ] Verify persistence works (refresh restores config)

### 10.2 Data Accuracy
- [ ] KPIs match Overview for same campaign/date
- [ ] Keywords match source Summary_Keywords
- [ ] Device breakdown sums to total

### 10.3 Performance Tests
- [ ] Initial load < 2 seconds (KPIs only)
- [ ] Add Keywords component < 3 seconds
- [ ] Horizontal scroll smooth at 60fps

### 10.4 Browser Testing
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Tablet (iPad)

## 11. Deployment

### 11.1 Integration
- [ ] Merge Compare view into main app
- [ ] Update clasp push workflow
- [ ] Test in Apps Script web app

### 11.2 Final Verification
- [ ] End-to-end workflow test
- [ ] Verify no console errors
- [ ] Verify mobile behavior (simplified view)

## Status Legend

- [x] Complete
- [ ] Pending
