# Phase 2: Dashboard Frontend Design

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vue 3 (via CDN) | Reactive component architecture |
| Router | Vue Router 4 (hash mode) | Browser history, deep linking |
| Components | PrimeVue (via CDN) | Tables, dropdowns, charts, UI primitives |
| Charts | Chart.js (via PrimeVue Chart) | Data visualization |
| Styling | PrimeVue themes + custom CSS | Consistent look and feel |
| Backend | Google Apps Script | Data API, hosting |

**CDN Dependencies:**
```html
<!-- Vue 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

<!-- Vue Router -->
<script src="https://unpkg.com/vue-router@4/dist/vue-router.global.prod.js"></script>

<!-- PrimeVue -->
<link rel="stylesheet" href="https://unpkg.com/primevue/resources/themes/lara-light-indigo/theme.css">
<link rel="stylesheet" href="https://unpkg.com/primevue/resources/primevue.min.css">
<link rel="stylesheet" href="https://unpkg.com/primeicons/primeicons.css">
<script src="https://unpkg.com/primevue/core/core.min.js"></script>
<script src="https://unpkg.com/primevue/datatable/datatable.min.js"></script>
<script src="https://unpkg.com/primevue/column/column.min.js"></script>
<script src="https://unpkg.com/primevue/dropdown/dropdown.min.js"></script>
<script src="https://unpkg.com/primevue/multiselect/multiselect.min.js"></script>
<script src="https://unpkg.com/primevue/chart/chart.min.js"></script>
<!-- Add more as needed -->

<!-- Chart.js (required by PrimeVue Chart) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## Architecture Overview

The dashboard is a Vue 3 single-page application (SPA) served by Google Apps Script's HtmlService. It uses Vue Router with hash mode for navigation and PrimeVue for UI components. Data is read from pre-aggregated summary sheets for fast performance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Dashboard SPA                                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │    │
│  │  │  Filters │  │  Charts  │  │  Tables  │  │  State Manager   │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │    │
│  │                              │                                      │    │
│  │                              ▼                                      │    │
│  │                    google.script.run                                │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE APPS SCRIPT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │     Code.js         │                                                    │
│  │  ├─ doGet()         │ ← Serves index.html                               │
│  │  ├─ getDashboardData() │ ← Returns summary data                         │
│  │  ├─ getKeywordData()   │ ← Returns drill-down data                      │
│  │  └─ getSearchTermData()│                                                │
│  └─────────────────────┘                                                    │
│              │                                                              │
│              ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        GOOGLE SHEETS                                │    │
│  │  Summary_Monthly │ Summary_Events │ Summary_Campaigns │ Raw_*       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Routing

### Route Configuration

```javascript
const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: OverviewView, name: 'overview' },
  { path: '/trends', component: TrendsView, name: 'trends' },
  { path: '/campaigns', component: CampaignsView, name: 'campaigns' },
  { path: '/campaigns/:id', component: CampaignDetailView, name: 'campaign-detail' },
  { path: '/devices', component: DevicesView, name: 'devices' },
  { path: '/types', component: TypesView, name: 'types' },
  { path: '/countries', component: CountriesView, name: 'countries' },
  { path: '/conversions', component: ConversionsView, name: 'conversions' },
  { path: '/keywords', component: KeywordsView, name: 'keywords' },
  { path: '/search-terms', component: SearchTermsView, name: 'search-terms' },
  { path: '/landing-pages', component: LandingPagesView, name: 'landing-pages' }
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});
```

### URL Examples

| URL | View | Description |
|-----|------|-------------|
| `#/overview` | Overview | Dashboard home with summary cards |
| `#/trends` | Trends | Time series charts |
| `#/campaigns` | Campaigns | Campaign list table |
| `#/campaigns/123` | Campaign Detail | Single campaign with drill-down |
| `#/devices` | Devices | Device breakdown |
| `#/countries` | Countries | Geographic analysis |
| `#/conversions` | Conversions | Event selection and conversion metrics |
| `#/keywords?campaign=123` | Keywords | Keyword drill-down filtered by campaign |

### Query Parameters for Filters

Filters can be persisted in URL for bookmarking/sharing:

```
#/trends?dateFrom=2025-01&dateTo=2026-01&campaigns=123,456&devices=DESKTOP,MOBILE
```

## Page Layout

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                    Data as of: ...  │
│  Marketing Dashboard                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ NAVIGATION TABS                                                             │
│ [Overview] [Trends] [Campaigns] [Devices] [Types] [Countries] [Conversions] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [⚙ Filters]  ← Opens sidebar drawer with filters & date range             │
│                                                                             │
│                          MAIN CONTENT AREA                                  │
│                                                                             │
│   (Changes based on selected tab - see Overview Layout below)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Overview Layout (Dashboard Home)

The Overview is structured in 5 sections, ordered by importance:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION 1: PRIMARY KPIs (4 large cards - "Is my marketing working?")        │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │  TOTAL COST   │  │  CONVERSIONS  │  │ COST/CONVERS. │  │ ENGAGE RATE   │ │
│  │   $45,230     │  │      127      │  │    $356.14    │  │    68.2%      │ │
│  │    ▲ +12%     │  │    ▲ +23%     │  │    ▼ -8%      │  │    ▲ +5%      │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 2: FUNNEL VISUALIZATION ("Where am I losing people?")               │
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │Impressions│──▶│  Clicks  │──▶│ Sessions │──▶│ Engaged  │──▶│Converts │ │
│  │  150,000  │    │   7,500  │    │   7,200  │    │   4,800  │    │   127   │ │
│  │           │    │   5.0%   │    │  96.0%   │    │  66.7%   │    │  2.6%   │ │
│  │           │    │   ▲ +0.3 │    │   ▼ -2   │    │   ▲ +4   │    │  ▲ +0.5 │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 3: SUPPORTING METRICS (6 smaller cards - context)                   │
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Impress. │ │ Clicks  │ │   CTR   │ │Sessions │ │Avg CPC  │ │Cost/Sess│   │
│  │ 150,000 │ │  7,500  │ │  5.0%   │ │  7,200  │ │  $6.03  │ │  $6.28  │   │
│  │  +15%   │ │  +18%   │ │  +0.3%  │ │  +12%   │ │  -5%    │ │  +3%    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 4: TREND SPARKLINE                                                  │
│                                                                             │
│  Cost & Conversions Over Time                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │     $                                                    Conversions │   │
│  │  5k ┤  ╭──╮                                                    │ 20  │   │
│  │  4k ┤ ╭╯  ╰╮    ╭─╮                                           │ 15  │   │
│  │  3k ┤╭╯    ╰────╯ ╰╮  ╭──────╮                                │ 10  │   │
│  │  2k ┼╯             ╰──╯      ╰─╮                               │  5  │   │
│  │  1k ┤                          ╰─────                          │  0  │   │
│  │     └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──┘     │   │
│  │         Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  [─ Cost]  [─ Conversions]                                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 5: QUICK INSIGHTS (lazy-loaded after main content)                  │
│                                                                             │
│  Top Keywords by Cost              │  Top Keywords by Conversions           │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │ Keyword          Cost    Conv.  │ Keyword          Conv.   Cost   CTR │  │
│  │ keynote speaker  $8,230    23   │ motivational spk   31   $4,120  6.2%│  │
│  │ motivational spk $4,120    31   │ keynote speaker    23   $8,230  4.8%│  │
│  │ conference spkr  $3,890    18   │ leadership talk    19   $2,340  5.9%│  │
│  │ corporate events $2,560    12   │ conference spkr    18   $3,890  5.1%│  │
│  │ leadership talk  $2,340    19   │ corporate events   12   $2,560  4.3%│  │
│  └─────────────────────────────────┴─────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Design Rationale:**

1. **Primary KPIs (Section 1):** Answer "Is my marketing working?" with 4 metrics:
   - Total Cost = what we're spending
   - Conversions = what we're getting (business outcome)
   - Cost/Conversion = efficiency (the key ROI metric)
   - Engagement Rate = funnel health indicator

2. **Funnel Visualization (Section 2):** The core value proposition. Shows WHERE in the funnel users are dropping off:
   - Low CTR = ad creative/targeting problem
   - Low Click→Session = landing page load or ad/page mismatch
   - Low Session→Engaged = landing page content problem
   - Low Engaged→Conversion = CTA/offer problem

3. **Supporting Metrics (Section 3):** Context metrics that don't answer the core question but provide useful detail.

4. **Trend Sparkline (Section 4):** Addresses seasonality concerns. Shows Cost + Conversions trend.

5. **Quick Insights (Section 5):** Lazy-loaded to preserve <2s initial load. Surfaces actionable keyword data on the main page.

**Loading Strategy:**
- Sections 1-4 load immediately from Summary sheets (<2s)
- Section 5 loads asynchronously after main render (Keywords from Raw sheet)

### Mobile Layout (<768px)

```
┌─────────────────────────┐
│  Marketing Dashboard    │
│  Data as of: Jan 15     │
├─────────────────────────┤
│ [Date Range ▼]          │
├─────────────────────────┤
│  ┌───────┐  ┌───────┐   │
│  │ Cost  │  │Clicks │   │
│  │$12,345│  │ 1,234 │   │
│  │ +12%  │  │  -5%  │   │
│  └───────┘  └───────┘   │
│  ┌───────┐  ┌───────┐   │
│  │Session│  │Conver.│   │
│  │  890  │  │  45   │   │
│  │  +8%  │  │ +20%  │   │
│  └───────┘  └───────┘   │
├─────────────────────────┤
│ Summary cards only on   │
│ mobile. Full analysis   │
│ on desktop.             │
│                         │
│ [Open on Desktop →]     │
└─────────────────────────┘
```

## Component Structure

### Vue Component Tree

```
App (root)
├── AppHeader
│   ├── Logo/Title
│   ├── DateRangePicker (PrimeVue Calendar)
│   ├── CompareToggle (PrimeVue ToggleButton)
│   └── DataFreshness
│
├── FilterBar
│   ├── CampaignFilter (PrimeVue MultiSelect)
│   ├── TypeFilter (PrimeVue MultiSelect)
│   ├── DeviceFilter (PrimeVue MultiSelect)
│   └── ClearButton (PrimeVue Button)
│
├── MetricCards
│   └── MetricCard (×6: Cost, Clicks, Sessions, Engaged, Conversions, CPC)
│       ├── Label
│       ├── Value
│       └── ChangeIndicator (+/-%)
│
├── NavTabs (PrimeVue TabMenu or router-link)
│
└── <router-view> (renders current route's component)
    ├── OverviewView
    ├── TrendsView
    │   ├── MetricSelector (PrimeVue Dropdown)
    │   └── TrendChart (PrimeVue Chart)
    ├── CampaignsView
    │   └── CampaignTable (PrimeVue DataTable)
    ├── CampaignDetailView
    │   ├── CampaignSummary
    │   └── DrillDownTabs (Keywords, SearchTerms, LandingPages)
    ├── DevicesView
    │   ├── DeviceChart (PrimeVue Chart - doughnut)
    │   └── DeviceTable (PrimeVue DataTable)
    ├── TypesView
    │   ├── TypeChart
    │   └── TypeTable
    ├── CountriesView
    │   └── CountryTable (PrimeVue DataTable)
    ├── ConversionsView
    │   ├── EventSelector (PrimeVue MultiSelect)
    │   └── ConversionMetrics
    ├── KeywordsView (drill-down)
    │   └── KeywordTable (PrimeVue DataTable)
    ├── SearchTermsView (drill-down)
    │   └── SearchTermTable
    └── LandingPagesView (drill-down)
        └── LandingPageTable
```

### File Structure

```
src/
├── Code.js                 # Server: doGet(), API functions
├── DashboardService.js     # Server: data fetching logic
├── CountryCodes.js         # Server: criterion ID lookup
│
└── index.html              # Single HTML file containing:
    │
    ├── <head>
    │   ├── CDN links (Vue, Vue Router, PrimeVue, Chart.js)
    │   └── <style> (custom CSS)
    │
    ├── <body>
    │   └── <div id="app">
    │       └── Vue app mounts here
    │
    └── <script>
        ├── Vue component definitions
        ├── Router setup
        ├── Pinia/reactive store (DashboardState)
        ├── Server communication (google.script.run wrappers)
        └── App initialization
```

Note: All Vue components are defined inline in the `<script>` section since Apps Script doesn't support .vue single-file components without a build step.

## Data Flow

### Initial Load Sequence

```
1. User navigates to Web App URL
         │
         ▼
2. doGet() serves index.html
         │
         ▼
3. Page renders with loading state
         │
         ▼
4. Client calls google.script.run.getDashboardData()
         │
         ▼
5. Server reads Summary_Monthly, Summary_Events, Summary_Campaigns
         │
         ▼
6. Server returns JSON object with all summary data
         │
         ▼
7. Client stores data in memory (DashboardState)
         │
         ▼
8. Client renders UI with data
         │
         ▼
9. User interactions filter/aggregate in-memory (no server calls)
```

### Drill-Down Sequence

```
1. User clicks "View Keywords" for Campaign X
         │
         ▼
2. Show loading state in modal/panel
         │
         ▼
3. Client calls google.script.run.getDrillDownData('keywords', campaignId, dateRange)
         │
         ▼
4. Server reads Raw_Ads_Keywords, filters by campaign and date
         │
         ▼
5. Server returns filtered data
         │
         ▼
6. Client renders drill-down table
```

## State Management

Using Vue 3's Composition API with `reactive()` for global state management. This is simpler than Pinia for a single-page app loaded via CDN.

### Global Store (Reactive)

```javascript
// Global reactive store
const store = Vue.reactive({
  // Raw data from server (immutable after load)
  data: {
    monthly: [],        // Summary_Monthly rows
    events: [],         // Summary_Events rows
    campaigns: [],      // Summary_Campaigns rows
    geographic: [],     // Geographic data with country names resolved
    lastUpdated: null   // Timestamp
  },

  // User selections (mutable, synced with URL)
  filters: {
    dateRange: { start: '2025-01', end: '2026-01' },
    campaigns: [],      // Selected campaign IDs (empty = all)
    types: [],          // Selected campaign types (empty = all)
    devices: []         // Selected devices (empty = all)
  },

  // Conversion configuration (persisted to localStorage)
  conversions: {
    selectedEvents: ['form_submit', 'keynote_form_submission'],
    availableEvents: []  // Populated from Summary_Events
  },

  // UI state
  ui: {
    isLoading: false,
    error: null,
    compareMode: false  // Compare to same period last year
  }
});

// Provide store to all components
app.provide('store', store);
```

### Computed Properties for Filtered Data

```javascript
// In a composable or component setup()
const filteredMonthly = Vue.computed(() => {
  return store.data.monthly.filter(row => {
    // Date range filter
    if (row.YearMonth < store.filters.dateRange.start) return false;
    if (row.YearMonth > store.filters.dateRange.end) return false;

    // Campaign filter (if any selected)
    if (store.filters.campaigns.length > 0) {
      if (!store.filters.campaigns.includes(row.CampaignId)) return false;
    }

    // Type filter
    if (store.filters.types.length > 0) {
      if (!store.filters.types.includes(row.CampaignType)) return false;
    }

    // Device filter
    if (store.filters.devices.length > 0) {
      if (!store.filters.devices.includes(row.Device)) return false;
    }

    return true;
  });
});

// Aggregated metrics from filtered data
const totals = Vue.computed(() => {
  const data = filteredMonthly.value;
  return {
    cost: data.reduce((sum, r) => sum + r.Cost, 0),
    clicks: data.reduce((sum, r) => sum + r.Clicks, 0),
    impressions: data.reduce((sum, r) => sum + r.Impressions, 0),
    sessions: data.reduce((sum, r) => sum + r.Sessions, 0),
    engagedSessions: data.reduce((sum, r) => sum + r.EngagedSessions, 0)
  };
});
```

### URL ↔ State Synchronization

Filters sync bidirectionally with URL query parameters:

```javascript
// Watch route changes → update store
router.afterEach((to) => {
  if (to.query.campaigns) {
    store.filters.campaigns = to.query.campaigns.split(',');
  }
  if (to.query.devices) {
    store.filters.devices = to.query.devices.split(',');
  }
  // etc.
});

// Watch store changes → update URL
Vue.watch(
  () => store.filters,
  (newFilters) => {
    const query = {};
    if (newFilters.campaigns.length) query.campaigns = newFilters.campaigns.join(',');
    if (newFilters.devices.length) query.devices = newFilters.devices.join(',');
    router.replace({ query });
  },
  { deep: true }
);
```

### LocalStorage for Conversion Settings

```javascript
// Load saved conversion events on startup
const savedEvents = localStorage.getItem('conversionEvents');
if (savedEvents) {
  store.conversions.selectedEvents = JSON.parse(savedEvents);
}

// Save when changed
Vue.watch(
  () => store.conversions.selectedEvents,
  (events) => {
    localStorage.setItem('conversionEvents', JSON.stringify(events));
  }
);
```

## Server API Design

### getDashboardData()

Returns all summary data needed for the dashboard.

**Returns:**
```javascript
{
  monthly: [
    { YearMonth, CampaignId, CampaignName, CampaignType, Device,
      Cost, Clicks, Impressions, AdsConversions,
      Sessions, Users, NewUsers, EngagedSessions },
    ...
  ],
  events: [
    { YearMonth, CampaignId, CampaignName, Device, EventName, EventCount },
    ...
  ],
  campaigns: [
    { CampaignId, CampaignName, CampaignType, Status, FirstDate, LastDate,
      AllTime_Cost, ..., AllTime_EventCounts, L12M_Cost, ..., L12M_EventCounts },
    ...
  ],
  geographic: [
    { YearMonth, CampaignId, CampaignName, Country, Cost, Clicks, Impressions, Conversions },
    ...
  ],
  meta: {
    lastUpdated: '2026-01-18T05:30:00Z',
    availableEvents: ['page_view', 'form_submit', 'keynote_form_submission', ...]
  }
}
```

### getDrillDownData(type, campaignId, startDate, endDate)

Returns raw data for drill-down views.

**Parameters:**
- `type`: 'keywords' | 'searchterms' | 'landingpages'
- `campaignId`: Campaign to filter by (or null for all)
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Returns:** Array of relevant raw data rows

## Chart Specifications

### Trend Chart (Chart.js Line)

```javascript
{
  type: 'line',
  data: {
    labels: ['2025-01', '2025-02', ...],  // YearMonth
    datasets: [
      {
        label: 'Cost',
        data: [1234, 2345, ...],
        borderColor: '#4F46E5',
        tension: 0.1
      },
      {
        label: 'Cost (Last Year)',  // When compare mode on
        data: [1100, 2100, ...],
        borderColor: '#4F46E5',
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
}
```

### Device Breakdown (Chart.js Doughnut)

```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [45, 40, 15],  // Percentages
      backgroundColor: ['#4F46E5', '#10B981', '#F59E0B']
    }]
  }
}
```

## Country Code Mapping

Static lookup table for criterion ID → country name:

```javascript
const COUNTRY_CODES = {
  2004: 'Afghanistan',
  2008: 'Albania',
  2012: 'Algeria',
  2020: 'Andorra',
  2024: 'Angola',
  2028: 'Antigua and Barbuda',
  2032: 'Argentina',
  2036: 'Australia',
  2040: 'Austria',
  2048: 'Bahrain',
  2050: 'Bangladesh',
  2056: 'Belgium',
  2076: 'Brazil',
  2124: 'Canada',
  2156: 'China',
  2208: 'Denmark',
  2246: 'Finland',
  2250: 'France',
  2276: 'Germany',
  2300: 'Greece',
  2344: 'Hong Kong',
  2356: 'India',
  2372: 'Ireland',
  2376: 'Israel',
  2380: 'Italy',
  2392: 'Japan',
  2410: 'South Korea',
  2442: 'Luxembourg',
  2458: 'Malaysia',
  2484: 'Mexico',
  2528: 'Netherlands',
  2554: 'New Zealand',
  2578: 'Norway',
  2586: 'Pakistan',
  2608: 'Philippines',
  2616: 'Poland',
  2620: 'Portugal',
  2643: 'Russia',
  2682: 'Saudi Arabia',
  2702: 'Singapore',
  2710: 'South Africa',
  2724: 'Spain',
  2752: 'Sweden',
  2756: 'Switzerland',
  2764: 'Thailand',
  2792: 'Turkey',
  2784: 'United Arab Emirates',
  2826: 'United Kingdom',
  2840: 'United States',
  2704: 'Vietnam'
  // Add more as needed based on actual data
};

function getCountryName(criterionId) {
  return COUNTRY_CODES[criterionId] || `Unknown (${criterionId})`;
}
```

## CSS Design Tokens

```css
:root {
  /* Colors */
  --color-primary: #4F46E5;
  --color-primary-dark: #4338CA;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-bg: #F9FAFB;
  --color-card: #FFFFFF;
  --color-border: #E5E7EB;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

## Performance Considerations

1. **Single data fetch on load** - All summary data loaded once, filtered client-side
2. **No unnecessary re-renders** - Only update DOM elements that change
3. **Lazy load drill-downs** - Raw data only fetched when user requests it
4. **Chart.js lazy rendering** - Charts created only when tab is activated
5. **Debounced filter updates** - Avoid rapid re-filtering during user input

## Error Handling

```javascript
function handleError(error, context) {
  console.error(`Error in ${context}:`, error);

  DashboardState.ui.error = {
    message: getUserFriendlyMessage(error),
    context: context,
    timestamp: new Date()
  };

  renderErrorState();
}

function getUserFriendlyMessage(error) {
  if (error.message.includes('permission')) {
    return 'You do not have permission to access this dashboard.';
  }
  if (error.message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  return 'Something went wrong. Please refresh the page.';
}
```

