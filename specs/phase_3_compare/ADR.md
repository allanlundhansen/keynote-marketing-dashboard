# Phase 3: Architecture Decision Records (ADR)

## ADR-030: Flexible Column-Based Comparison Workspace

- **Status**: Accepted

### Context

The original Phase 2 design had 5 separate analysis views:
- Campaigns (with drill-down)
- Devices
- Campaign Types
- Countries
- Conversions

This structure fragmented the analysis experience. Real optimization work requires comparing data side-by-side, not navigating between isolated views.

### Decision

Implement a **flexible column-based comparison workspace** where:
1. Each column represents a Campaign + Time Period combination
2. Metric components (KPIs, Keywords, etc.) span all columns as rows
3. Users can add/remove components dynamically
4. Duration is locked across all columns for fair comparison

### Rationale

1. **Matches real workflow**: Optimization involves comparing "what worked" vs "what's working now"
2. **Campaign-centric**: Users think in terms of campaigns, not dimensions
3. **Flexibility**: Add components as needed for current analysis task
4. **Single workspace**: No navigation required during analysis session

### Visual Model

```
         Column 1              Column 2              Column 3
      ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
      │ Campaign A   │     │ Campaign A   │     │ Campaign B   │
      │ Q1 2024      │     │ Q1 2025      │     │ Q1 2025      │
      └──────────────┘     └──────────────┘     └──────────────┘
Row 1 │    KPIs      │     │    KPIs      │     │    KPIs      │
Row 2 │  Keywords    │     │  Keywords    │     │  Keywords    │
Row 3 │  Devices     │     │  Devices     │     │  Devices     │
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Keep 5 separate views | Fragmented, doesn't support comparison |
| 2-column fixed comparison | Too limiting, need 3+ for real analysis |
| Tab-based comparison | Still requires switching, not true side-by-side |

### Consequences

**Positive:**
- Powerful, flexible analysis
- Matches optimization workflow
- Single workspace for all analysis

**Negative:**
- More complex state management
- More complex UI to build
- Horizontal scroll required for 3+ columns

---

## ADR-031: Duration Lock Mechanism

- **Status**: Accepted

### Context

When comparing time periods, the durations must match for fair comparison. You can't meaningfully compare 3 months vs 6 months of data.

### Decision

Implement **duration lock**:
1. Column 1 sets the duration (e.g., Jan-Mar 2024 = 3 months)
2. Columns 2+ can only select start date; end date is auto-calculated
3. If Column 1's range changes, all other columns' end dates update

### Rationale

1. **Prevents invalid comparisons**: Can't accidentally compare different durations
2. **Simple UX**: User only picks start date for columns 2+
3. **Flexible**: Can still compare any time period, just same duration

### Implementation

```javascript
// When column 1 date range changes
function onColumn1DateChange(dateFrom, dateTo) {
  const months = calculateMonthsDiff(dateFrom, dateTo);
  workspaceState.duration = { months, label: `${months} months` };

  // Update all other columns
  workspaceState.columns.slice(1).forEach(col => {
    col.dateTo = addMonths(col.dateFrom, months - 1);
  });
}
```

### Consequences

**Positive:**
- Ensures valid comparisons
- Simpler UX for columns 2+
- Clear visual indicator of lock

**Negative:**
- Can't compare different durations (by design)
- Need to handle edge cases (partial months, year boundaries)

---

## ADR-032: Component-Based Architecture for Metrics

- **Status**: Accepted

### Context

The workspace needs to display various metric types (KPIs, Keywords, Search Terms, etc.) in a consistent way across all columns.

### Decision

Use a **component-based architecture** where:
1. Each metric type is a standalone Vue component
2. Components receive column data as props
3. ComponentWrapper provides consistent header/settings/remove UI
4. Components are registered in a central registry

### Component Registry

```javascript
const componentRegistry = {
  kpis: {
    component: KPIsComponent,
    label: 'Key Metrics',
    icon: 'pi-chart-bar',
    removable: false, // Always present
    fetcher: 'getKPIsData'
  },
  keywords: {
    component: KeywordsComponent,
    label: 'Keywords',
    icon: 'pi-key',
    removable: true,
    fetcher: 'getKeywordsData',
    defaultSettings: { limit: 25 }
  },
  // ... more components
};
```

### Rationale

1. **Separation of concerns**: Each component handles its own rendering/logic
2. **Consistency**: ComponentWrapper ensures uniform header/actions
3. **Extensibility**: Easy to add new component types
4. **Testability**: Components can be tested in isolation

### Consequences

**Positive:**
- Clean architecture
- Easy to maintain and extend
- Consistent UX across components

**Negative:**
- More boilerplate per component
- Need to manage component registration

---

## ADR-033: Per-Column Per-Component State

- **Status**: Accepted

### Context

Each component needs to track loading state, error state, and cached data independently for each column. A component might be loaded in column 1 but still loading in column 2.

### Decision

Structure state as nested objects keyed by column ID and component type:

```javascript
const state = {
  loading: {
    'col-1': { kpis: false, keywords: true },
    'col-2': { kpis: true, keywords: false }
  },
  errors: {
    'col-1': { keywords: null },
    'col-2': { keywords: 'Failed to load' }
  },
  data: {
    'col-1': { kpis: {...}, keywords: [...] },
    'col-2': { kpis: {...}, keywords: null }
  }
};
```

### Rationale

1. **Independent states**: Column 1 success doesn't affect column 2
2. **Granular UI**: Can show loading/error per cell, not whole component
3. **Efficient updates**: Only refetch what changed

### Consequences

**Positive:**
- Fine-grained loading states
- Better UX (partial data display)
- Efficient data fetching

**Negative:**
- More complex state structure
- More state management code

---

## ADR-034: localStorage for Configuration Persistence

- **Status**: Accepted

### Context

Users want their workspace configuration (selected components, column setup) to persist across sessions.

### Decision

Use **localStorage** for persistence:
- Save: columns, components, selectedConversionEvents
- Don't save: cached data, loading states, errors
- Auto-save on configuration changes (debounced)
- Load on Compare view mount

### Storage Key

```javascript
const STORAGE_KEY = 'compareWorkspaceConfig';

// Saved structure
{
  columns: [...],
  components: [...],
  selectedConversionEvents: [...]
}
```

### Rationale

1. **Simple**: No backend changes required
2. **Fast**: Immediate read/write
3. **User-specific**: Each browser has own config
4. **Appropriate scope**: This is UI state, not business data

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| URL state | Too complex for full workspace config |
| Google Sheets config | Overkill, adds latency |
| No persistence | Poor UX, have to rebuild each time |

### Consequences

**Positive:**
- Simple implementation
- No backend changes
- Fast load/save

**Negative:**
- Lost if user clears browser data
- Not synced across devices
- Can't share workspace config (URL would enable this)

---

## ADR-035: Simplified Navigation (2 Views)

- **Status**: Accepted

### Context

Phase 2 originally had 6 navigation items. The Compare workspace subsumes 5 of them (Campaigns, Devices, Types, Countries, Conversions).

### Decision

Reduce navigation to **2 views**:
1. **Overview** - Quick aggregate view ("Is my marketing working?")
2. **Compare** - Deep analysis workspace ("How do I optimize?")

### Rationale

1. **Simpler mental model**: Two clear purposes
2. **Less navigation**: Everything accessible from Compare
3. **Conversion config**: Moves to settings in Compare header

### Consequences

**Positive:**
- Cleaner navigation
- Clear separation of purpose
- Less cognitive load

**Negative:**
- Users familiar with old nav need to adapt
- Can't jump directly to "Devices" (need to add component)

---

## ADR-036: Mobile Strategy - Simplified View

- **Status**: Accepted

### Context

The Compare workspace with multiple columns and horizontal scroll doesn't work well on mobile phones.

### Decision

On mobile (< 768px):
- Option A: Show single column at a time with swipe navigation
- Option B: Show message "Use tablet or desktop for full comparison"

Recommendation: Start with Option B, iterate based on user feedback.

### Rationale

1. **Complexity**: Multi-column comparison on phone is fundamentally awkward
2. **Overview works**: Mobile users can still use Overview for quick insights
3. **Pragmatic**: Better to do mobile well with limited scope than poorly with full scope
4. **Tablet works**: iPad-size screens can handle the workspace

### Consequences

**Positive:**
- Don't over-invest in difficult mobile UX
- Focus on where comparison is actually useful (desktop/tablet)
- Overview remains mobile-friendly

**Negative:**
- Mobile users can't do deep comparison
- May frustrate mobile-heavy users

---

## ADR-037: Parallel Data Fetching

- **Status**: Accepted

### Context

When loading the workspace or adding components, multiple API calls are needed (one per column per component).

### Decision

Use **parallel fetching** with Promise.all:

```javascript
// Fetch KPIs for all columns in parallel
async function fetchKPIsForAllColumns() {
  const promises = workspaceState.columns.map(col =>
    fetchComponentData('kpis', col.id)
  );
  await Promise.all(promises);
}
```

### Rationale

1. **Performance**: Parallel is faster than sequential
2. **Apps Script supports it**: Multiple concurrent requests work
3. **Independent data**: Column data doesn't depend on other columns

### Consequences

**Positive:**
- Faster initial load
- Better perceived performance

**Negative:**
- More concurrent requests to Apps Script
- Need to handle partial failures gracefully
