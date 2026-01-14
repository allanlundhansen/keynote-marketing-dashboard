# Phase 1: Foundation (MVP) Design

## Architecture Overview

We are using a **Serverless-like architecture** hosted on Google Apps Script with a **hybrid data ingestion model**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  Google Ads Script  │────────→│  Google Sheets           │  │
│  │  (runs IN account)  │  Push   │  ├─ Raw_Ads_Campaigns    │  │
│  │                     │  Daily  │  ├─ Raw_Ads_AdGroups     │  │
│  └─────────────────────┘         │  ├─ Raw_Ads_Keywords     │  │
│                                  │  └─ Raw_Ads_SearchTerms  │  │
│  ┌─────────────────────┐         │                          │  │
│  │  GA4 Data API       │────────→│  └─ Raw_GA4_Data         │  │
│  │  (direct access)    │  Pull   └──────────────────────────┘  │
│  └─────────────────────┘                     │                 │
│                                              ▼                 │
└─────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  User via Browser   │◄───────→│  Apps Script Web App     │  │
│  │                     │  HTML   │  (google.script.run)     │  │
│  └─────────────────────┘         └──────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hybrid Data Ingestion Model

| Source | Method | Reason |
|--------|--------|--------|
| **Google Ads** | Push via internal script | API access requires approval; internal scripts have native access |
| **GA4** | Pull via API | Analytics Data API is readily accessible |

## Component Design

### 1. Backend Services (`src/`)

| File | Purpose |
|------|---------|
| `Config.js` | Centralized configuration (API IDs, sheet names) |
| `Code.js` | Main entry points (`doGet`, `refreshData`, `getDashboardData`) |
| `AdsService.js` | Reads Ads data from Sheets (populated by internal script) |
| `AnalyticsService.js` | GA4 Data API integration |
| `SheetManager.js` | Sheet CRUD operations (find, create, append, read) |
| `Test.js` | API connection verification functions |

### 2. Google Ads Internal Scripts (`src/`)

| File | Purpose |
|------|---------|
| `AdsScript_Internal.js` | Daily export script (runs in Google Ads account) |
| `AdsScript_Backfill.js` | One-time historical data export (to be created) |

### 3. Frontend Design (`src/index.html`)

- **Single Page Application (SPA)** feel with server-side template delivery
- **CSS Framework**: Custom minimal CSS with CSS Variables for theming
- **Data Loading**: Asynchronous via `google.script.run` for fast first paint

## Data Schema

### Google Ads Data (4 Sheets)

#### Sheet: `Raw_Ads_Campaigns`

Daily campaign-level metrics for strategic overview.

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Unique campaign ID |
| CampaignName | String | Human-readable name |
| Status | String | ENABLED, PAUSED, REMOVED |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| AvgCPC | Number | Average cost per click |
| Conversions | Number | Count |
| CostPerConversion | Number | Cost / Conversions |
| ImpressionShare | Number | Search impression share (decimal) |

#### Sheet: `Raw_Ads_AdGroups`

Daily ad group-level metrics for tactical analysis.

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Parent campaign ID |
| CampaignName | String | Parent campaign name |
| AdGroupId | String | Unique ad group ID |
| AdGroupName | String | Human-readable name |
| Status | String | ENABLED, PAUSED, REMOVED |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| AvgCPC | Number | Average cost per click |
| Conversions | Number | Count |

#### Sheet: `Raw_Ads_Keywords`

Daily keyword-level metrics for bid optimization and quality analysis.

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Parent campaign ID |
| CampaignName | String | Parent campaign name |
| AdGroupId | String | Parent ad group ID |
| AdGroupName | String | Parent ad group name |
| KeywordId | String | Unique keyword ID |
| KeywordText | String | The keyword text |
| MatchType | String | EXACT, PHRASE, BROAD |
| Status | String | ENABLED, PAUSED, REMOVED |
| QualityScore | Number | 1-10 score (if available) |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| AvgCPC | Number | Average cost per click |
| Conversions | Number | Count |

#### Sheet: `Raw_Ads_SearchTerms`

Daily search term data for intent analysis and negative keyword discovery.

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| CampaignId | String | Campaign ID |
| CampaignName | String | Campaign name |
| AdGroupId | String | Ad group ID |
| AdGroupName | String | Ad group name |
| KeywordText | String | Matched keyword |
| SearchTerm | String | Actual user search query |
| Cost | Number | Spend in account currency |
| Clicks | Number | Count |
| Impressions | Number | Count |
| CTR | Number | Click-through rate (decimal) |
| Conversions | Number | Count |

### GA4 Data (1 Sheet)

#### Sheet: `Raw_GA4_Data`

Daily website metrics from Google Analytics 4.

| Column | Type | Description |
|--------|------|-------------|
| Date | Date | YYYY-MM-DD |
| Sessions | Number | Session count |
| Users | Number | Total users |
| Conversions | Number | Goal completions |
| BounceRate | Number | Decimal (0-1) |

### System Sheet

#### Sheet: `System_Logs`

Error and debug logging.

| Column | Type | Description |
|--------|------|-------------|
| Timestamp | DateTime | When the log was created |
| Level | String | INFO, WARN, ERROR |
| Source | String | Service/function name |
| Message | String | Log message |

## Google Ads Script Queries

### Campaign Query
```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.status,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversions,
  metrics.cost_per_conversion,
  metrics.search_impression_share
FROM campaign
WHERE segments.date DURING <DATE_RANGE>
ORDER BY metrics.cost_micros DESC
```

### Ad Group Query
```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  ad_group.status,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversions
FROM ad_group
WHERE segments.date DURING <DATE_RANGE>
ORDER BY metrics.cost_micros DESC
```

### Keyword Query
```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  ad_group_criterion.criterion_id,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.status,
  ad_group_criterion.quality_info.quality_score,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.average_cpc,
  metrics.conversions
FROM keyword_view
WHERE segments.date DURING <DATE_RANGE>
ORDER BY metrics.cost_micros DESC
```

### Search Term Query
```sql
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  ad_group.id,
  ad_group.name,
  segments.keyword.info.text,
  search_term_view.search_term,
  metrics.cost_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.ctr,
  metrics.conversions
FROM search_term_view
WHERE segments.date DURING <DATE_RANGE>
ORDER BY metrics.impressions DESC
```

## Implementation Strategy

1. **Clasp** for local development with Git version control
2. **Hybrid Data Model**: Google Ads internal script pushes to Sheets; GA4 pulls via API
3. **Historical Backfill**: One-time script to populate 2-3 years of historical data
4. **Mock Data Fallback**: Services support fallback to mock data if APIs are unavailable
5. **Incremental Deployment**: Daily script first, then backfill, then dashboard
