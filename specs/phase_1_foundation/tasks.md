# Phase 1: Foundation (MVP) Tasks

## Setup & Config

- [x] Initialize project structure (clasp, git).
- [x] Create centralized `Config.gs`.
- [ ] **Pending**: Validate API access with real credentials (manual step for user).

## Backend Implementation

- [x] Implement `AdsService.getCampaignReport()` with real API call logic (UrlFetch or AdsApp).
- [x] Implement `AnalyticsService.getBasicReport()` with proper payload construction.
- [x] Implement `SheetManager.setupSheets()` to ensure schema exists.
- [x] Create orchestration function `refreshData()` in `Code.js`.

## Frontend Implementation

- [ ] Create `index.html` skeleton.
- [ ] Add CSS styling for cards and grid layout.
- [ ] Implement `google.script.run.getDashboardData()` connector.
- [ ] Add client-side rendering logic (JS) to populate numbers.

## Verification

- [ ] Run `refreshData()` manually and verify rows appear in Sheets.
- [ ] Deploy Web App as "Test Deployment" and verify UI loads.
- [ ] Commit and Push to GitHub.
