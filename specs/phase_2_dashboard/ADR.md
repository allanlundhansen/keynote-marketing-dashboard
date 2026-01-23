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

---

## ADR-024: Overview Dashboard Structure - Hierarchical Metrics + Funnel Visualization

- **Status**: Accepted

### Context

The Overview (Dashboard Home) needs to answer "Is my marketing working?" at a glance. The original spec listed 10 metrics to display as equal-weight cards, but this approach:

1. Doesn't tell a story - just shows data without prioritization
2. Doesn't highlight the funnel - the core value proposition of this project
3. Forces users to mentally process which metrics matter most
4. Misses the unique insight this dashboard can provide: WHERE in the funnel problems occur

### Decision

Structure the Overview in **5 hierarchical sections** with distinct purposes:

1. **Primary KPIs (4 large cards)**: Cost, Conversions, Cost/Conversion, Engagement Rate
2. **Funnel Visualization**: Impressions → Clicks → Sessions → Engaged → Conversions with rates
3. **Supporting Metrics (6 smaller cards)**: Impressions, Clicks, CTR, Sessions, Avg CPC, Cost/Session
4. **Trend Sparkline**: Cost + Conversions over time
5. **Quick Insights (lazy-loaded)**: Top keywords by cost/conversions

### Rationale

**1. Primary KPIs (4 metrics, not 10)**

These 4 metrics directly answer "Is my marketing working?":
- **Cost** = what we're spending
- **Conversions** = what we're getting (business outcome)
- **Cost/Conversion** = THE efficiency metric - answers "is this profitable?"
- **Engagement Rate** = funnel health indicator (Engaged Sessions / Sessions)

Other metrics (Impressions, Clicks, CTR, etc.) are context, not the answer. Elevating 4 metrics creates visual hierarchy and reduces cognitive load.

**2. Funnel Visualization**

This is the **core value proposition** of the entire project. From implementation_plan.md:

> "Analyze the full funnel: Ads → Landing Page → Booking Inquiry"
> "Conversion funnel drop-off (where are we losing people?)"

A visual funnel showing conversion rates at each stage provides instant diagnostic value:
- Low CTR → Ad creative/targeting problem
- Low Click→Session rate → Landing page load or ad/page mismatch
- Low Session→Engaged rate → Landing page content problem
- Low Engaged→Conversion rate → CTA/offer problem

No generic dashboard provides this. It's our differentiation.

**3. Supporting Metrics (secondary visual weight)**

Impressions, Clicks, CTR, Sessions, Avg CPC, Cost/Session are useful context but shouldn't compete with primary KPIs. Smaller cards, positioned below primary metrics.

**4. Trend Sparkline**

Addresses the explicit goal: "Understand if campaigns are underperforming vs. external factors (seasonality, economy)". A simple line chart showing Cost + Conversions trends over time.

**5. Quick Insights (lazy-loaded)**

Keywords are the actionable lever for Google Ads optimization. Showing top keywords by cost and conversions surfaces actionable insights on the main page without requiring drill-down navigation.

Lazy-loading strategy preserves <2s initial load requirement (keywords come from Raw sheets, which are large).

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| 10 equal-weight metric cards | Overwhelming; doesn't prioritize; doesn't tell a story |
| Funnel in separate "Funnel" tab | Hides core value; Overview should preview key insights |
| No keyword insights on Overview | Hides actionable data; forces extra clicks for common task |
| Load all sections synchronously | Would break <2s load requirement for keywords |

### Consequences

**Positive:**
- Clear visual hierarchy guides user attention
- Funnel visualization provides unique diagnostic value
- Keyword insights surface actionable data immediately
- Lazy-loading maintains fast initial load
- Design directly serves project goals

**Negative:**
- More complex than simple metric cards
- Funnel visualization component requires custom development
- Lazy-loading adds async complexity

---

## ADR-025: PrimeVue 4 Upgrade (from PrimeVue 3)

- **Status**: Accepted

### Context

Initial implementation used PrimeVue 3 via CDN. PrimeVue 4 was released with significant improvements and a new theming system.

### Decision

Upgrade to **PrimeVue 4** with the new Aura theme via `@primeuix/themes`.

```html
<script src="https://unpkg.com/primevue/umd/primevue.min.js"></script>
<script src="https://unpkg.com/@primeuix/themes/umd/aura.js"></script>
```

Configuration:
```javascript
app.use(PrimeVue.Config, {
  theme: {
    preset: PrimeUIX.Themes.Aura,
    options: {
      darkModeSelector: false  // Force light mode
    }
  }
});
```

### Rationale

1. **Latest version**: PrimeVue 4 is current; PrimeVue 3 will eventually lose support
2. **Better theming**: New preset-based theming system is cleaner
3. **Component improvements**: DatePicker, MultiSelect, Drawer have better APIs
4. **Dark mode control**: Can explicitly disable dark mode to prevent system preference issues

### Key Changes from PrimeVue 3

| PrimeVue 3 | PrimeVue 4 |
|------------|------------|
| `Calendar` | `DatePicker` |
| `Sidebar` | `Drawer` |
| CSS theme files | `@primeuix/themes` presets |
| `PrimeVue.Themes.Aura` | `PrimeUIX.Themes.Aura` |

### Consequences

**Positive:**
- Modern, supported version
- Cleaner theming system
- Better component APIs
- Explicit dark mode control

**Negative:**
- Component name changes required code updates
- Theme configuration syntax changed

---

## ADR-026: Flexible Comparison Mode

- **Status**: Accepted

### Context

Users need to compare current performance against historical data. Initial implementation had only a YoY (Year-over-Year) toggle.

### Decision

Implement **flexible comparison mode** with multiple options:

1. **None** - No comparison
2. **Previous Period** - Compare to the immediately preceding period of same length
3. **Same Period Last Year** - Compare to same months in previous year
4. **Custom** - User selects specific comparison date range

### Rationale

1. **MoM analysis**: Users often want Month-over-Month comparison, not just YoY
2. **Seasonal patterns**: Sometimes need to compare to specific past periods (e.g., last Q4)
3. **Flexibility**: Different analysis questions require different comparison baselines

### Implementation

State structure:
```javascript
dateRange: {
  from: '2025-01',
  to: '2025-12',
  comparisonMode: 'none',      // 'none' | 'previous' | 'lastYear' | 'custom'
  compareFrom: null,           // For custom mode
  compareTo: null              // For custom mode
}
```

Comparison range calculation:
- **previous**: Shift primary range back by its length (e.g., 12 months → previous 12 months)
- **lastYear**: Same months, year - 1
- **custom**: User-specified dates

### Consequences

**Positive:**
- Supports multiple analysis scenarios
- User has full control over comparison baseline
- Persisted in URL for bookmarking

**Negative:**
- More complex UI than simple toggle
- Custom mode requires additional date pickers

---

## ADR-027: Merge Trend Analysis into Overview (No Separate Trends View)

- **Status**: Accepted

### Context

The original spec included a dedicated Trends View (`#/trends`) with:
- User-selectable metric dropdowns (primary + secondary)
- Dual Y-axis chart support
- Full customization of which metrics to compare

However, the Overview already has a trend sparkline showing Cost & Clicks with comparison overlay. The question arose: does a separate Trends view add value, or is it redundant?

### Decision

**Merge trend analysis into the Overview** via metric presets instead of building a separate Trends view.

Implementation:
- Add a `SelectButton` above the Overview sparkline
- Offer 4 preset metric combinations:
  1. Cost & Clicks (default)
  2. Cost & Sessions
  3. Sessions & Engaged Sessions
  4. Clicks & Impressions
- Remove the `/trends` route entirely
- Remove "Trends" from sidebar navigation

### Rationale

1. **Redundancy**: The Overview sparkline already provides trend visualization. A separate page for "more trend options" adds navigation friction without proportional value.

2. **"Pick any metric" is over-engineered**: In practice, dashboard users rarely use fully flexible metric selectors. They look at defaults, get their answer, and leave. Preset combinations cover 95% of use cases.

3. **Single-page principle**: Everything a user needs for quick analysis should be on Overview. Requiring navigation to see "Sessions trend" instead of "Cost trend" is poor UX.

4. **Development efficiency**: Building metric dropdowns, dual Y-axis logic, and maintaining parity with comparison modes requires effort for questionable ROI.

5. **The funnel already shows all metrics**: The Overview funnel visualization displays all key metrics (Impressions, Clicks, Sessions, Engaged, Conversions) with rates. A trend chart is supplementary context, not primary analysis.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Build full Trends view as spec'd | Over-engineered for single-user dashboard; redundant with Overview |
| Skip trend customization entirely | Loses flexibility for users who want to see Sessions trends |
| Fully customizable dropdowns on Overview | Too complex; preset combinations are simpler and sufficient |

### Consequences

**Positive:**
- Simpler navigation (one fewer route)
- All trend analysis on single page
- Lower development effort
- Presets guide users to useful combinations
- Comparison overlay works automatically with all presets

**Negative:**
- Cannot compare arbitrary metrics (e.g., CTR vs Avg CPC)
- Limited to 4 preset combinations
- Power users wanting full flexibility must use raw Sheets data

---

## ADR-028: Consolidate Drill-Down Views into Campaign Detail

- **Status**: Accepted

### Context

The original spec separated drill-down views into two places:
- **Section 7.3** (tasks) / **Section 3** (requirements): "Campaign drill-down with keywords and search terms tabs"
- **Section 12** (tasks) / **Section 8** (requirements): "Drill-Down Views" with Keywords, Search Terms, Landing Pages as separate routes

This created circular dependencies and didn't reflect actual user flow. You couldn't implement 7.3 without implementing 12.1/12.2, and the separation was artificial.

### Decision

**Consolidate all drill-down functionality into Campaign Detail View** as tabs, not separate routes.

User flow:
```
Campaign List (#/campaigns)
    └── Click row → Campaign Detail (#/campaigns/:id)
                        ├── Keywords Tab
                        ├── Search Terms Tab
                        └── Landing Pages Tab
```

### Rationale

1. **Reflects actual user journey**: Users don't navigate directly to "Keywords" - they go to a campaign and then explore its keywords.

2. **Eliminates redundancy**: One place in the spec for drill-down views, not two.

3. **Simpler routing**: Fewer routes to maintain. Campaign context is preserved in the URL (`/campaigns/:id`).

4. **Better UX**: Tabs keep user in context. No back-and-forth between separate pages.

### Changes Made

- **tasks.md**: Consolidated Section 12 into Section 7 (Campaign Analysis)
- **requirements.md**: Consolidated Section 8 into Section 3 (Campaign Analysis)
- **design.md**: Updated component tree and removed standalone drill-down routes

### Consequences

**Positive:**
- Clearer spec organization
- Single source of truth for drill-down implementation
- Simpler routing
- Better user experience (tabs vs separate pages)

**Negative:**
- Can't deep-link directly to Keywords for a campaign (must go through Campaign Detail)
- Tab state not preserved in URL (could add `?tab=keywords` if needed later)

---

## ADR-029: Defer Analysis Views to Phase 3 (Compare Workspace)

- **Status**: Accepted

### Context

Phase 2 originally planned 6 separate views:
1. Overview (done)
2. Campaigns (with drill-down tabs)
3. Devices
4. Campaign Types
5. Countries
6. Conversions

During implementation review, we identified that this structure:
1. **Fragments the analysis experience** - Users must navigate between 5 different views to analyze their data
2. **Doesn't match real workflow** - Optimization work requires comparing campaigns side-by-side, not viewing them in isolation
3. **Limits comparison flexibility** - Can't easily compare "Campaign A (2024) vs Campaign A (2025)" or "Campaign A vs Campaign B vs Campaign C"

### Decision

**Defer Sections 7-11 (all analysis views) to Phase 3: Compare Workspace.**

Phase 2 scope becomes:
- Overview Dashboard (done) - "Is my marketing working?"

Phase 3 will deliver:
- Compare Workspace - "How do I optimize?"

### The Phase 3 Vision

A flexible comparison workspace where:
- **Columns** = Campaign + Time Period combinations (e.g., "Campaign A, Jan-Mar 2024" vs "Campaign A, Jan-Mar 2025")
- **Components** = Addable/removable metric blocks (KPIs, Keywords, Search Terms, Landing Pages, Device breakdown, etc.)
- **Duration lock** = All columns must have same duration for fair comparison
- **Persistence** = Component configuration saved to localStorage

This replaces 5 fragmented views with 1 powerful, flexible workspace.

### Rationale

1. **Campaign-centric mental model**: Users think "How is Campaign X doing?" not "How are my devices doing?"

2. **Real optimization workflow**: Comparing what worked last year vs this year, seeing all metrics side-by-side

3. **Devices/Types/Countries as dimensions**: These aren't separate views - they're lenses on campaign data. They become addable components.

4. **Simpler navigation**: Overview + Compare (2 views) instead of 6 views

### Consequences

**Positive:**
- More powerful analysis capability
- Simpler navigation structure
- Matches actual optimization workflow
- Phase 2 delivers complete, usable product (Overview)

**Negative:**
- Phase 2 has no drill-down capability (only Overview)
- Phase 3 is more complex to implement
- More state management required (column config, component selection)
