# TwoLineLyrics (두줄자막)

Worship subtitle preparation tool for Korean churches.  
Core flow: **Search -> Song Detail -> Export (TXT / PNG / ProPresenter XML)**

## Tech Stack
- Next.js (App Router, TypeScript)
- TailwindCSS
- Supabase (PostgreSQL)
- Canvas (PNG generation)
- JavaScript XML builder (ProPresenter export)

## Project Structure
```txt
.
├─ app
│  ├─ api
│  │  ├─ search/route.ts
│  │  ├─ search-weight/route.ts
│  │  └─ songs
│  │     ├─ route.ts
│  │     └─ [id]/route.ts
│  ├─ admin
│  │  ├─ search-weight/page.tsx
│  │  └─ song-new/page.tsx
│  ├─ search/page.tsx
│  ├─ song/[id]/page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ SearchResultCard.tsx
│  ├─ SiteHeader.tsx
│  ├─ SlideBlock.tsx
│  └─ SongDetailClient.tsx
├─ lib
│  ├─ export
│  │  ├─ canvas.ts
│  │  ├─ download.ts
│  │  └─ pro7xml.ts
│  ├─ search-ranking.ts
│  └─ supabase
│     ├─ client.ts
│     ├─ config.ts
│     └─ server.ts
├─ scripts
│  └─ dev-reset.sh
├─ supabase
│  └─ schema.sql
└─ types
   └─ song.ts
```

## Local Run
1. Install dependencies
```bash
npm install
```

2. Set environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create DB schema in Supabase SQL Editor
```sql
-- paste contents of supabase/schema.sql
```

4. Run dev server (port fixed to `3010`)
```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010)

## Dev Commands
- `npm run dev`: reset stale dev state and start Next on port 3010
- `npm run dev:reset`: kill this repo's `next dev`, clear `.next`, print port status (3000-3015)
- `npm run dev:raw`: start Next on port 3010 without reset

### Troubleshooting: `TypeError: fetch failed` on Save Song
1. Restart dev server after editing `.env.local`.
2. Check Supabase env values are real project values (not placeholders).
3. Open health check:
   - [http://localhost:3010/api/health/supabase](http://localhost:3010/api/health/supabase)
4. If `ok: false`, review terminal logs from `npm run dev` for exact cause.

### Troubleshooting: `missing required error components, refreshing...`
1. Run reset and restart:
```bash
npm run dev:reset
npm run dev
```
2. Confirm key pages return 200:
   - [http://localhost:3010/](http://localhost:3010/)
   - [http://localhost:3010/search](http://localhost:3010/search)
   - [http://localhost:3010/admin/song-new](http://localhost:3010/admin/song-new)
3. Verify CSS bundle is reachable:
   - [http://localhost:3010/_next/static/css/app/layout.css](http://localhost:3010/_next/static/css/app/layout.css)
4. If you still see `500` with `Cannot find module './*.js'`, `.next` is stale/corrupted. Repeat reset.

## Implemented MVP Features

### 1) Search Engine
- Endpoint: `GET /api/search?q=...`
- Weighted ranking fields:
  - title exact: 100
  - title partial: 60
  - chorus first line: 55
  - verse1 first line: 45
  - lyrics full match: 20
  - two_line_units match: 15
- Fuzzy bonus:
  - used only for `suggestions` area
  - computed via Levenshtein distance in `lib/search-ranking.ts`

### 2) Song Detail Page
- Route: `/song/[id]`
- Displays all `two_line_units` as slide blocks
- Export buttons:
  - Download TXT
  - Download single PNG
  - Download all PNG as ZIP
  - Export ProPresenter XML

### 3) ProPresenter 7 XML Export
- Utility: `lib/export/pro7xml.ts`
- Options:
  - background: transparent / black / white
  - include title slide: boolean
- File format: `{title}_Pro7.xml`
- Each `two_line_units` entry -> one `<Slide>`
- Line break converted to `<br/>`

### 4) PNG Generator
- Utility: `lib/export/canvas.ts`
- Output: `1920x1080`
- Font: Pretendard
- Center align text
- Options:
  - font size (24-120)
  - line height (1.2-2.0)
  - vertical position (center/lower)
  - padding (5%-20%)
- File format: `{title}_001.png`

### 5) Admin Song Registration
- Route: `/admin/song-new`
- Required:
  - title
  - chorus_first_line
  - verse1_first_line
  - two_line_units
- Validation:
  - blank line separates slides
  - 2 lines recommended
  - 1 line allowed with warning
  - 3+ lines not allowed
- Preview required before save

### 6) Admin Search Weight
- Route: `/admin/search-weight`
- Loads/saves latest weight config in `search_weight_config`

## Notes
- MVP is desktop-first.
- No authentication is configured (as requested).
- For production, add auth + RLS policies before exposing admin routes publicly.
