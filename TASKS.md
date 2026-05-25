# Framewise — Team Task Board

Last updated: 2026-05-24 (session 4)

## Ownership

| Area | Primary contributors | Notes |
|---|---|---|
| Product architecture | Ayse + Irem | Shared backend, web app, and extension architecture |
| Backend/API/AI | Ayse + Irem | Express, MongoDB models, Gemini, ElevenLabs, auth, search, progress, bookmarks, collections |
| Web app/UI/UX | Ayse | React flows, design system, library/video/settings UX, theme system |
| Chrome extension | Ayse + Irem | YouTube detection, side panel, timeline auto-load, caption injection, progress sync |
| QA/demo polish | Shared | End-to-end testing before review/demo |

Contribution note: Ayse has worked across frontend, backend, and extension implementation, especially on product flows, integration polish, visual system, library/search/bookmark/collection/progress behavior, extension UX, and pose tracking. This task board uses ownership as a planning aid, not as a strict boundary.

## Current Working Product

### Core
- [x] Shared backend for web app and Chrome extension
- [x] MongoDB models for users, videos, segments, chat, captions, notes, bookmarks, collections
- [x] JWT auth with email/password
- [x] Google OAuth path
- [x] YouTube URL analysis with Gemini
- [x] Segment timeline stored in MongoDB
- [x] Library search across titles and segment summaries
- [x] Collections/folders
- [x] Continue watching progress
- [x] Video detail page with YouTube player
- [x] Chat with video
- [x] Timestamp seeking from segments/chat/quiz/captions
- [x] ElevenLabs voice response endpoint
- [x] Notes and AI-generated notes
- [x] Bookmarks
- [x] Quiz generation
- [x] Dance/practice mode
- [x] Real-time webcam pose tracking in web Practice tab with MoveNet
- [x] Adaptive video mode foundation: detected mode + manual override (`auto` / `study` / `dance`)
- [x] YouTube captions generation
- [x] ElevenLabs audio transcription fallback
- [x] Caption translation
- [x] Dark/light theme system

### Visual Design System
- [x] Full UI redesign — LibraryPage, VideoPage, SettingsPage, AnalyzePage (warm film-club "Screening Room" palette)
- [x] Framewise design tokens: `--fw-*` CSS variables, `.fw-light`/`.fw-dark` class-based theming
- [x] FramewiseMark logo integrated across web app and extension
- [x] Extension panel full visual redesign (ExtensionB dark theme with filmstrip header)
- [x] Extension icons regenerated from exact FramewiseMark SVG geometry

### Web App / Frontend
- [x] LandingPage logged-in user chip with sign-out (auth-aware nav)
- [x] Extension setup guide at `/extension` — public page, no auth required
- [x] Route added for `/extension` in App.jsx

### Extension (completed)
- [x] Extension side panel
- [x] Extension timeline auto-load for analyzed videos
- [x] Extension caption injection timed to video playback
- [x] Tab order: Timeline → Chat → Captions → Dance
- [x] Voice replies opt-in (unchecked by default, persisted in localStorage)
- [x] Timeline search/filter — live filter by segment title or summary
- [x] Speed controls in Timeline tab (0.5× / 0.75× / 1× / 1.25× / 1.5× / 2×)
- [x] Active segment auto-highlight and scroll (polls video time every 2s)
- [x] Copy timestamp link per segment (copies YouTube URL with `&t=` parameter)
- [x] Chat suggestion chips — Summarize / Key points / Quiz me / Intro
- [x] Rotating analysis status messages during Gemini processing
- [x] Extension chat: typing indicator, error display, markdown rendering, mode-aware requests
- [x] Extension Practice tab: live webcam pose tracking with MoveNet SINGLEPOSE_LIGHTNING
  - Green skeleton overlay drawn on canvas via WebGL/WASM backend
  - 10 FPS RAF loop (lightweight during YouTube playback)
  - Keypoint count pill with live status
- [x] Extension auto pose snaps at dance segment transitions
  - Fires when active segment index changes (2s delay, 8s cooldown)
  - Quality scoring — Great / Good / Ok / Low — rendered as colored bar review cards

### Backend / AI
- [x] Gemini analysis concurrency raised to 3 parallel chunk requests (GEMINI_CHUNK_CONCURRENCY)
- [x] Gemini RPM gate raised to 14 requests/min (GEMINI_RPM)
- [x] Per-user AI rate limit raised to 15 req/min (was 5)
- [x] Retry base delay reduced from 2000ms → 800ms
- [x] Chat context capped: transcript 3000 chars, history 10 messages
- [x] Gemini fetch error retry — `withRetry` now retries `TypeError`/fetch-failed/ECONNRESET/ETIMEDOUT with same backoff as 503
- [x] Server-level fetch error handler — maps network-level Gemini errors to clean 503 response

---

## Pre-Review Checklist

Run through this before handing to teammate:

- [ ] `npm run install:all` at repo root (installs all three workspaces)
- [ ] Copy `backend/.env.example` → `backend/.env` and fill in all values
- [ ] Copy `frontend/.env.example` → `frontend/.env` and fill in VITE_GOOGLE_CLIENT_ID
- [ ] `npm run dev` starts backend on `3001` and frontend on `5174`
- [ ] `GET http://localhost:3001/api/health` returns ok
- [ ] Register a new test user
- [ ] Log in with that test user — confirm user chip appears in LandingPage nav with sign-out
- [ ] Visit `/extension` — confirm setup guide page loads (no auth required)
- [ ] Analyze a fresh YouTube URL
- [ ] Re-open that analyzed URL — confirm cached load works
- [ ] Search library by video title
- [ ] Search library by a segment summary phrase
- [ ] Create a collection and add a video
- [ ] Filter library by collection
- [ ] Open a video and seek through timeline segments
- [ ] Ask chat a timestamp-specific question
- [ ] Confirm voice reply works when ElevenLabs key is configured
- [ ] Add a note; generate AI notes
- [ ] Add a bookmark
- [ ] Generate a quiz
- [ ] Generate captions; toggle subtitle translation
- [ ] Open Practice tab and start/stop webcam pose tracking
- [ ] Override a video between Auto / Study Queue / Dance Practice and confirm UI adapts
- [ ] Confirm continue watching updates after playback
- [ ] Load the extension unpacked in Chrome
- [ ] Sign in on web app, then open YouTube
- [ ] Extension detects current video
- [ ] Extension auto-loads saved timeline for already analyzed videos
- [ ] Extension: search timeline, change speed, copy timestamp, use chat chip
- [ ] Extension: voice replies off by default; turn on and confirm TTS plays
- [ ] Extension can inject captions timed to playback
- [ ] Extension Dance tab: enable webcam, confirm skeleton appears and keypoint pill updates
- [ ] Extension Dance tab: seek through dance segments, confirm review cards appear automatically
- [ ] Test light theme and dark theme

---

## High Priority Fixes / Hardening

- [x] Add frontend loading and error states for every async tool action — all pages confirmed complete
- [x] Add user-visible failures for Gemini, YouTube transcript, ElevenLabs STT, and voice TTS
- [x] Add request timeout middleware for long AI calls — `timeout.js` wired: 180s analyze, 120s dance, 300s STT, 180s correct
- [x] Ensure all video-scoped backend endpoints verify `userId`
- [x] Add backend validation for ObjectId params — `validateObjectId.js` wired to all parameterized routes
- [x] Add text-index sync/migration instructions for MongoDB Atlas — documented in `backend/.env.example`
- [x] Move `better-youtube-captions-main/` to `.archive/reference/`
- [x] Move hardcoded extension URLs into a config file — `extension/src/config.js` with FW_API + FW_APP
- [x] Fix CORS open-origins-in-production hole
- [x] Add `GOOGLE_CLIENT_SECRET` to `backend/.env.example`
- [x] Fix `getVoice` error handling

---

## Frontend / UX Next Tasks

### Component Cleanup

- [ ] Extract `VideoPlayer.jsx`
- [ ] Extract `VideoFeatureSelector.jsx`
- [ ] Extract `TimelinePanel.jsx`
- [ ] Extract `ChatPanel.jsx`
- [ ] Extract `CaptionsPanel.jsx`
- [ ] Extract `NotesPanel.jsx`
- [ ] Extract `BookmarksPanel.jsx`
- [ ] Extract `QuizPanel.jsx`
- [ ] Extract `DancePanel.jsx`
- [ ] Extract shared `Button`, `Input`, `Panel`, `EmptyState`, and `Toggle` components

### Product Polish

- [x] Add route/page loading states (skeleton cards in Library, skeleton segments on VideoPage)
- [x] Add toast notifications for saves, deletes, generated content, and errors
- [x] Add real-time MoveNet pose tracker to VideoPage Practice section
- [x] Add collection management UI: rename, delete, remove video from collection
- [ ] Add empty-state art or branded motion moments
- [ ] Add keyboard shortcuts for chat submit, seek, and bookmark
- [ ] Add a command/search palette for videos and actions
- [ ] Improve mobile layout for VideoPage
- [ ] Add per-video action menu on library cards (re-analyze, delete, add to collection)

### Adaptive Learning Modes

- [x] Persist `detectedMode`, `modeOverride`, `modeConfidence`, and `modeSignals` on videos
- [x] Add manual mode override API and VideoPage control
- [x] Use detected/override mode for Library Practice and Study Queue filtering
- [x] Adapt VideoPage default tab order by effective mode
- [x] Adapt extension tab priority by effective mode
- [ ] Add Gemini-powered classifier that uses title, description, transcript, segments, and visual context
- [ ] Add contextual onboarding: "This looks like a dance practice video" / "This looks like a study video"
- [ ] Add user feedback buttons to improve classifier quality
- [ ] Add mode-specific recommendation engine for next best actions
- [ ] Persist user interaction patterns for adaptive recommendations

### Dance Practice System

- [x] Basic dance segment generation
- [x] Web webcam pose tracking with MoveNet
- [x] Loop selected timestamp ranges
- [x] Slow-motion playback controls / speed presets
- [x] Mirror mode (independent Mirror Me + Mirror Video controls)
- [x] Dancer pose tracking (orange skeleton via getDisplayMedia screen capture)
- [ ] Generate motion-aware choreography segments using movement changes, music transitions, and pose/action shifts
- [ ] Normalize dance timeline labels: Intro, Chorus Practice, Footwork Section, Hand Movements, Transition Sequence, Full-Speed Run, Outro
- [ ] Countdown replay before loop restarts
- [ ] Section repetition counter and practice session tracking
- [ ] Compare webcam pose against source choreography keyframes
- [ ] Track long-term improvement per dance segment

### Study Queue System

- [x] Topic timeline, transcript, notes, bookmarks, quiz, and chat
- [x] Chapter-style timestamps / topic breakdowns
- [x] AI-generated notes
- [x] Quiz generation
- [x] Bookmarks
- [ ] Generate concept hierarchy and prerequisite hints
- [ ] Merge captions + transcript into one searchable transcript model
- [ ] Add highlights and flashcards
- [ ] Add exportable study packs
- [ ] Add study sessions and spaced repetition plan

### Settings

- [x] Add theme toggle
- [x] Add settings tabs (Profile / Preferences / Learning / Extension)
- [x] Add learning preference controls (voice, auto-resume, density)
- [x] Wire settings preferences into VideoPage defaults
- [x] Add account deletion/sign-out confirmation flow
- [x] Add API health/status indicator
- [ ] Add real extension connection status (replace placeholder "connected" state)

---

## Backend / AI Next Tasks

### Stability

- [x] Add rate limiting for AI endpoints — 15 req/min/user on analyze, dance, captions, quiz
- [x] Add retry/backoff for Gemini calls — retries 429, 503, and network-level fetch errors
- [ ] Add centralized request validation (Joi or Zod)
- [ ] Add centralized async error wrapper (eliminate per-controller try/catch boilerplate)
- [ ] Add response-size guardrails for captions/transcripts
- [ ] Add structured logging for analysis jobs (replace `console.log`)

### Job Queue

- [x] In-memory job queue (no Redis required) — `backend/src/queue/jobQueue.js`
- [x] Move `/api/videos/analyze` into an async job — returns `{ jobId }`, processes with `setImmediate`
- [x] Add job status endpoint — `GET /api/jobs/:jobId`
- [x] Add frontend polling/progress UI on AnalyzePage — polls every 2s, progress bar + rotating status
- [ ] Move dance analysis into an async job
- [ ] Move captions/STT into an async job

### Data Model

- [x] Add collection rename endpoint — `PATCH /api/collections/:collectionId`
- [x] Add bookmark update/rename endpoint — `PATCH /api/videos/:videoId/bookmarks/:bookmarkId`
- [x] Add caption edit/save endpoint from web app — `PUT /api/videos/:videoId/captions`
- [x] Add transcript import endpoint — `POST /api/videos/:videoId/transcript`
- [x] Add account delete endpoint — `DELETE /api/auth/me` (cascades all user data)
- [x] Add video mode fields for adaptive Study Queue / Dance Practice behavior
- [ ] Add unique index strategy for user/video URL normalization
- [ ] Add collection video ordering
- [ ] Add source description metadata for better classification

---

## Chrome Extension Next Tasks

### Immediate
- [x] Add extension-side bookmark button — save current timestamp to backend as a Bookmark
- [x] Add extension-side note button — save quick text note at current timestamp to backend
- [x] Add "Open in Framewise" deep link — button that opens `/app/video/:videoId` in a new tab
- [ ] Wire extension voice preference to backend (currently localStorage-only)
- [ ] Read `detectedMode` / `modeOverride` from lookup response and adapt initial tab
- [ ] For dance videos, prioritize Timeline, Practice, Dance tools, loop, mirror, and speed controls
- [ ] For study videos, prioritize Notes, Transcript, Quiz, bookmarks, and study chat chips

### Infrastructure
- [x] Move hardcoded `localhost` URLs to `extension/src/config.js`
- [ ] Add production API URL config workflow (build-time env or release-specific config)
- [ ] Add caption timing calibration control (offset slider if captions drift)
- [ ] Keep sidebar/overlay performance smooth during active playback

### Future
- [ ] Add multi-site support research: Vimeo, Coursera, Udemy
- [ ] Prepare Chrome Web Store checklist (icons, description, privacy policy URL, store screenshots)
- [ ] Add extension onboarding/first-run screen

---

## Testing Plan

### Manual Smoke Tests

- [ ] Auth register/login/logout
- [ ] Google OAuth
- [ ] Analyze URL (confirm faster response with current concurrency settings)
- [ ] Cached analyze result
- [ ] Library search
- [ ] Collections CRUD
- [ ] Video timeline seek
- [ ] Chat + voice reply
- [ ] Notes / AI notes
- [ ] Bookmarks
- [ ] Quiz
- [ ] Dance
- [ ] Web Practice tab pose tracking: webcam permission, skeleton overlay, stop cleanup
- [ ] Adaptive mode override: Auto / Study Queue / Dance Practice
- [ ] Captions — YouTube native
- [ ] Captions — ElevenLabs STT fallback
- [ ] Caption translation
- [ ] Continue watching
- [ ] Extension detection
- [ ] Extension auto-load
- [ ] Extension timeline search
- [ ] Extension speed controls
- [ ] Extension copy timestamp
- [ ] Extension chat chips
- [ ] Extension voice opt-in toggle
- [ ] Extension caption injection
- [ ] Extension Dance tab: webcam → skeleton → keypoint pill
- [ ] Extension Dance tab: segment change → pose snap → review card
- [ ] Theme toggle (web + extension)

### Automated Tests To Add

- [ ] Backend auth controller tests
- [ ] Backend video ownership tests
- [ ] Backend search endpoint tests
- [ ] Backend bookmark endpoint tests
- [ ] Backend collection endpoint tests
- [ ] Backend progress endpoint tests
- [ ] Frontend smoke render tests
- [ ] Extension utility tests for URL normalization/progress payloads

---

## API Contract Reference

| Endpoint | Method | Purpose |
|---|---:|---|
| `/api/auth/register` | POST | Email registration |
| `/api/auth/login` | POST | Email login |
| `/api/auth/google` | POST | Google OAuth login |
| `/api/auth/me` | GET | Current user |
| `/api/auth/me` | PUT | Update profile |
| `/api/auth/me` | DELETE | Delete account and all data |
| `/api/videos/analyze` | POST | Analyze YouTube URL |
| `/api/videos/search` | GET | Library search |
| `/api/videos/lookup` | GET | Extension cached lookup by URL |
| `/api/videos` | GET | List library videos |
| `/api/videos/:videoId` | GET | Get one video |
| `/api/videos/:videoId/mode` | PATCH | Set manual mode override |
| `/api/videos/:videoId/segments` | GET | Topic/dance segments |
| `/api/videos/:videoId/progress` | PATCH | Continue watching |
| `/api/videos/:videoId/dance` | POST | Dance analysis |
| `/api/videos/:videoId/quiz` | POST | Quiz generation |
| `/api/chat/:videoId/message` | POST | Chat with video |
| `/api/chat/:videoId/history` | GET | Chat history |
| `/api/chat/:videoId/voice` | POST | ElevenLabs TTS |
| `/api/videos/:videoId/captions` | GET | Captions |
| `/api/videos/:videoId/captions` | PUT | Bulk save edited captions |
| `/api/videos/:videoId/captions/generate` | POST | YouTube transcript captions |
| `/api/videos/:videoId/captions/generate-audio` | POST | ElevenLabs STT captions |
| `/api/videos/:videoId/captions/correct` | POST | Gemini caption correction |
| `/api/videos/:videoId/captions/translate` | POST | Caption translation |
| `/api/videos/:videoId/transcript` | POST | Import raw transcript |
| `/api/videos/:videoId/notes` | GET/POST | Notes |
| `/api/videos/:videoId/notes/generate` | POST | AI notes |
| `/api/videos/:videoId/bookmarks` | GET/POST | Bookmarks |
| `/api/videos/:videoId/bookmarks/:bookmarkId` | PATCH | Rename bookmark |
| `/api/collections` | GET/POST | Collections |
| `/api/collections/:collectionId` | PATCH | Rename collection |
| `/api/collections/:collectionId/videos` | POST | Add video to collection |
| `/api/collections/:collectionId/videos/:videoId` | DELETE | Remove video from collection |
| `/api/jobs/:jobId` | GET | Poll async job status |

---

## Moving Forward Path

### Milestone 1: Review-Ready MVP ← current focus

- [x] All pages visually redesigned and consistent
- [x] Extension panel redesigned and feature-complete
- [x] Gemini analysis speed optimized
- [x] Extension pose tracking (webcam + auto pose snaps)
- [x] Extension setup guide at `/extension`
- [ ] Finish smoke test checklist end-to-end
- [ ] Confirm extension works on three or four real YouTube videos
- [ ] Confirm light/dark theme consistency across all pages

### Milestone 2: Reliability

- [x] Add job queue for async AI work (in-memory, no Redis)
- [x] Add robust loading/error states across all async actions
- [x] Make extension URLs configurable (not hardcoded localhost)
- [x] Add request timeouts for Gemini/ElevenLabs
- [x] Gemini fetch error retry + clean 503 fallback
- [ ] Add endpoint validation and test coverage

### Milestone 3: Product Depth

- [ ] Adaptive mode classifier and adaptive extension/web UI
- [ ] Dance movement scoring and practice history
- [ ] Study packs, flashcards, and spaced repetition
- [ ] Upload video support (non-YouTube)
- [ ] Share/export study packs
- [ ] Public/shared video pages

### Milestone 4: Launch Track

- [ ] Deploy backend and frontend
- [ ] Create production extension config and build
- [ ] Add privacy policy and data deletion flow
- [ ] Chrome Web Store submission
- [ ] Demo video and onboarding flow
