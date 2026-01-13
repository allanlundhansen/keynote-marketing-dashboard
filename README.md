# Keynote Marketing Dashboard

Development setup for the Marketing Analytics Dashboard.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Login to Google (Grant access to Apps Script API):

   ```bash
   npm run login
   ```

3. Enable Google Apps Script API:

   - Go to [Apps Script Settings](https://script.google.com/home/usersettings)
   - Toggle "Google Apps Script API" to ON.

4. Create the project (or clone existing):

   ```bash
   # Create new
   npm run create

   # OR clone existing (update .clasp.json with scriptId)
   # npm run clone <scriptId> -- --rootDir ./src
   ```

5. Push code:
   ```bash
   npm run push
   ```

## Directory Structure

- `src/` - Server-side Apps Script code (.js/.ts)
- `html/` - Client-side templates (.html)
- `package.json` - MPM scripts and dependencies

## Resources

- [Implementation Plan](file:///Users/allan/.gemini/antigravity/brain/eb43f95c-57c8-4cc2-aed2-087b9c5a266a/implementation_plan.md)
