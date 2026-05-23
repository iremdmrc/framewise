import { useState, useRef, useEffect, useCallback } from "react";
import { chatAPI } from "../../services/api";
import Icon from "../Icon";
import { usePoseTracking, getDetector, drawSkeleton } from "./usePoseTracking";
import "./DancePracticeWorkspace.css";

function extractYouTubeId(url) {
  const m = url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : "";
}

function formatTime(seconds) {
  const t = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatElapsed(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DancePracticeWorkspace({ video, danceSegments = [], onClose, onCoachFeedback }) {
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [mirrorCam, setMirrorCam] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activeSegIdx, setActiveSegIdx] = useState(0);
  const [loopActive, setLoopActive] = useState(false);
  const [phase, setPhase] = useState("ready"); // ready | practicing | feedback
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [coachAudioUrl, setCoachAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [dancerTracking, setDancerTracking] = useState("idle"); // idle | requesting | active | error

  const playerRef = useRef(null);
  const loopRef = useRef(null);
  const timerRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const compareCanvasRef = useRef(null);
  const coachAudioRef = useRef(null);
  const keypointCountRef = useRef(0);
  const poseStatsRef = useRef({ max: 0, sum: 0, frames: 0 });

  // Dancer tracking refs
  const skipCompareRef = useRef(false);
  const screenStreamRef = useRef(null);
  const screenVideoElRef = useRef(null);
  const dancerRafRef = useRef(null);
  const dancerStoppedRef = useRef(true);
  const offscreenRef = useRef(null);

  const { status: poseStatus, error: poseError, keypointCount, start: startPose, stop: stopPose } =
    usePoseTracking({ videoRef: webcamVideoRef, canvasRef, compareCanvasRef, skipCompareRef });

  // YouTube player
  useEffect(() => {
    const ytId = extractYouTubeId(video?.url);
    if (!ytId) return;
    let cancelled = false;

    const init = () => {
      if (cancelled || playerRef.current) return;
      playerRef.current = new window.YT.Player("dpw-yt-player", {
        videoId: ytId,
        playerVars: { autoplay: 1, modestbranding: 1, rel: 0, enablejsapi: 1 },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            if (speed !== 1) e.target.setPlaybackRate(speed);
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      const iv = setInterval(() => {
        if (window.YT?.Player) { clearInterval(iv); init(); }
      }, 100);
      return () => { cancelled = true; clearInterval(iv); };
    }

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [video?.url]);

  // Session timer
  useEffect(() => {
    if (phase === "practicing" && sessionStart) {
      timerRef.current = setInterval(() => {
        setSessionElapsed(Math.floor((Date.now() - sessionStart) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, sessionStart]);

  // Sync keypointCount to ref for use in callbacks
  useEffect(() => {
    keypointCountRef.current = keypointCount;
    if (phase === "practicing" && poseStatus === "active" && keypointCount > 0) {
      poseStatsRef.current.sum += keypointCount;
      poseStatsRef.current.frames += 1;
      if (keypointCount > poseStatsRef.current.max) poseStatsRef.current.max = keypointCount;
    }
  }, [keypointCount, phase, poseStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPose({ updateState: false });
      // Dancer tracking cleanup (inline — uses refs so no closure staleness)
      dancerStoppedRef.current = true;
      if (dancerRafRef.current) cancelAnimationFrame(dancerRafRef.current);
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(loopRef.current);
      clearInterval(timerRef.current);
      coachAudioRef.current?.pause();
      if (coachAudioUrl) URL.revokeObjectURL(coachAudioUrl);
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const seekTo = (s) => playerRef.current?.seekTo?.(s, true);

  const applySpeed = useCallback((r) => {
    setSpeed(r);
    playerRef.current?.setPlaybackRate?.(r);
  }, []);

  const startLoop = useCallback((seg) => {
    clearInterval(loopRef.current);
    setLoopActive(true);
    seekTo(seg.startTime);
    loopRef.current = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.() || 0;
      if (t >= seg.endTime) seekTo(seg.startTime);
    }, 500);
  }, []);

  const stopLoop = useCallback(() => {
    clearInterval(loopRef.current);
    loopRef.current = null;
    setLoopActive(false);
  }, []);

  const handleSegmentClick = (seg, idx) => {
    setActiveSegIdx(idx);
    seekTo(seg.startTime);
  };

  const handleLoopToggle = (e, seg, idx) => {
    e.stopPropagation();
    if (loopActive && activeSegIdx === idx) {
      stopLoop();
    } else {
      setActiveSegIdx(idx);
      startLoop(seg);
    }
  };

  const startSession = async () => {
    setSessionStart(Date.now());
    setSessionElapsed(0);
    setPhase("practicing");
    if (poseStatus !== "active") await startPose();
  };

  const playCoachAudio = (url) => {
    coachAudioRef.current?.pause();
    const audio = new Audio(url);
    coachAudioRef.current = audio;
    audio.onended = () => setAudioPlaying(false);
    audio.play().catch(() => {});
    setAudioPlaying(true);
  };

  const stopDancerTracking = () => {
    dancerStoppedRef.current = true;
    if (dancerRafRef.current) cancelAnimationFrame(dancerRafRef.current);
    dancerRafRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (screenVideoElRef.current) {
      screenVideoElRef.current.srcObject = null;
      screenVideoElRef.current = null;
    }
    offscreenRef.current = null;
    skipCompareRef.current = false;
    const cc = compareCanvasRef.current;
    if (cc) cc.getContext("2d")?.clearRect(0, 0, cc.width, cc.height);
    setDancerTracking("idle");
  };

  const startDancerTracking = async () => {
    setDancerTracking("requesting");
    dancerStoppedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 30 } },
        audio: false,
      });
      if (dancerStoppedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

      screenStreamRef.current = stream;
      const vid = document.createElement("video");
      vid.srcObject = stream;
      vid.muted = true;
      vid.playsInline = true;
      screenVideoElRef.current = vid;
      await vid.play();

      stream.getVideoTracks()[0].addEventListener("ended", stopDancerTracking);

      skipCompareRef.current = true;
      setDancerTracking("active");

      const detector = await getDetector();
      if (dancerStoppedRef.current) return;

      const tick = async () => {
        if (dancerStoppedRef.current) return;

        const compareCanvas = compareCanvasRef.current;
        const playerEl = document.getElementById("dpw-yt-player");
        const sv = screenVideoElRef.current;

        if (!compareCanvas || !playerEl || !sv || sv.readyState < 2) {
          dancerRafRef.current = requestAnimationFrame(tick);
          return;
        }

        const cw = compareCanvas.offsetWidth || 640;
        const ch = compareCanvas.offsetHeight || 480;
        if (compareCanvas.width !== cw || compareCanvas.height !== ch) {
          compareCanvas.width = cw;
          compareCanvas.height = ch;
        }

        const rect = playerEl.getBoundingClientRect();
        const scaleX = sv.videoWidth / window.innerWidth;
        const scaleY = sv.videoHeight / window.innerHeight;
        const cropX = Math.max(0, Math.round(rect.left * scaleX));
        const cropY = Math.max(0, Math.round(rect.top * scaleY));
        const cropW = Math.max(1, Math.round(rect.width * scaleX));
        const cropH = Math.max(1, Math.round(rect.height * scaleY));

        // Reuse offscreen canvas; only recreate on resize
        const prev = offscreenRef.current;
        const offscreen = (prev && prev.width === cropW && prev.height === cropH)
          ? prev
          : (() => { const c = document.createElement("canvas"); c.width = cropW; c.height = cropH; offscreenRef.current = c; return c; })();

        offscreen.getContext("2d").drawImage(sv, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        try {
          const poses = await detector.estimatePoses(offscreen);
          const cctx = compareCanvas.getContext("2d");
          cctx.clearRect(0, 0, cw, ch);
          if (poses?.[0]?.keypoints) {
            drawSkeleton(cctx, poses[0].keypoints, cw, ch, cropW, cropH, {
              line: "rgba(238,146,104,0.75)",
              dot: "rgba(238,146,104,0.95)",
              dotOutline: "rgba(255,242,220,0.35)",
              lineWidth: 3,
              dotRadius: 5,
            });
          }
        } catch {}

        dancerRafRef.current = requestAnimationFrame(tick);
      };

      dancerRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      dancerStoppedRef.current = true;
      skipCompareRef.current = false;
      const dismissed = err?.name === "NotAllowedError" || err?.name === "AbortError";
      setDancerTracking(dismissed ? "idle" : "error");
    }
  };

  const endSession = async () => {
    stopLoop();
    clearInterval(timerRef.current);
    setPhase("feedback");
    setFeedbackLoading(true);

    const mins = Math.floor(sessionElapsed / 60);
    const secs = sessionElapsed % 60;
    const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const segNames = danceSegments.slice(0, 6).map((s) => s.title).join(", ") || "various sections";
    const stats = { ...poseStatsRef.current };
    poseStatsRef.current = { max: 0, sum: 0, frames: 0 };
    const avgKp = stats.frames > 0 ? Math.round(stats.sum / stats.frames) : 0;
    const poseNote = poseStatus === "active"
      ? `My body was tracked throughout — averaging ${avgKp}/17 joints and peaking at ${stats.max}/17.`
      : "I didn't use pose tracking this session.";
    const prompt = `I just completed a ${durationStr} dance practice session working on: ${segNames}. ${poseNote} As my dance coach, give me 2–3 sentences of specific feedback on my form and timing compared to the choreography in the video. Be direct and encouraging like a real coach — reference the actual moves I practiced. No bullet points or headers.`;

    let feedbackText = "Great work putting in the practice time! Consistency is what separates good dancers from great ones. Keep it up.";
    let feedbackMessage = null;
    try {
      const res = await chatAPI.sendMessage(video._id, prompt, "dance", { persistUser: false });
      feedbackText = res.data.content || feedbackText;
      feedbackMessage = res.data;
    } catch {}
    setFeedback(feedbackText);
    setFeedbackLoading(false);
    onCoachFeedback?.(feedbackMessage || {
      role: "assistant",
      content: feedbackText,
      _id: `practice-feedback-${Date.now()}`,
    });

    try {
      const audioRes = await chatAPI.getVoice(video._id, feedbackText);
      const blob = new Blob([audioRes.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setCoachAudioUrl(url);
      playCoachAudio(url);
    } catch {}
  };

  const handleClose = () => {
    stopLoop();
    stopPose({ updateState: false });
    clearInterval(timerRef.current);
    onClose();
  };

  const resetSession = () => {
    coachAudioRef.current?.pause();
    if (coachAudioUrl) URL.revokeObjectURL(coachAudioUrl);
    setCoachAudioUrl(null);
    setAudioPlaying(false);
    setPhase("ready");
    setSessionElapsed(0);
    setFeedback("");
    poseStatsRef.current = { max: 0, sum: 0, frames: 0 };
  };

  const activeSeg = danceSegments[activeSegIdx];
  const ytId = extractYouTubeId(video?.url);

  const kpColor = keypointCount >= 12 ? "#B5CC92" : keypointCount >= 6 ? "#F5C36C" : "#EE9268";

  return (
    <div className="dpw">
      {/* ── Header ── */}
      <div className="dpw-header">
        <div className="dpw-header-left">
          <div className="dpw-brand">
            <span className="dpw-brand-dot" />
            <span className="dpw-brand-label">PRACTICE MODE</span>
          </div>
          {activeSeg && (
            <span className="dpw-seg-now">
              <span className="dpw-seg-now-num">{String(activeSegIdx + 1).padStart(2, "0")}</span>
              {activeSeg.title}
            </span>
          )}
        </div>

        <div className="dpw-header-center">
          {phase === "practicing" && (
            <div className="dpw-timer">
              <span className="dpw-timer-dot" />
              {formatElapsed(sessionElapsed)}
            </div>
          )}
        </div>

        <div className="dpw-header-right">
          <button className="dpw-exit-btn" onClick={handleClose}>
            <Icon name="x" size={13} /> Exit
          </button>
        </div>
      </div>

      {/* ── Two-panel body ── */}
      <div className="dpw-body">

        {/* Left: Video + controls + segments */}
        <div className="dpw-video-col">
          <div className={`dpw-player-wrap${mirrorVideo ? " mirrored" : ""}`}>
            <div id="dpw-yt-player" className="dpw-yt-container" />
            {(poseStatus === "active" || dancerTracking === "active") && (
              <canvas ref={compareCanvasRef} className="dpw-compare-canvas" />
            )}
          </div>

          <div className="dpw-speed-bar">
            <span className="dpw-label-xs">SPEED</span>
            {[0.5, 0.75, 1, 1.25, 1.5].map((r) => (
              <button
                key={r}
                className={`dpw-speed-chip${speed === r ? " active" : ""}`}
                onClick={() => applySpeed(r)}
              >
                {r}×
              </button>
            ))}
          </div>

          <div className="dpw-seg-list">
            {danceSegments.length === 0 ? (
              <p className="dpw-seg-empty">No sections detected — use "Detect moves" first.</p>
            ) : (
              danceSegments.map((seg, i) => (
                <button
                  key={seg._id || i}
                  className={`dpw-seg-row${activeSegIdx === i ? " active" : ""}`}
                  onClick={() => handleSegmentClick(seg, i)}
                >
                  <span className="dpw-seg-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="dpw-seg-tc">{formatTime(seg.startTime)}</span>
                  <span className="dpw-seg-name">{seg.title}</span>
                  {seg.movementCue && (
                    <span className="dpw-seg-cue">{seg.movementCue}</span>
                  )}
                  <button
                    className={`dpw-loop-chip${loopActive && activeSegIdx === i ? " active" : ""}`}
                    onClick={(e) => handleLoopToggle(e, seg, i)}
                    title={loopActive && activeSegIdx === i ? "Stop loop" : "Loop this section"}
                  >
                    <Icon name="continue" size={10} />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Webcam + pose overlay */}
        <div className="dpw-webcam-col">
          <div className={`dpw-cam-wrap${mirrorCam ? " mirrored" : ""}`}>
            <video ref={webcamVideoRef} className="dpw-cam-video" playsInline muted />
            <canvas ref={canvasRef} className="dpw-cam-canvas" />

            {(poseStatus === "idle" || poseStatus === "error") && (
              <div className="dpw-cam-idle">
                <div className="dpw-cam-idle-icon">
                  <Icon name="dance" size={26} />
                </div>
                <p className="dpw-cam-idle-title">Webcam off</p>
                <p className="dpw-cam-idle-sub">Start a session or turn on webcam below</p>
              </div>
            )}

            {poseStatus === "loading" && (
              <div className="dpw-cam-idle">
                <div className="dpw-cam-spinner" />
                <p className="dpw-cam-idle-title">Loading MoveNet…</p>
                <p className="dpw-cam-idle-sub">Initialising pose detection model</p>
              </div>
            )}

            {poseStatus === "active" && (
              <div className="dpw-kp-pill" style={{ "--kp-color": kpColor }}>
                <span className="dpw-kp-dot" />
                {keypointCount}/17 joints tracked
              </div>
            )}

            <div className="dpw-cam-label-bar">
              <span className="dpw-label-xs">LIVE WEBCAM</span>
              {poseStatus === "active"
                ? <span className="dpw-cam-status-live">● POSE TRACKING ACTIVE</span>
                : <span className="dpw-cam-status-off">● OFF</span>
              }
            </div>
          </div>

          {poseError && <p className="dpw-error-msg">{poseError}</p>}
        </div>
      </div>

      {/* ── Bottom control bar ── */}
      <div className="dpw-controls">
        <div className="dpw-ctrl-group">
          <button
            className={`dpw-ctrl-btn${mirrorCam ? " active" : ""}`}
            onClick={() => setMirrorCam((v) => !v)}
            title="Flip webcam view"
          >
            <Icon name="layers" size={13} /> Mirror Me
          </button>
          <button
            className={`dpw-ctrl-btn${mirrorVideo ? " active" : ""}`}
            onClick={() => setMirrorVideo((v) => !v)}
            title="Flip dance video"
          >
            <Icon name="layers" size={13} /> Mirror Video
          </button>
          <button
            className={`dpw-ctrl-btn${loopActive ? " active" : ""}`}
            onClick={loopActive ? stopLoop : () => activeSeg && startLoop(activeSeg)}
            disabled={!activeSeg}
          >
            <Icon name="continue" size={13} />
            {loopActive ? "Stop Loop" : "Loop Section"}
          </button>
        </div>

        <div className="dpw-ctrl-primary">
          {phase === "ready" && (
            <button className="dpw-btn-primary" onClick={startSession}>
              <Icon name="play" size={14} /> Start Practice Session
            </button>
          )}
          {phase === "practicing" && (
            <>
              <button className="dpw-btn-end" onClick={endSession}>
                End Session
              </button>
            </>
          )}
          {phase === "feedback" && (
            <button className="dpw-btn-primary" onClick={resetSession}>
              <Icon name="play" size={14} /> Practice Again
            </button>
          )}
        </div>

        <div className="dpw-ctrl-group dpw-ctrl-group-right">
          {dancerTracking === "active" ? (
            <button className="dpw-ctrl-btn active" onClick={stopDancerTracking}>
              <Icon name="stop" size={12} /> Stop Dancer
            </button>
          ) : (
            <button
              className="dpw-ctrl-btn"
              onClick={startDancerTracking}
              disabled={dancerTracking === "requesting"}
              title="Share this browser tab when prompted to detect the dancer's pose"
            >
              <Icon name="dance" size={13} />
              {dancerTracking === "requesting" ? "Waiting…" : dancerTracking === "error" ? "Retry Dancer" : "Track Dancer"}
            </button>
          )}
          {poseStatus === "active" ? (
            <button className="dpw-btn-stop-cam" onClick={() => stopPose()}>
              <Icon name="stop" size={12} /> Stop Webcam
            </button>
          ) : (
            <button
              className="dpw-ctrl-btn"
              onClick={startPose}
              disabled={poseStatus === "loading"}
            >
              <Icon name="dance" size={13} />
              {poseStatus === "loading" ? "Loading…" : "Start Webcam"}
            </button>
          )}
        </div>
      </div>

      {/* ── Post-session feedback overlay ── */}
      {phase === "feedback" && (
        <div className="dpw-overlay">
          <div className="dpw-feedback-card">
            <div className="dpw-feedback-top">
              <span className="dpw-feedback-eyebrow">SESSION COMPLETE</span>
              <h2 className="dpw-feedback-title">Practice Summary</h2>
              <p className="dpw-feedback-meta">
                {Math.floor(sessionElapsed / 60)}m {sessionElapsed % 60}s &nbsp;·&nbsp; {danceSegments.length} sections
              </p>
            </div>

            <div className="dpw-feedback-body">
              {feedbackLoading ? (
                <div className="dpw-feedback-thinking">
                  <div className="dpw-dots">
                    <span /><span /><span />
                  </div>
                  <p>Your dance coach is reviewing…</p>
                </div>
              ) : (
                <p className="dpw-feedback-text">{feedback}</p>
              )}
            </div>

            <div className="dpw-feedback-actions">
              <button className="dpw-btn-primary" onClick={resetSession}>
                <Icon name="play" size={14} /> Practice Again
              </button>
              {coachAudioUrl && (
                <button
                  className={`dpw-ctrl-btn${audioPlaying ? " active" : ""}`}
                  onClick={() => audioPlaying
                    ? (coachAudioRef.current?.pause(), setAudioPlaying(false))
                    : playCoachAudio(coachAudioUrl)
                  }
                >
                  <Icon name="speaker" size={13} />
                  {audioPlaying ? "Playing…" : "Replay Coach"}
                </button>
              )}
              <button className="dpw-ctrl-btn" onClick={handleClose}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
