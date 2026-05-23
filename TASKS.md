# Framewise — Team Task Board

Last updated: 2026-05-23 (session 3)

## Ownership

| Area | Primary contributors | Notes |
|---|---|---|
| Product architecture | Ayse + Irem | Shared backend, web app, and extension architecture |
| Backend/API/AI | Ayse + Irem | Express, MongoDB models, Gemini, ElevenLabs, auth, search, progress, bookmarks, collections |
| Web app/UI/UX | Ayse | React flows, design system, library/video/settings UX, theme system |
| Chrome extension | Ayse + Irem | YouTube detection, side panel, timeline auto-load, caption injection, progress sync |
| QA/demo polish | Shared | End-to-end testing before review/demo |

Contribution note: Ayse has worked across frontend, backend, and extension implementation, especially on product flows, integration polish, visual system, library/search/bookmark/collection/progress behavior, and extension UX. This task board uses ownership as a planning aid, not as a strict boundary.

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

### Visual Design System (completed this sprint)
- [x] Full UI redesign — LibraryPage, VideoPage, SettingsPage, AnalyzePage (warm film-club "Screening Room" palette)
- [x] Framewise design tokens: `--fw-*` CSS variables, `.fw-light`/`.fw-dark` class-based theming
- [x] FramewiseMark logo integrated across web app and extension
- [x] Extension panel full visual redesign (ExtensionB dark theme with filmstrip header)
- [x] Extension icons regenerated from exact FramewiseMark SVG geometry

### Extension (completed this sprint)
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

### Backend / AI (optimized this sprint)
- [x] Gemini analysis concurrency raised to 5 parallel chunk requests
- [x] Topic chunk size reduced to 900s for more parallel processing
- [x] Retry base delay reduced from 2000ms → 800ms
- [x] Chat context capped: transcript 3000 chars, history 10 messages

---

## Pre-Review Checklist

Run through this before handing to teammate:

- [ ] `npm run install:all` at repo root (installs all three workspaces)
- [ ] Copy `backend/.env.example` → `backend/.env` and fill in all values
- [ ] Copy `frontend/.env.example` → `frontend/.env` and fill in VITE_GOOGLE_CLIENT_ID
- [ ] `npm run dev` starts backend on `3001` and frontend on `5174`
- [ ] `GET http://localhost:3001/api/health` returns ok
- [ ] Register a new test user
- [ ] Log in with that test user
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
- [ ] Test light theme and dark theme

---

## High Priority Fixes / Hardening

- [x] Add frontend loading and error states for every async tool action — all pages confirmed complete
- [x] Add user-visible failures for Gemini, YouTube transcript, ElevenLabs STT, and voice TTS — controllers all use next(err)
- [x] Add request timeout middleware for long AI calls — `timeout.js` wired: 180s analyze, 120s dance, 300s STT, 180s correct
- [x] Ensure all video-scoped backend endpoints verify `userId` — all controllers confirmed
- [x] Add backend validation for ObjectId params — `validateObjectId.js` wired to all parameterized routes
- [x] Add text-index sync/migration instructions for MongoDB Atlas — documented in `backend/.env.example`
- [x] Move `better-youtube-captions-main/` to `.archive/reference/` — runtime code was already adapted into `captionService.js` and extension caption injection
- [x] Move hardcoded extension URLs into a config file — `extension/src/config.js` with FW_API + FW_APP. When deploying, update `manifest.json` `host_permissions` to match those origins.
- [x] Fix CORS open-origins-in-production hole — now only open in development; requires ALLOWED_ORIGINS in production
- [x] Add `GOOGLE_CLIENT_SECRET` to `backend/.env.example` — was missing
- [x] Fix `getVoice` error handling — now calls `next(err)` properly instead of swallowing the error

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
- [ ] Add empty-state art or branded motion moments
- [x] Add toast notifications for saves, deletes, generated content, and errors
- [ ] Add keyboard shortcuts for chat submit, seek, and bookmark
- [ ] Add a command/search palette for videos and actions
- [ ] Improve mobile layout for VideoPage
- [x] Add real-time MoveNet pose tracker to VideoPage Practice section
- [x] Add collection management UI: rename, delete, remove video from collection
- [ ] Add per-video action menu on library cards (re-analyze, delete, add to collection)

### Adaptive Learning Modes

- [x] Persist `detectedMode`, `modeOverride`, `modeConfidence`, and `modeSignals` on videos
- [x] Add manual mode override API and VideoPage control
- [x] Use detected/override mode for Library Practice and Study Queue filtering
- [ ] Add Gemini-powered classifier that uses title, description, transcript, segments, and visual context
- [ ] Store richer classification evidence: transcript signals, visual signals, interaction signals, and confidence notes
- [x] Adapt VideoPage default tab order by effective mode
- [x] Adapt extension tab priority by effective mode
- [ ] Add contextual onboarding: "This looks like a dance practice video" / "This looks like a study video"
- [ ] Add user feedback buttons to improve classifier quality
- [ ] Add mode-specific recommendation engine for next best actions
- [ ] Persist user interaction patterns for adaptive recommendations
- [ ] Add mode-aware visual treatments while preserving Screening Room theme

### Dance Practice System

- [x] Basic dance segment generation
- [x] Web webcam pose tracking with MoveNet
- [ ] Generate motion-aware choreography segments using movement changes, music transitions, choreography sections, pose/action shifts, rhythm shifts, repeated practice sections, and camera changes
- [ ] Normalize dance timeline labels: Intro, Chorus Practice, Footwork Section, Hand Movements, Transition Sequence, Full-Speed Run, Outro
- [x] Loop selected timestamp ranges
- [x] Slow-motion playback controls / speed presets
- [x] Mirror mode
- [ ] Countdown replay before loop restarts
- [ ] Section repetition counter and practice session tracking
- [ ] Favorite choreography saves
- [ ] Practice history per video and per segment
- [ ] Compare webcam pose against source choreography keyframes
- [ ] Calculate timing similarity and movement accuracy
- [ ] Add visual feedback overlays for lagging or mistimed actions
- [ ] Track long-term improvement per dance segment
- [ ] Add pose heatmaps and skeletal ghost overlays as future experiments
- [ ] Add movement replay comparison as future experiment
- [ ] Extend dance chat actions: replay chorus slowly, show hand movement part, identify hardest section, loop transition at timestamp
- [ ] Add optional voice-controlled dance commands

### Study Queue System

- [x] Topic timeline, transcript, notes, bookmarks, quiz, and chat
- [x] Chapter-style timestamps / topic breakdowns
- [x] AI-generated notes
- [x] Quiz generation
- [x] Bookmarks
- [ ] Generate concept hierarchy and prerequisite hints
- [ ] Add learning difficulty estimation per segment
- [ ] Merge captions + transcript into one searchable transcript model
- [ ] Add highlights and flashcards
- [ ] Add exportable study packs
- [ ] Add study sessions and spaced repetition plan
- [ ] Generate structured learning points and key takeaways per chapter
- [ ] Add smart summaries per section and whole video
- [ ] Add flashcard creation from selected timestamp range
- [ ] Highlight important moments and save them as study markers
- [ ] Save study sessions with progress, quiz results, and reviewed timestamps
- [ ] Export notes, bookmarks, transcript excerpts, quiz questions, and flashcards as a study pack
- [ ] Extend study chat actions: summarize lecture, explain concept at timestamp, quiz this section, generate flashcards, list key takeaways

### Shared Mode Features

- [x] AI-powered contextual chat
- [x] Timestamp-aware interactions
- [x] Bookmarks
- [x] Persistent session memory through MongoDB videos/chat/notes/bookmarks/progress
- [ ] Unified searchable transcript system across captions, imported transcripts, and Gemini transcript output
- [ ] Timestamp indexing for transcript chunks, captions, notes, highlights, bookmarks, and chat references
- [ ] Smart recommendations based on detected mode and recent interactions
- [ ] Toast notifications for saved actions and AI-generated outputs
- [ ] Keyboard shortcuts for seek, bookmark, chat, loop, and mode-specific actions
- [ ] Command palette for video actions and AI commands

### AI Assistant Expectations

- [x] Chat receives transcript, segment metadata, history, user message, and selected mode
- [ ] Add intent parser for playback actions, loop commands, quiz commands, flashcard commands, and summary commands
- [ ] Return structured assistant actions with payloads: seek, loop, setSpeed, openTab, generateQuiz, generateFlashcards, addBookmark
- [ ] Keep long conversation context compact with summary memory
- [ ] Reference timestamps and transcript context accurately
- [ ] Adapt tone and tools differently for Dance Practice vs Study Queue
- [ ] Generate structured outputs dynamically based on video type

### Settings

- [x] Add theme toggle
- [x] Add settings tabs (Profile / Preferences / Learning / Extension)
- [x] Add learning preference controls (voice, auto-resume, density)
- [x] Wire settings preferences into VideoPage defaults (voice reply default from localStorage)
- [x] Add account deletion/sign-out confirmation flow
- [ ] Add real extension connection status (replace placeholder "connected" state)
- [x] Add API health/status indicator

---

## Backend / AI Next Tasks

### Stability

- [ ] Add centralized request validation (Joi or Zod)
- [ ] Add centralized async error wrapper (eliminate per-controller try/catch boilerplate)
- [x] Add rate limiting for AI endpoints — in-process rate limiter, 5 req/min/user on analyze, dance, captions, quiz
- [ ] Add response-size guardrails for captions/transcripts
- [ ] Add structured logging for analysis jobs (replace `console.log`)
- [x] Add retry/backoff for Gemini calls — done, further optimized this sprint

### Job Queue

- [x] In-memory job queue (no Redis required) — `backend/src/queue/jobQueue.js`
- [x] Move `/api/videos/analyze` into an async job — returns `{ jobId }`, processes with `setImmediate`
- [ ] Move dance analysis into an async job
- [ ] Move captions/STT into an async job
- [x] Add job status endpoint — `GET /api/jobs/:jobId` (`backend/src/routes/jobRoutes.js`)
- [x] Add frontend polling/progress UI on AnalyzePage — polls every 2s, progress bar + rotating status

### Data Model

- [ ] Add unique index strategy for user/video URL normalization
- [x] Add collection rename endpoint — `PATCH /api/collections/:collectionId`
- [ ] Add collection video ordering
- [x] Add bookmark update/rename endpoint — `PATCH /api/videos/:videoId/bookmarks/:bookmarkId`
- [x] Add caption edit/save endpoint from web app — `PUT /api/videos/:videoId/captions`
- [x] Add transcript import endpoint — `POST /api/videos/:videoId/transcript`
- [x] Add account delete endpoint — `DELETE /api/auth/me` (cascades all user data)
- [x] Add video mode fields for adaptive Study Queue / Dance Practice behavior
- [ ] Add source description metadata for better classification
- [ ] Add user interaction events for adaptive recommendations

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
- [ ] Show dynamic suggested actions based on active video type

### Infrastructure
- [x] Move hardcoded `localhost` URLs to `extension/src/config.js`
- [ ] Add production API URL config workflow (build-time env or release-specific config)
- [ ] Add caption timing calibration control (offset slider if captions drift)
- [ ] Support embedded video player research path beyond YouTube
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
- [ ] Analyze URL (confirm faster response with new concurrency settings)
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

The web app should call backend through `frontend/src/services/api.js`.

| Endpoint | Method | Purpose |
|---|---:|---|
| `/api/auth/register` | POST | Email registration |
| `/api/auth/login` | POST | Email login |
| `/api/auth/google` | POST | Google OAuth login |
| `/api/auth/me` | GET | Current user |
| `/api/auth/me` | PUT | Update profile |
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
| `/api/auth/me` | DELETE | Delete account and all data |

---

## Moving Forward Path

### Milestone 1: Review-Ready MVP ← current focus

- [x] All pages visually redesigned and consistent
- [x] Extension panel redesigned and feature-complete
- [x] Gemini analysis speed optimized
- [ ] Finish smoke test checklist end-to-end
- [ ] Fix demo blockers (loading states, error messages)
- [ ] Tighten README and `.env.example` files
- [ ] Confirm extension works on three or four real YouTube videos
- [ ] Confirm light/dark theme consistency across all pages

### Milestone 2: Reliability

- [x] Add job queue for async AI work (in-memory, no Redis)
- [x] Add robust loading/error states across all async actions
- [ ] Add endpoint validation and test coverage
- [x] Make extension URLs configurable (not hardcoded localhost)
- [x] Add request timeouts for Gemini/ElevenLabs

### Milestone 3: Product Depth

- [ ] Extension bookmark + note buttons that write to backend
- [ ] Adaptive mode classifier and adaptive extension/web UI
- [ ] Dance movement scoring and practice history
- [ ] Study packs, flashcards, and spaced repetition
- [ ] Upload video support (non-YouTube)
- [ ] Caption editor in web app
- [ ] Share/export study packs
- [ ] Better collection management (rename, reorder, cover image)
- [ ] Public/shared video pages

### Milestone 4: Launch Track

- [ ] Deploy backend and frontend
- [ ] Create production extension config and build
- [ ] Add privacy policy and data deletion flow
- [ ] Chrome Web Store submission
- [ ] Demo video and onboarding flow
