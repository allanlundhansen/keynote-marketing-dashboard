# Phase 1: Foundation (MVP) Requirements

## Overview

This phase establishes the core infrastructure for connecting to Google Ads and GA4 APIs, storing the raw data in Google Sheets, and providing a basic "Proof of Life" dashboard to verify the pipeline works.

## Functional Requirements

### 1. Data Integration (Backend)

- [ ] System must authenticate with Google Ads API using a configured Customer ID.
- [ ] System must authenticate with GA4 Data API using a configured Property ID.
- [ ] System must be able to fetch daily campaign performance metrics (Cost, Clicks, Impressions, Conversions).
- [ ] System must be able to fetch daily session metrics (Sessions, Users, Events).
- [ ] API keys/IDs must be stored in a centralized configuration file (`Config.gs`).

### 2. Data Storage (Sheets)

- [ ] System must automatically create required sheets if they do not exist:
  - `Raw_Ads_Data`
  - `Raw_GA4_Data`
- [ ] New data fetches should append rows to these sheets (not overwrite history).
- [ ] Data MUST include a "Date" column to facilitate future historical analysis.

### 3. Basic Dashboard (Frontend)

- [ ] A clean Web App (HTML) served via Apps Script.
- [ ] Display **Total Spend** (Last 30 days).
- [ ] Display **Total Sessions** (Last 30 days).
- [ ] Display **Total Conversions** (Last 30 days).
- [ ] Display a simple list of active campaigns and their spend.

## Non-Functional Requirements

- **Performance**: Dashboard load time should be under 3 seconds for basic view.
- **Reliability**: Failures in API fetching should be logged to the execution transcript (Logger).
- **Security**: No hardcoded secrets (API tokens) in the codebase (use script properties if needed, though Apps Script manages OAuth automatically).

## Acceptance Criteria

- [ ] Running `refreshData()` populates `Raw_Ads_Data` and `Raw_GA4_Data` with mock or real data rows.
- [ ] Opening the Web App URL shows the dashboard with numbers > 0.
- [ ] The `Config` object controls the target IDs.
