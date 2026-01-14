# Design Documentation: Keynote Marketing Dashboard

## 1. Executive Summary

The **Keynote Marketing Dashboard** is an internal reporting tool designed exclusively for the account owner (Allan Lund Hansen) to visualize marketing performance data. It aggregates data from Google Ads and Google Analytics 4 (GA4) into a unified dashboard to track Key Performance Indicators (KPIs) such as ad spend, conversions, and return on investment (ROI).

**Token Access Level Requested:** Basic Access
**Intended Use:** Internal reporting and analytics only.
**GLID/CLID Usage:** None. The tool does not use or store gclid/wbraid parameters.

## 2. Architecture Overview

The application is built on **Google Apps Script**, leveraging Google Sheets as a temporary database.

- **Platform:** Google Apps Script (Serverless) + Google Sheets.
- **Frontend:** Apps Script Web App (HTML/CSS/JS).
- **Backend:** Google Apps Script (triggers and data fetching).
- **Data Sources:**
  - Google Ads API (via REST/UrlFetchApp or AdsApp).
  - Google Analytics 4 Data API.

### High-Level Diagram

```mermaid
graph TD
    User[Authorized User (Owner)] -->|View Dashboard| WebApp[Apps Script Web App]
    WebApp -->|Fetch Aggregated Data| Sheet[Google Sheet (Database)]

    subgraph Data Ingestion [Daily Trigger]
        Script[Apps Script Worker] -->|READ ONLY| AdsAPI[Google Ads API]
        Script -->|READ ONLY| GA4API[GA4 Data API]
        Script -->|Write Rows| Sheet
    end
```

## 3. Data Flow & Functionality

### 3.1. Authentication

- **OAuth 2.0 Identity:** The application uses Google's standard OAuth flow.
- **Scopes Requested:**
  - `https://www.googleapis.com/auth/adwords` (Read campaign performance).
  - `https://www.googleapis.com/auth/userinfo.email` (Verify identity).

### 3.2. Data Retrieval (Read-Only)

The application performs a **read-only** fetch of campaign statistics. It **never** creates, modifies, or deletes campaigns, ad groups, or ads.

**Metrics Retrieved:**
The application retrieves standard performance metrics to visualize campaign effectiveness, including but not limited to:

- **Cost & Budget Metrics:** (e.g., Cost, Budget utilization, Cost per Conversion)
- **Engagement Metrics:** (e.g., Clicks, Impressions, CTR, Interaction Rate)
- **Conversion Metrics:** (e.g., Conversions, Conversion Value, ROAS)
- **Attribute Data:** (e.g., Campaign Name, ID, Status, Campaign Type)

This broad scope ensures the dashboard can evolve to show relevant KPIs without requiring re-verification for every new metric column.

### 3.3. Storage

Data is stored in a private Google Sheet accessible only to the account owner. Start/End dates are configurable. No Personally Identifiable Information (PII) is stored.

## 4. Security & Compliance

- **Data Minimization:** Only aggregated metrics (clicks, cost, impressions) are fetched. No user-level data is accessed.
- **Access Control:** The script is bound to the owner's account. No external users have access.
- **Privacy:** Data is never shared with third parties. It resides strictly within the user's Google Drive environment.
