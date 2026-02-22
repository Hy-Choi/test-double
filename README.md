# TwoLineLyrics (두줄자막)

Worship subtitle preparation tool for Korean churches.  
Core flow: **Search -> Song Detail -> Export (TXT / PNG / ProPresenter XML)**

## Tech Stack
- Next.js (App Router, TypeScript, static export)
- TailwindCSS
- Local TXT source files (`data/lyrics/*.txt`)
- Canvas (PNG generation)
- JavaScript XML builder (ProPresenter export)

## Static Data Flow
1. Add or edit lyric files in `data/lyrics`
2. Run `npm run songs:sync` (or just `npm run build`, because `prebuild` runs sync)
3. Generated data is written to `public/data/songs.json`
4. App reads `songs.json` for search/detail pages

## Lyrics File Rules
- Path: `data/lyrics`
- Filename format: `아티스트_곡제목.txt` (split at first `_`)
- Slide split rule: blank line
- Each slide must have 1-2 non-empty lines

Example:
```txt
이곳에 오셔서
이곳에 앉으소서

주님만 예배하리
주님만 찬양하리
```

## Project Structure
```txt
.
├─ app
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
│  ├─ SongDetailClient.tsx
│  └─ theme/ThemeToggleButton.tsx
├─ data
│  └─ lyrics
│     └─ *.txt
├─ public
│  └─ data
│     └─ songs.json (generated)
├─ lib
│  ├─ export
│  │  ├─ canvas.ts
│  │  ├─ download.ts
│  │  └─ pro7xml.ts
│  ├─ search-ranking.ts
│  └─ song-meta.ts
├─ scripts
│  ├─ dev-reset.sh
│  └─ generate-static-songs.mjs
└─ types
   └─ song.ts
```

## Local Run
1. Install dependencies
```bash
npm install
```

2. Sync lyric files into static JSON
```bash
npm run songs:sync
```

3. Start dev server (port fixed to `3010`)
```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010)

## Build / Deploy
```bash
npm run build
```
- `prebuild` automatically runs `songs:sync`
- static export output directory: `out/`
- upload `out/` to S3 (or any static hosting)

## Available Commands
- `npm run songs:sync`: generate `public/data/songs.json` from `data/lyrics/*.txt`
- `npm run dev`: reset stale state and run Next dev on port 3010
- `npm run dev:raw`: run Next dev on port 3010 without reset
- `npm run dev:reset`: kill local next dev for this repo and clean `.next`
- `npm run build`: static production build (`next build` + export)

## Notes
- `/song` provides a full song list, so you do not need to know `song-id` manually.
- `/admin/song-new` and `/admin/search-weight` are operation guide pages in static mode.
- Search weights are controlled in `lib/search-ranking.ts` (`DEFAULT_WEIGHTS`).
- No database or server API is required.
