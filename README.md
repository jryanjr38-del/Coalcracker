# Coalcracker league site

Static site. No build step, no server, no database.

## Files
- `index.html` — page structure
- `styles.css` — all styling
- `app.js` — renders history + pulls live data from Sleeper's public API
- `data/history.json` — the full league history, 1999–2025 (generated; see Sources below)
- `data/writeups.json` — the write-ups. **This is the file you edit most.**

## Deploy
Drag this whole folder (or the .zip) onto https://app.netlify.com/drop — you get a public URL
immediately. To update later, drag the folder again onto the same site's Deploys tab.

## Adding a write-up
Open `data/writeups.json` and add a new object to the TOP of the `posts` array:

```json
{
  "id": "2026-wk3-recap",
  "season": "2026",
  "week": 3,
  "date": "2026-09-28",
  "kicker": "Week 3 Recap",
  "title": "Your headline here",
  "author": "Commissioner",
  "body": ["First paragraph. Use **double asterisks** for bold.", "Second paragraph."]
}
```

Commas between entries, no trailing comma after the last one. Re-drag the folder to publish.

## What updates by itself
The "This Season" section reads Sleeper live on every page load — standings, current-week
matchups and scores, and team/owner names. Nothing to redeploy during the season.

History, records and write-ups are stored in `data/` and change only when the files change.

## Sources
- **1999–2022** comes from the Google Sheet "Fantasy Football History": career franchise
  records, every champion and toilet bowl winner, and the league's own record book.
- **2023–2025** comes from the Sleeper API and was verified game by game against the
  official standings. Where the sheet and Sleeper describe the same season, the Sleeper
  figure is used, so every number on the site follows one convention.
- The record book merges both. Season records (wins, win %, streaks, points) are one row
  per franchise-season; per-game records can list the same team twice in a year.
- Winning streaks include playoff wins; weekly-high-score counts are regular season only.

## League IDs (Sleeper)
2026 `1376601105869332480` · 2025 `1188254571799662592` · 2024 `1115411427944288256` · 2023 `974068404908867584`

To point the live section at a new season, change `LEAGUE_ID` at the top of `app.js`.
