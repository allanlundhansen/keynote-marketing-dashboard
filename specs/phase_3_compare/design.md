# Phase 3: Compare Workspace Technical Design

## Architecture Overview

The Compare Workspace is a single-page view that enables side-by-side comparison of campaign performance across different campaigns and time periods.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Marketing Dashboard                                    Data as of: Jan 2025 │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Overview]  [Compare]                                         [⚙ Settings] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────┐              │
│  │ Campaign A      [x] │ │ Campaign A      [x] │ │    [+]    │              │
│  │ Jan-Mar 2024        │ │ Jan-Mar 2025        │ │ Add Column│              │
│  │ (3 months) 🔒       │ │ (3 months) 🔒       │ │           │              │
│  └─────────────────────┘ └─────────────────────┘ └───────────┘              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ KPIs                                                              [⚙]  ││
│  │ ┌─────────────────────┐ ┌─────────────────────┐                        ││
│  │ │ Cost: $5,000        │ │ Cost: $4,200        │                        ││
│  │ │ Clicks: 1,200       │ │ Clicks: 1,500       │                        ││
│  │ │ CTR: 2.4%           │ │ CTR: 3.1%           │                        ││
│  │ │ Sessions: 800       │ │ Sessions: 950       │                        ││
│  │ └─────────────────────┘ └─────────────────────┘                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Keywords                                                    [⚙] [x]    ││
│  │ ┌─────────────────────┐ ┌─────────────────────┐                        ││
│  │ │ keynote speaker  $2k│ │ keynote speaker  $1k│                        ││
│  │ │ motivational...  $1k│ │ leadership...    $800│                        ││
│  │ │ ...                 │ │ ...                 │                        ││
│  │ └─────────────────────┘ └─────────────────────┘                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        [+ Add Component]                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Tree

```
App
├── AppHeader
│   ├── Logo/Title
│   ├── Navigation (Overview | Compare)
│   └── DataFreshness
│
├── RouterView
│   ├── OverviewView (existing)
│   │
│   └── CompareView (new)
│       ├── CompareHeader
│       │   ├── DurationIndicator
│       │   └── SettingsButton (conversion config)
│       │
│       ├── ColumnContainer (horizontal scroll wrapper)
│       │   ├── CompareColumn (repeating)
│       │   │   ├── ColumnHeader
│       │   │   │   ├── CampaignSelector
│       │   │   │   ├── DateRangeSelector
│       │   │   │   └── RemoveColumnButton
│       │   │   └── ColumnContent (receives component data)
│       │   │
│       │   └── AddColumnButton
│       │
│       ├── ComponentStack
│       │   ├── ComponentWrapper (repeating)
│       │   │   ├── ComponentHeader
│       │   │   │   ├── ComponentTitle
│       │   │   │   ├── SettingsDropdown
│       │   │   │   └── RemoveButton
│       │   │   └── ComponentContent
│       │   │       └── [Dynamic component per column]
│       │   │
│       │   └── AddComponentButton
│       │
│       └── ConversionConfigModal
│
└── AppSidebar (existing, for Overview filters)
```

## State Management

### Workspace State Shape

```javascript
const workspaceState = Vue.reactive({
  // Column configuration
  columns: [
    {
      id: 'col-1',
      campaignId: 'all', // or specific campaign ID
      campaignName: 'All Campaigns',
      dateFrom: '2024-01',
      dateTo: '2024-03'
    },
    {
      id: 'col-2',
      campaignId: 'all',
      campaignName: 'All Campaigns',
      dateFrom: '2025-01',
      dateTo: '2025-03' // auto-calculated from duration
    }
  ],

  // Derived from first column
  duration: {
    months: 3,
    label: '3 months'
  },

  // Active components
  components: [
    { id: 'kpis', type: 'kpis', settings: {} },
    { id: 'keywords', type: 'keywords', settings: { limit: 25 } }
  ],

  // Conversion configuration
  selectedConversionEvents: ['form_submit', 'phone_click'],

  // Loading states (per component per column)
  loading: {
    'col-1': { kpis: false, keywords: true },
    'col-2': { kpis: false, keywords: true }
  },

  // Error states
  errors: {
    'col-1': { keywords: 'Failed to load keywords' }
  },

  // Cached data (per component per column)
  data: {
    'col-1': {
      kpis: { cost: 5000, clicks: 1200, ... },
      keywords: [{ keyword: '...', cost: 2000, ... }, ...]
    },
    'col-2': {
      kpis: { cost: 4200, clicks: 1500, ... },
      keywords: [...]
    }
  }
});
```

### State Persistence

```javascript
// Save to localStorage
function saveWorkspaceConfig() {
  const config = {
    columns: workspaceState.columns,
    components: workspaceState.components,
    selectedConversionEvents: workspaceState.selectedConversionEvents
  };
  localStorage.setItem('compareWorkspaceConfig', JSON.stringify(config));
}

// Load from localStorage
function loadWorkspaceConfig() {
  const saved = localStorage.getItem('compareWorkspaceConfig');
  if (saved) {
    const config = JSON.parse(saved);
    Object.assign(workspaceState, config);
  } else {
    // Default: 2 columns, KPIs only
    initializeDefaultWorkspace();
  }
}
```

### Duration Lock Logic

```javascript
function updateDuration() {
  const firstCol = workspaceState.columns[0];
  const fromDate = new Date(firstCol.dateFrom + '-01');
  const toDate = new Date(firstCol.dateTo + '-01');

  const months = (toDate.getFullYear() - fromDate.getFullYear()) * 12
               + (toDate.getMonth() - fromDate.getMonth()) + 1;

  workspaceState.duration = {
    months,
    label: `${months} month${months > 1 ? 's' : ''}`
  };

  // Update other columns' end dates
  workspaceState.columns.slice(1).forEach(col => {
    col.dateTo = calculateEndDate(col.dateFrom, months);
  });
}

function calculateEndDate(startMonth, durationMonths) {
  const [year, month] = startMonth.split('-').map(Number);
  const endDate = new Date(year, month - 1 + durationMonths - 1, 1);
  return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
}
```

## Backend API Extensions

### New/Modified Endpoints

```javascript
// Get data for a specific component, campaign, and date range
function getComponentData(componentType, campaignId, dateFrom, dateTo) {
  switch (componentType) {
    case 'kpis':
      return getKPIsData(campaignId, dateFrom, dateTo);
    case 'keywords':
      return getKeywordsData(campaignId, dateFrom, dateTo);
    case 'searchTerms':
      return getSearchTermsData(campaignId, dateFrom, dateTo);
    case 'landingPages':
      return getLandingPagesData(campaignId, dateFrom, dateTo);
    case 'deviceBreakdown':
      return getDeviceBreakdownData(campaignId, dateFrom, dateTo);
    case 'typeBreakdown':
      return getTypeBreakdownData(campaignId, dateFrom, dateTo);
    case 'geographic':
      return getGeographicData(campaignId, dateFrom, dateTo);
    case 'funnel':
      return getFunnelData(campaignId, dateFrom, dateTo);
    case 'sparkline':
      return getSparklineData(campaignId, dateFrom, dateTo);
    default:
      throw new Error(`Unknown component type: ${componentType}`);
  }
}

// KPIs - aggregated metrics
function getKPIsData(campaignId, dateFrom, dateTo) {
  // Filter Summary_Monthly by campaign and date range
  // Return: { cost, clicks, impressions, sessions, engagedSessions, ctr, avgCpc, ... }
}

// Keywords - from Summary_Keywords
function getKeywordsData(campaignId, dateFrom, dateTo, limit = 50) {
  // Filter Summary_Keywords
  // Return: [{ keyword, cost, clicks, impressions, ctr, avgCpc, searchTerms: [...] }, ...]
}

// Search Terms - from Raw_Ads_SearchTerms
function getSearchTermsData(campaignId, dateFrom, dateTo, limit = 100) {
  // Filter Raw_Ads_SearchTerms
  // Return: [{ searchTerm, matchedKeyword, cost, clicks, impressions, ctr }, ...]
}

// Landing Pages - from Raw_GA4_Pages
function getLandingPagesData(campaignId, dateFrom, dateTo) {
  // Filter Raw_GA4_Pages
  // Return: [{ landingPage, sessions, engagedSessions, engagementRate }, ...]
}

// Device Breakdown - from Summary_Monthly grouped
function getDeviceBreakdownData(campaignId, dateFrom, dateTo) {
  // Group Summary_Monthly by Device
  // Return: { DESKTOP: {...}, MOBILE: {...}, TABLET: {...} }
}

// Campaign Type Breakdown - from Summary_Monthly grouped
function getTypeBreakdownData(campaignId, dateFrom, dateTo) {
  // Group Summary_Monthly by CampaignType
  // Return: { SEARCH: {...}, DISPLAY: {...}, ... }
}

// Geographic - from Raw_Ads_Geographic
function getGeographicData(campaignId, dateFrom, dateTo, limit = 10) {
  // Filter and aggregate Raw_Ads_Geographic
  // Map criterion IDs to country names
  // Return: [{ country, cost, clicks, impressions, ctr }, ...]
}
```

## Component Implementation Pattern

Each component follows a standard pattern:

```javascript
const KeywordsComponent = {
  name: 'KeywordsComponent',
  props: {
    columnData: Array, // Data for each column
    columns: Array,    // Column configs
    settings: Object   // Component settings
  },
  template: `
    <div class="component-keywords">
      <div class="component-row">
        <div
          v-for="(col, index) in columns"
          :key="col.id"
          class="component-cell"
        >
          <div v-if="loading[col.id]" class="loading">
            <ProgressSpinner />
          </div>
          <div v-else-if="error[col.id]" class="error">
            {{ error[col.id] }}
            <Button label="Retry" @click="retry(col.id)" />
          </div>
          <div v-else>
            <DataTable
              :value="columnData[index]"
              :rows="settings.limit || 25"
              sortField="cost"
              :sortOrder="-1"
            >
              <Column field="keyword" header="Keyword" sortable />
              <Column field="cost" header="Cost" sortable>
                <template #body="{ data }">
                  {{ formatCurrency(data.cost) }}
                </template>
              </Column>
              <Column field="clicks" header="Clicks" sortable />
              <Column field="ctr" header="CTR" sortable>
                <template #body="{ data }">
                  {{ formatPercent(data.ctr) }}
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  `
};
```

## CSS Architecture

### Layout Grid

```css
.compare-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.column-container {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  gap: var(--space-md);
  padding: var(--space-md);
}

.compare-column {
  flex: 0 0 350px; /* Fixed width columns */
  min-width: 300px;
  scroll-snap-align: start;
}

.component-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.component-wrapper {
  background: var(--color-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.component-row {
  display: flex;
  gap: var(--space-md);
}

.component-cell {
  flex: 0 0 350px; /* Match column width */
  min-width: 300px;
}
```

### Sticky Headers

```css
.column-headers {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg);
}

.component-header {
  position: sticky;
  top: 80px; /* Below column headers */
  z-index: 5;
  background: var(--color-card);
}
```

## Data Flow

```
User Action                    State Change                  UI Update
───────────────────────────────────────────────────────────────────────
Add Column            →   columns.push(newCol)       →   Render new column
                          fetchComponentData()           Show loading states
                                                         Populate with data

Change Campaign       →   column.campaignId = x      →   Clear column data
                          fetchComponentData()           Show loading states
                                                         Populate with data

Change Date (col 1)   →   updateDuration()           →   Update duration badge
                          recalculate col 2+ dates       Refetch all data
                          fetchAllData()

Add Component         →   components.push(comp)      →   Render component row
                          saveConfig()                   Fetch data for each col
                          fetchComponentData()

Remove Component      →   components.splice(i, 1)    →   Remove component row
                          saveConfig()

Settings Change       →   component.settings = x     →   Re-render component
                          saveConfig()                   (may refetch if limit changed)
```

## File Structure

```
src/
├── views/
│   ├── OverviewView.html (existing)
│   └── CompareView.html (new)
│
├── components/
│   ├── compare/
│   │   ├── CompareColumn.html
│   │   ├── ColumnHeader.html
│   │   ├── ComponentWrapper.html
│   │   ├── AddColumnButton.html
│   │   ├── AddComponentButton.html
│   │   └── ConversionConfigModal.html
│   │
│   ├── workspace-components/
│   │   ├── KPIsComponent.html
│   │   ├── KeywordsComponent.html
│   │   ├── SearchTermsComponent.html
│   │   ├── LandingPagesComponent.html
│   │   ├── DeviceBreakdownComponent.html
│   │   ├── TypeBreakdownComponent.html
│   │   ├── GeographicComponent.html
│   │   ├── FunnelComponent.html
│   │   └── SparklineComponent.html
│   │
│   └── (existing components)
│
├── stores/
│   ├── store.html (existing - Overview state)
│   └── compareStore.html (new - Compare workspace state)
│
├── Code.js (add new backend functions)
└── index.html (add route, register components)
```

## Navigation Update

```javascript
// index.html routes
const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: OverviewView, name: 'overview' },
  { path: '/compare', component: CompareView, name: 'compare' }
];

// Navigation template
<nav class="app-nav">
  <ul>
    <li><router-link to="/overview">Overview</router-link></li>
    <li><router-link to="/compare">Compare</router-link></li>
  </ul>
</nav>
```

## Performance Considerations

1. **Lazy Component Loading**: Only fetch data for visible components
2. **Request Debouncing**: Debounce rapid config changes to avoid excessive API calls
3. **Data Caching**: Cache fetched data in state; invalidate on config change
4. **Virtual Scrolling**: For large keyword/search term tables, use virtual scrolling
5. **Parallel Fetching**: Fetch data for all columns in parallel

## Error Handling

```javascript
async function fetchComponentData(componentType, columnId) {
  const col = getColumn(columnId);
  setLoading(columnId, componentType, true);
  clearError(columnId, componentType);

  try {
    const data = await new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getComponentData(componentType, col.campaignId, col.dateFrom, col.dateTo);
    });

    setData(columnId, componentType, data);
  } catch (error) {
    console.error(`Failed to load ${componentType} for ${columnId}:`, error);
    setError(columnId, componentType, `Failed to load ${componentType}. Click to retry.`);
  } finally {
    setLoading(columnId, componentType, false);
  }
}
```

## Mobile Considerations

- On screens < 768px, show simplified view
- Option A: Single column at a time with swipe navigation
- Option B: Message "Use tablet or desktop for full comparison"
- Focus mobile effort on Overview, which is already responsive
