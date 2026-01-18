# Phase 2: Architecture Decision Records (ADR)

## ADR-015: Vue 3 via CDN (No Build Tooling)

- **Status**: Accepted

### Context

The dashboard needs a modern frontend framework for component-based architecture, reactive state management, and maintainable code structure. Options considered:

1. **Vanilla JavaScript** - No framework
2. **React** - Most popular, but requires JSX compilation
3. **Vue 3** - Can run without build step via CDN
4. **Svelte** - Requires compilation
5. **Full Vite/Webpack build** - Maximum power, maximum complexity

### Decision

Use **Vue 3 via CDN** without any build tooling.

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

### Rationale

1. **Apps Script deployment constraint**: Deployment is `clasp push` of HTML/JS files. No opportunity to run `npm build` in the pipeline.

2. **Simplicity over power**: This is a single-user internal dashboard, not a SaaS product. The simplicity of "edit file, push, refresh" trumps advanced tooling benefits.

3. **Vue's CDN-friendly design**: Unlike React (needs JSX transpilation) or Svelte (requires compiler), Vue 3's composition API works natively in browsers via CDN.

4. **Component architecture without build**: Vue's `<script setup>` won't work, but we can use `defineComponent()` for clean component organization.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Vanilla JS | No reactive state, manual DOM manipulation, harder to maintain as complexity grows |
| React via CDN | Possible with HTM library, but more awkward syntax and less documentation for no-build React |
| Full Vite build | Would require hosting built assets elsewhere (Firebase, GitHub Pages) and complicates deployment |
| Svelte | Requires compilation, no CDN-only option |

### Consequences

**Positive:**
- Zero build configuration
- Simple deployment via `clasp push`
- Modern component architecture
- Reactive state management
- Large ecosystem and documentation

**Negative:**
- No single-file components (`.vue` files)
- No TypeScript (could use JSDoc for type hints)
- No tree-shaking (full Vue library loaded)
- Some Vue features unavailable (e.g., `<script setup>`)

---

## ADR-016: Hash-Based Routing

- **Status**: Accepted

### Context

Users need to:
1. Use browser back/forward buttons to navigate between views
2. Bookmark specific views (e.g., "Campaign Analysis for Q3 2024")
3. Share links to specific dashboard states

Apps Script Web Apps serve from a Google-controlled domain with a URL like:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

We cannot configure server-side routing on this domain.

### Decision

Use **Vue Router with hash mode** for client-side routing.

```javascript
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [...]
})
```

URLs will look like:
```
https://script.google.com/.../exec#/campaigns
https://script.google.com/.../exec#/trends?dateFrom=2025-01&dateTo=2025-06
https://script.google.com/.../exec#/keywords?campaign=Brand+Search
```

### Rationale

1. **No server configuration needed**: Hash changes are handled entirely client-side.

2. **Full browser history support**: Back/forward buttons work correctly.

3. **Bookmarkable URLs**: Users can save and share specific views with filters applied.

4. **Query parameter support**: Filter state can be encoded in URL for persistence.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| History mode (`/campaigns`) | Requires server-side routing configuration; not possible with Apps Script |
| No routing (single page) | Loses browser history, bookmarking, and shareability |
| localStorage only | State not shareable, lost on browser history navigation |

### Consequences

**Positive:**
- Browser back/forward works
- Views are bookmarkable
- Links are shareable
- Filter state persists in URL
- No server configuration needed

**Negative:**
- URLs have `#` which some find ugly
- Hash fragment not sent to server (not relevant for our use case)

---

## ADR-017: PrimeVue Component Library

- **Status**: Accepted

### Context

The dashboard requires several complex UI components:
- Data tables with sorting, filtering, pagination
- Dropdown/multiselect for filters
- Date pickers for range selection
- Tabs for view navigation
- Cards for metric display

Building these from scratch would be time-consuming and error-prone.

### Decision

Use **PrimeVue** component library via CDN.

```html
<script src="https://unpkg.com/primevue@3/core/core.min.js"></script>
<script src="https://unpkg.com/primevue@3/datatable/datatable.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/primevue@3/resources/themes/lara-light-blue/theme.css">
```

### Rationale

1. **CDN availability**: PrimeVue components are available individually via CDN, unlike many Vue component libraries.

2. **DataTable quality**: PrimeVue's DataTable is one of the best in the Vue ecosystem - sortable, filterable, paginated, with built-in loading states.

3. **Consistent design**: All components share a cohesive design language out of the box.

4. **Documentation**: Excellent documentation with copy-paste examples.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Vuetify | Requires build step for optimal use; CDN setup is awkward |
| Element Plus | CDN support exists but less mature than PrimeVue |
| Custom components | Time-consuming; DataTable alone would take significant effort |
| Bootstrap Vue | Outdated; doesn't support Vue 3 well |

### Components We'll Use

- `DataTable` - Campaign tables, drill-down views
- `Dropdown` / `MultiSelect` - Filter controls
- `Calendar` - Date range selection
- `Card` - Metric cards
- `TabView` - View navigation
- `Skeleton` - Loading states

### Consequences

**Positive:**
- Production-ready components
- Consistent visual design
- Built-in accessibility
- Active maintenance

**Negative:**
- Larger bundle size (mitigated by loading only needed components)
- Locked into PrimeVue's design patterns
- Learning curve for component APIs

---

## ADR-018: Chart.js for Visualizations

- **Status**: Accepted

### Context

The dashboard needs charts for:
- Time series trends (line charts)
- Metric comparisons (bar charts)
- Distribution analysis (pie/donut charts)

### Decision

Use **Chart.js** for all visualizations.

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### Rationale

1. **Simplicity**: Chart.js has a gentle learning curve and handles 90% of dashboard charting needs.

2. **CDN-ready**: Works perfectly without build tooling.

3. **Good defaults**: Charts look professional out of the box without extensive configuration.

4. **Responsive**: Built-in responsive behavior.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| D3.js | Overkill for standard charts; steep learning curve; requires significant code for basic charts |
| Apache ECharts | Good option, but less familiar; Chart.js sufficient for our needs |
| PrimeVue Charts | Uses Chart.js under the hood; might as well use Chart.js directly |
| Google Charts | Adds Google dependency; less flexible styling |

### Consequences

**Positive:**
- Quick implementation
- Good-looking defaults
- Responsive out of the box
- Extensive plugin ecosystem

**Negative:**
- Limited for highly custom visualizations
- Canvas-based (not SVG) - less accessible for screen readers

---

## ADR-019: Simplified Mobile Experience

- **Status**: Accepted

### Context

The dashboard will be accessed on mobile devices occasionally. Full responsive design for complex data tables and charts is challenging and time-consuming.

### Decision

Provide a **simplified mobile view** that shows summary cards only. Full analysis features (tables, charts, drill-downs) are available on desktop and tablet.

Mobile breakpoint: `< 768px`

### Rationale

1. **User behavior**: Primary users analyze data at their desk, not on phones. Mobile access is likely for quick status checks.

2. **UX quality over feature quantity**: A well-designed mobile summary view is better than a cramped, unusable full dashboard.

3. **Development efficiency**: Responsive tables and charts require significant effort for a secondary use case.

4. **Clear messaging**: Mobile view will indicate "For full analysis, use tablet or desktop."

### Mobile View Content

- Performance summary cards (Cost, Clicks, Sessions, Conversions)
- Percentage change vs previous period
- Data freshness indicator
- Link to open on desktop

### Consequences

**Positive:**
- Clean mobile experience
- Faster development
- Clear user expectations
- No compromised desktop experience

**Negative:**
- Limited mobile functionality
- Some users may want full mobile access

---

## ADR-020: localStorage for Conversion Event Selection

- **Status**: Accepted

### Context

Users can select which events count as "conversions" (e.g., `form_submit + phone_click`). This selection should persist across sessions.

Options:
1. Store in localStorage
2. Store in a Google Sheet (config sheet)
3. Store in Apps Script Properties Service

### Decision

Use **localStorage** for conversion event selection persistence.

```javascript
// Save
localStorage.setItem('selectedConversionEvents', JSON.stringify(['form_submit', 'phone_click']))

// Load
const events = JSON.parse(localStorage.getItem('selectedConversionEvents') || '[]')
```

### Rationale

1. **Instant access**: No server round-trip to load preferences.

2. **Single-user dashboard**: Only one user, so no need to sync preferences across devices.

3. **Simplicity**: No backend code needed for preference storage.

4. **Privacy**: User preferences stay on their device.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Google Sheet config | Requires server call on every load; adds latency; overkill for single preference |
| Properties Service | Server-side storage; adds complexity for minimal benefit |
| URL parameters only | Awkward UX for multi-event selection; URLs become very long |

### Consequences

**Positive:**
- Instant preference loading
- No server code needed
- Works offline (preference is cached)

**Negative:**
- Preferences don't sync across devices
- Lost if user clears browser data (acceptable trade-off)

---

## ADR-021: Static Country Code Mapping Table

- **Status**: Accepted

### Context

Geographic data from Google Ads contains country criterion IDs (e.g., `2840` for USA), not country names. The dashboard needs to display human-readable country names.

Options:
1. API call to `geo_target_constant` resource at runtime
2. Static lookup table embedded in client code
3. Pre-resolve in aggregation and store country names

### Decision

Use a **static JavaScript lookup table** in the client code.

```javascript
const COUNTRY_NAMES = {
  2840: 'United States',
  2826: 'United Kingdom',
  2124: 'Canada',
  2036: 'Australia',
  2276: 'Germany',
  // ... ~50 countries the user likely targets
};
```

### Rationale

1. **Performance**: No API call needed; instant lookup.

2. **Simplicity**: Static data rarely changes (country IDs are stable).

3. **Offline-capable**: Works without network access.

4. **Focused scope**: User likely targets 20-50 countries; don't need all 200+.

### Maintenance Strategy

- Include common countries in initial table
- If unknown criterion ID encountered, display as "Country (ID: 2XXX)"
- Can expand table as needed based on actual data

### Consequences

**Positive:**
- Instant country name resolution
- No API dependency
- Simple implementation

**Negative:**
- Manual maintenance if targeting new countries
- Unknown IDs show as numeric (acceptable fallback)

---

## ADR-022: Export Feature Deferred

- **Status**: Accepted

### Context

Users might want to export dashboard data to CSV/Excel for further analysis or sharing.

### Decision

**Defer export functionality** to a future phase.

### Rationale

1. **Direct Sheets access**: Users can open the source Google Sheets directly for any data export needs.

2. **Scope control**: Export adds UI complexity (format selection, column selection, filename) without being core to the analytics mission.

3. **Future flexibility**: Can add export later based on actual user feedback.

### Consequences

- Users must access Sheets directly for exports
- Can add in future phase if needed

---

## ADR-023: Anomaly Alerts Deferred

- **Status**: Accepted

### Context

Automatic detection of anomalies (e.g., "Cost up 50% vs last month") could be valuable for proactive monitoring.

### Decision

**Defer anomaly/alert functionality** to a future phase.

### Rationale

1. **Complexity**: Anomaly detection requires defining thresholds, handling false positives, and designing notification UI.

2. **MVP focus**: Core analytics visibility is more valuable than automated alerts for initial release.

3. **Learn first**: Need to understand what metrics matter most before automating alerts.

### Potential Future Implementation

- Define alert rules (e.g., "Notify if cost > 130% of previous month")
- Email notifications via Apps Script MailApp
- Dashboard alert banner for recent anomalies

### Consequences

- No proactive anomaly detection in Phase 2
- User must actively check dashboard for issues
- Can add in future phase based on usage patterns
