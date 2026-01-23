# Phase 3: Compare Workspace Requirements

## Overview

This phase delivers a flexible comparison workspace that enables deep analysis of marketing performance across campaigns and time periods. While Phase 2's Overview answers "Is my marketing working?", the Compare Workspace answers "How do I optimize?"

The workspace allows users to compare any combination of Campaign + Time Period side-by-side, with customizable metric components that can be added or removed as needed.

## Goals

1. **Flexible Comparison** - Compare any campaigns across any time periods side-by-side
2. **Deep Analysis** - Access all metrics (KPIs, Keywords, Search Terms, Landing Pages, etc.) in one workspace
3. **Customizable View** - Add/remove metric components based on current analysis needs
4. **Persistent Configuration** - Remember component selection across sessions
5. **Fair Comparison** - Lock duration across columns so comparisons are meaningful

## User Stories

### As a keynote speaker optimizing Google Ads campaigns, I want to...

1. **Compare campaign performance year-over-year** so I can see what worked last year vs this year
2. **Compare multiple campaigns side-by-side** so I can identify winners and losers
3. **See keyword performance for each campaign/period** so I can optimize bids
4. **See search terms for each campaign/period** so I can identify negative keyword opportunities
5. **Add/remove metric sections** so I can focus on what matters for my current analysis
6. **Have my view configuration remembered** so I don't have to rebuild it each session
7. **Compare the same campaign across different time periods** so I can track improvement over time
8. **Compare different campaigns in the same time period** so I can see relative performance
9. **Scroll horizontally** when comparing 3+ campaigns so I can see all columns

## Functional Requirements

### 1. Workspace Layout

#### 1.1 Column Structure

- [ ] Each column represents a Campaign + Time Period combination
- [ ] Column header shows: Campaign name (dropdown), Date range selector
- [ ] Minimum 1 column, no maximum (horizontal scroll for 3+)
- [ ] [+] button to add new column
- [ ] [x] button to remove column (minimum 1 must remain)

#### 1.2 Duration Lock

- [ ] First column sets the duration (e.g., 3 months)
- [ ] Subsequent columns inherit this duration
- [ ] Date picker for columns 2+ only allows selecting start date; end date auto-calculated
- [ ] Visual indicator showing locked duration (e.g., "3 months" badge)
- [ ] Changing first column's duration updates all other columns

#### 1.3 Horizontal Scrolling

- [ ] When 3+ columns, container becomes horizontally scrollable
- [ ] Column headers remain sticky during vertical scroll
- [ ] Smooth scroll behavior
- [ ] Optional: scroll snap to column boundaries

### 2. Component System

#### 2.1 Available Components

Each component displays its data for ALL columns in the workspace:

| Component | Data Displayed | Source |
|-----------|---------------|--------|
| KPIs | Cost, Clicks, Sessions, Engaged Sessions, CTR, Avg CPC, etc. | Summary_Monthly |
| Funnel | Impressions → Clicks → Sessions → Engaged → Conversions | Summary_Monthly |
| Trend Sparkline | Line chart of selected metrics over time | Summary_Monthly |
| Keywords | Keyword performance table (sortable) | Summary_Keywords |
| Search Terms | Search term performance table | Raw_Ads_SearchTerms |
| Landing Pages | Landing page performance table | Raw_GA4_Pages |
| Device Breakdown | Metrics split by device | Summary_Monthly (grouped) |
| Campaign Type Breakdown | Metrics split by campaign type | Summary_Monthly (grouped) |
| Geographic Breakdown | Metrics split by country | Raw_Ads_Geographic |

#### 2.2 Component Layout

- [ ] Components stack vertically as rows
- [ ] Each row spans all columns (side-by-side comparison)
- [ ] Component header shows: Component name, [Settings] dropdown, [Remove] button
- [ ] Settings dropdown allows component-specific configuration
- [ ] Consistent column widths across all components

#### 2.3 Add Component

- [ ] [+ Add Component] button at bottom of workspace
- [ ] Clicking opens component picker (dropdown or modal)
- [ ] Component picker shows available components with descriptions
- [ ] Already-added components are disabled/hidden in picker
- [ ] New component appears at bottom of stack

#### 2.4 Remove Component

- [ ] Each component has [x] or settings menu with "Remove" option
- [ ] Confirmation not required (easy to re-add)
- [ ] KPIs cannot be removed (always present as baseline)

#### 2.5 Component Persistence

- [ ] Selected components saved to localStorage
- [ ] On workspace load, restore saved component selection
- [ ] Default if no saved config: KPIs only

### 3. Component Details

#### 3.1 KPIs Component (Default, Always Present)

- [ ] Displays key metrics for each column:
  - Cost
  - Clicks
  - Impressions
  - CTR
  - Sessions
  - Engaged Sessions
  - Engagement Rate
  - Avg CPC
  - Cost per Session
- [ ] Compact card layout within column
- [ ] Color-coded comparison hints (optional: highlight best/worst)

#### 3.2 Keywords Component

- [ ] Sortable table per column
- [ ] Columns: Keyword, Cost, Clicks, Impressions, CTR, Avg CPC
- [ ] Default sort: by Cost descending
- [ ] Pagination or virtual scroll for large datasets
- [ ] Expandable rows showing search terms (from Summary_Keywords)
- [ ] Settings: Number of rows to display (10, 25, 50, All)

#### 3.3 Search Terms Component

- [ ] Sortable table per column
- [ ] Columns: Search Term, Matched Keyword, Cost, Clicks, Impressions, CTR
- [ ] Useful for negative keyword identification
- [ ] Settings: Number of rows to display

#### 3.4 Landing Pages Component

- [ ] Sortable table per column
- [ ] Columns: Landing Page URL, Sessions, Engaged Sessions, Engagement Rate
- [ ] Helps diagnose page vs targeting issues
- [ ] Settings: Number of rows to display

#### 3.5 Device Breakdown Component

- [ ] Shows metrics split by DESKTOP, MOBILE, TABLET
- [ ] Mini bar chart or table layout
- [ ] Highlights device with best/worst performance

#### 3.6 Campaign Type Breakdown Component

- [ ] Shows metrics split by SEARCH, DISPLAY, VIDEO, PERFORMANCE_MAX
- [ ] Mini bar chart or table layout
- [ ] Only relevant when "All Campaigns" selected in column

#### 3.7 Geographic Breakdown Component

- [ ] Shows metrics by country
- [ ] Sortable table: Country, Cost, Clicks, CTR
- [ ] Top 10 countries by default
- [ ] Settings: Number of countries to display

#### 3.8 Funnel Component

- [ ] Visual funnel: Impressions → Clicks → Sessions → Engaged → Conversions
- [ ] Shows conversion rate at each stage
- [ ] Compact horizontal layout to fit in column

#### 3.9 Trend Sparkline Component

- [ ] Line chart showing trends within the selected period
- [ ] Preset selector: Cost & Clicks, Cost & Sessions, etc.
- [ ] Compact sparkline appropriate for column width

### 4. Campaign & Date Selection

#### 4.1 Campaign Selector (per column)

- [ ] Dropdown with all available campaigns
- [ ] "All Campaigns" option for aggregate view
- [ ] Search/filter for long campaign lists
- [ ] Shows campaign type indicator (Search, Display, etc.)

#### 4.2 Date Range Selector (per column)

- [ ] Month-based selection (data is monthly granularity)
- [ ] Column 1: Full date range picker (sets duration)
- [ ] Columns 2+: Start month picker only (duration locked)
- [ ] Presets: Last 3 months, Last 6 months, Last 12 months, Year to date
- [ ] Display selected range clearly (e.g., "Jan - Mar 2024")

### 5. Data Loading

#### 5.1 Loading States

- [ ] Per-component loading indicators
- [ ] Skeleton screens for components while loading
- [ ] Load KPIs first (fastest), then other components
- [ ] Cancel pending requests when column config changes

#### 5.2 Error Handling

- [ ] Per-component error states
- [ ] Retry button for failed components
- [ ] Don't block entire workspace if one component fails

### 6. Navigation Integration

#### 6.1 App Navigation

- [ ] Add "Compare" to main navigation (alongside Overview)
- [ ] Remove Campaigns, Devices, Types, Countries, Conversions nav items
- [ ] Final nav: Overview | Compare

#### 6.2 URL State (Optional Enhancement)

- [ ] Encode workspace state in URL for shareability
- [ ] Or keep URL simple (`#/compare`) and rely on localStorage

### 7. Conversion Configuration

#### 7.1 Event Selection

- [ ] Accessible via settings/gear icon in workspace header
- [ ] Display list of available events from Summary_Events
- [ ] Checkbox for each event
- [ ] Selection affects "Conversions" metric across all components
- [ ] Persists to localStorage

## Non-Functional Requirements

### Performance

| Operation | Target |
|-----------|--------|
| Workspace initial load (KPIs only) | < 2 seconds |
| Add component (Keywords) | < 3 seconds |
| Add component (Search Terms) | < 5 seconds |
| Change column campaign/date | < 2 seconds |
| Horizontal scroll | Smooth (60fps) |

### Usability

- [ ] Intuitive column add/remove
- [ ] Clear visual hierarchy (columns, component rows)
- [ ] Obvious duration lock indicator
- [ ] Responsive: works on tablet (may hide some features on phone)

### Browser Support

- [ ] Chrome (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Firefox (latest 2 versions)

## Data Sources

| Component | Primary Data Source |
|-----------|---------------------|
| KPIs | Summary_Monthly |
| Funnel | Summary_Monthly |
| Trend Sparkline | Summary_Monthly |
| Keywords | Summary_Keywords |
| Search Terms | Raw_Ads_SearchTerms |
| Landing Pages | Raw_GA4_Pages |
| Device Breakdown | Summary_Monthly (grouped by Device) |
| Type Breakdown | Summary_Monthly (grouped by CampaignType) |
| Geographic | Raw_Ads_Geographic |

## Acceptance Criteria

### Core Functionality

- [ ] Can create 2-column comparison: Campaign A (2024) vs Campaign A (2025)
- [ ] Can create 3-column comparison: Campaign A vs B vs C (same period)
- [ ] Duration lock works: changing Column 1 dates updates Column 2+ end dates
- [ ] Can add Keywords component and see keyword tables side-by-side
- [ ] Component selection persists after page refresh
- [ ] Horizontal scroll works smoothly for 4+ columns

### Data Accuracy

- [ ] KPI values match Overview (same campaign, same date range)
- [ ] Keyword data matches source sheets
- [ ] Filters (campaign, date) apply correctly to all components

### UX

- [ ] Can complete common workflow: "Compare Q1 2024 vs Q1 2025 for Campaign X with Keywords"
- [ ] No confusing UI states
- [ ] Clear loading feedback
- [ ] Works on 13" laptop screen without excessive scrolling
