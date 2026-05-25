<p align="center">
  <img src="extension/icons/icon128.png" alt="Framewise" width="96" />
</p>

# Framewise

Framewise is an AI-powered video learning assistant with two connected surfaces:

- **Web app** — analyze YouTube videos, search your learning library, chat with videos, save notes and bookmarks, generate captions, quiz yourself, practice choreography, and organize videos into collections.
- **Chrome extension** — works directly on YouTube with the same backend account and data. It loads saved timelines, enables chat, injects captions, loops dance segments, tracks your pose live, and syncs progress.

The web app and extension are not separate products. They share the same Express API, MongoDB data, auth token, and AI pipeline.

## Collaboration Note

This project has been built collaboratively across the stack. Ayse has contributed across frontend, backend, and extension — including product integration, library/search/bookmark/collection/progress flows, dance practice workspace, pose tracking (web + extension), and the visual design system. Ownership in `TASKS.md` is a coordination aid, not a strict boundary.

## Current Status

Functional MVP+. YouTube-first flow is fully implemented; upload-based video analysis is future work.

**Implemented:**

- Email/password auth and Google OAuth; auth-aware LandingPage nav with user chip and sign-out
- YouTube URL analysis with Gemini (async job queue, progress polling)
- Topic timeline generation and timestamp seeking
- Video chat with timestamped answers and ElevenLabs voice replies
- YouTube transcript captions, ElevenLabs STT fallback, correction, translation, and extension caption injection
- Transcript download as `.srt` or `.txt`
- Quiz generation (Gemini watches the actual video — not transcript-only)
- Dance Practice Workspace — full-screen immersive mode with YouTube player and live webcam side-by-side
  - MoveNet webcam pose tracking with green skeleton overlay
  - Dancer pose tracking via screen capture with orange skeleton overlay on the video side
  - Independent **Mirror Me** and **Mirror Video** controls
  - Loop sections, speed presets (0.5× – 1.5×), segment navigation
  - AI coach commentary after each session with ElevenLabs TTS and replay button
- **Extension Practice tab** — live MoveNet webcam pose tracking inside the Chrome side panel
  - 10 FPS skeleton overlay with keypoint count pill
  - Auto pose snaps at each dance segment transition (2s delay, 8s cooldown)
  - Timestamped review cards with quality score (Great / Good / Ok / Low)
- Adaptive video mode: `auto` / `study` / `dance` detection with manual override
- Library search across video titles and segment summaries
- Bookmarks, notes, and AI-generated notes
- Collections/folders with add, remove, and rename
- Continue watching with saved playback position
- Auto-load analyzed timelines in the extension
- Dark/light theme system with Framewise design tokens
- Extension setup guide page at `/extension` (public, no auth required)

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, Mongoose, JWT |
| Database | MongoDB Atlas |
| AI video/chat | Gemini 2.5 via `@google/generative-ai` |
| Voice + STT | ElevenLabs |
| Pose tracking | TensorFlow.js + MoveNet SINGLEPOSE_LIGHTNING (web + extension) |
| Web app | React 18, Vite, React Router |
| Extension | Chrome Manifest V3, Side Panel API, content script |

## Project Structure

```text
framewise/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── models/          — User, Video, Segment, ChatMessage, Caption, Note, Bookmark, Collection
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/        — geminiService, captionService, elevenlabsService
│   │   ├── middleware/       — auth, timeout, rateLimit, validateObjectId
│   │   └── queue/           — in-memory async job queue
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/           — LibraryPage, VideoPage, AnalyzePage, SettingsPage, LandingPage, ExtensionPage
│   │   ├── components/
│   │   │   └── dance/       — DancePracticeWorkspace, usePoseTracking
│   │   └── services/api.js
│   ├── vite.config.js
│   └── package.json
│
├── extension/
│   ├── manifest.json
│   ├── icons/
│   └── src/
│       ├── background.js
│       ├── content.js
│       ├── config.js        — FW_API + FW_APP URLs (edit before production)
│       └── panel/
│
├── pitch/                   — PITCH_DECK.md, SPEAKER_SCRIPT.md, DEMO_CHECKLIST.md
├── .archive/reference/      — archived reference material, not imported at runtime
├── TASKS.md
└── README.md
```

## Local Setup

### 1. Install all dependencies

```bash
npm run install:all
```

This runs `npm install` in the root, `backend/`, and `frontend/` in one step.

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_string_at_least_32_chars
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
ALLOWED_ORIGINS=http://localhost:5174
PORT=3001
```

Optional:

```env
GEMINI_RPM=14                       # max Gemini requests/min across the whole app (default 14, free-tier safe)
GEMINI_CHUNK_CONCURRENCY=3          # parallel chunks per analysis call (drop to 1 only on very long videos)
ELEVENLABS_COACH_VOICE_ID=...       # second voice for Settings → Coach voice
```

### 3. Configure frontend

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 4. Start

```bash
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5174`
- Health check: `GET http://localhost:3001/api/health`

The frontend Vite dev server proxies `/api` to `http://localhost:3001`.

## Chrome Extension Setup

A full setup guide is available at `http://localhost:5174/extension` once the frontend is running. Quick steps:

1. Start backend and frontend with `npm run dev`.
2. Sign in on the web app at `http://localhost:5174/login`.
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `extension/` folder.
4. Open any YouTube video and click the Framewise icon to open the side panel.

Notes:
- Extension API and app URLs are set in `extension/src/config.js` — update these before a production build.
- If Chrome blocks requests with a `chrome-extension://...` origin, add that origin to `ALLOWED_ORIGINS` in `backend/.env`.

## Dance Practice Workspace

The practice mode is a full-screen overlay accessible from any dance video's Practice tab.

**Live webcam side** — webcam feed with a green MoveNet skeleton. Toggle **Mirror Me** to flip it.

**YouTube video side** — the dance video plays in real time. Toggle **Mirror Video** to flip it.

**Track Dancer** (orange skeleton) — click **Track Dancer** in the controls bar. The browser will ask you to share your screen; select **"This Tab"** for best results. MoveNet runs on a cropped frame of the YouTube player and draws an orange skeleton directly over the dancer in the video. Click **Stop Dancer** to stop.

When both are active you see the green user skeleton on your side and the orange dancer skeleton on the video side for a live side-by-side comparison.

After each session the AI coach generates spoken feedback (ElevenLabs TTS) — replay it anytime from the session summary card.

## Extension Pose Tracking

The extension's Dance tab includes a live pose tracking camera panel:

- Click **Enable Camera** to start — the browser prompts for webcam permission.
- A green MoveNet skeleton overlays your live feed at 10 FPS (lightweight during YouTube playback).
- The keypoint pill shows how many joints are detected and whether pose detection is active.
- As you watch a dance video and the active segment changes, the extension automatically takes a pose snapshot (after a 2s delay, with an 8s cooldown). Each snapshot becomes a timestamped review card showing a quality score and colored progress bar.

## API Reference

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Email registration |
| POST | `/api/auth/login` | Email login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update profile |
| DELETE | `/api/auth/me` | Delete account and all data |

### Videos
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/videos/analyze` | Analyze YouTube URL (returns `{ jobId }`) |
| GET | `/api/jobs/:jobId` | Poll async job status |
| GET | `/api/videos` | Library list |
| GET | `/api/videos/search` | Search by title or segment summary |
| GET | `/api/videos/lookup` | Extension cached lookup by URL |
| GET | `/api/videos/:videoId` | Get one video |
| PATCH | `/api/videos/:videoId/mode` | Set Study Queue / Dance Practice override |
| GET | `/api/videos/:videoId/segments` | Topic or dance segments |
| PATCH | `/api/videos/:videoId/progress` | Save playback position |
| POST | `/api/videos/:videoId/dance` | Dance segment analysis |
| POST | `/api/videos/:videoId/quiz` | Quiz generation |

### Captions
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/videos/:videoId/captions` | Get captions |
| PUT | `/api/videos/:videoId/captions` | Save edited captions |
| POST | `.../captions/generate` | YouTube transcript captions |
| POST | `.../captions/generate-audio` | ElevenLabs STT captions |
| POST | `.../captions/correct` | Gemini correction pass |
| POST | `.../captions/translate` | Translate captions |
| POST | `/api/videos/:videoId/transcript` | Import raw transcript |

### Chat, Notes, Bookmarks, Collections
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat/:videoId/message` | Chat with video |
| GET | `/api/chat/:videoId/history` | Chat history |
| POST | `/api/chat/:videoId/voice` | ElevenLabs TTS for a message |
| GET/POST | `/api/videos/:videoId/notes` | Notes |
| POST | `.../notes/generate` | AI-generated notes |
| GET/POST | `/api/videos/:videoId/bookmarks` | Bookmarks |
| PATCH | `.../bookmarks/:bookmarkId` | Rename bookmark |
| GET/POST | `/api/collections` | Collections |
| PATCH | `/api/collections/:collectionId` | Rename collection |
| POST | `.../videos` | Add video to collection |
| DELETE | `.../videos/:videoId` | Remove video from collection |

## MongoDB Notes

Collections: `users`, `videos`, `segments`, `chatmessages`, `captions`, `notes`, `bookmarks`, `collections`.

`Video` has a weighted text index on `title` (weight 8), `segmentSearchText` (weight 5), and `transcript` (weight 1) for library search. Atlas auto-creates this index on first start in development. In production with `autoIndex` disabled, create it manually:

```js
db.videos.createIndex(
  { title: "text", transcript: "text", segmentSearchText: "text" },
  { weights: { title: 8, segmentSearchText: 5, transcript: 1 } }
)
```

## Demo Flow

1. `npm run dev` — confirm `http://localhost:3001/api/health` returns ok.
2. Register a new account (or log in) — confirm user chip and sign-out appear in the landing nav.
3. Paste a YouTube URL and analyze it. Watch the progress bar; confirm the timeline appears.
4. Seek the player by clicking a segment timestamp.
5. Ask the chat "Where does it explain the main idea?" — confirm a timestamped answer.
6. Toggle voice on and confirm ElevenLabs returns audio.
7. Open the Subtitles tab, generate captions, download as `.srt` and `.txt`.
8. Generate a quiz and answer questions.
9. Add a note, generate AI notes. Add a bookmark.
10. Create a collection and add the video.
11. Open Practice tab — start a webcam session. Confirm the green skeleton appears.
12. Click **Track Dancer**, share the tab, confirm the orange dancer skeleton overlays the video.
13. Toggle **Mirror Me** and **Mirror Video** independently.
14. End the session; confirm AI coach speaks and the replay button works.
15. Override video mode to Study Queue; confirm UI adapts.
16. Refresh — confirm the continue-watching position is restored.
17. Load the extension, open the same YouTube URL — confirm the timeline auto-loads.
18. In the extension's Dance tab, enable the camera — confirm skeleton appears.
19. Seek through dance segments — confirm pose snap review cards appear automatically.
20. Toggle light and dark theme.

## Known Limitations

- Only YouTube URL analysis is supported. File upload is not yet implemented.
- Dancer skeleton tracking requires sharing the browser tab via `getDisplayMedia`; full-screen or window captures may mis-align the crop due to browser chrome offset.
- Dance, captions, and STT analysis still run in the request cycle; only video analyze runs as an async job. These should move to the job queue before production.
- Extension URLs are configured in `extension/src/config.js` for local dev; production packaging needs a final build-time config path.
- Google OAuth requires matching client IDs in both `backend/.env` and `frontend/.env`.
- Caption quality depends on available YouTube captions or ElevenLabs STT accuracy.
- Extension pose tracking loads TF.js and MoveNet from CDN on first use — initial load takes a few seconds depending on connection speed.

## Adaptive Mode

Each video carries:
- `detectedMode` — `study`, `dance`, or `general`, inferred from title, transcript, URL, and segment signals
- `modeOverride` — `auto`, `study`, or `dance`, set manually from VideoPage
- `modeConfidence` and `modeSignals`

The effective mode controls default tab order on VideoPage and in the extension sidebar. The next step is a Gemini-powered classifier using richer signals and feeding more granular UI adaptation.

## Moving Forward

1. Stabilize with teammate testing and smoke-test checklist (see `TASKS.md`).
2. Extract `VideoPage.jsx` into focused components — player, timeline, chat, captions, notes, bookmarks, quiz, dance.
3. Move dance analysis, captions, and STT into the async job queue.
4. Add production config for deployed backend/frontend and extension release builds.
5. Add test coverage for auth, video ownership, search, bookmarks, collections, and progress.
6. Add upload support with file storage and Gemini Files API.
