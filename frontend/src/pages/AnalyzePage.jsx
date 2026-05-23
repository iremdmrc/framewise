import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { videoAPI, jobsAPI } from "../services/api";
import Icon from "../components/Icon";

const POLL_INTERVAL_MS = 2000;

const STATUS_MESSAGES = [
  "Reading the video…",
  "Identifying key topics…",
  "Building your timeline…",
  "Almost there…",
  "Wrapping up…",
];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef(null);
  const msgIndexRef = useRef(0);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopPolling = () => clearInterval(pollRef.current);

  const startPolling = (jobId) => {
    stopPolling();
    let msgTick = 0;
    pollRef.current = setInterval(async () => {
      try {
        const { data: job } = await jobsAPI.get(jobId);

        // Rotate status messages
        msgTick += 1;
        if (msgTick % 3 === 0) {
          msgIndexRef.current = (msgIndexRef.current + 1) % STATUS_MESSAGES.length;
        }

        setProgress(job.progress ?? 0);
        setStatusMsg(job.message || STATUS_MESSAGES[msgIndexRef.current]);

        if (job.status === "completed") {
          stopPolling();
          navigate(`/app/video/${job.result.videoId}`);
        } else if (job.status === "failed") {
          stopPolling();
          setLoading(false);
          setError(job.error || "Analysis failed");
        }
      } catch {
        stopPolling();
        setLoading(false);
        setError("Lost connection while checking analysis status. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress(0);
    msgIndexRef.current = 0;
    setStatusMsg(STATUS_MESSAGES[0]);

    try {
      const res = await videoAPI.analyze(url);

      // Cached result — navigate immediately
      if (res.data.video) {
        navigate(`/app/video/${res.data.video._id}`);
        return;
      }

      if (!res.data.jobId) throw new Error("Analysis job was not created.");

      // New job — start polling
      startPolling(res.data.jobId);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Analysis failed");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fw-rust)", fontWeight: 500, marginBottom: 8 }}>
          — Add video
        </div>
        <h1 style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 28, letterSpacing: "-.03em", color: "var(--fw-ink)", margin: 0 }}>
          Analyze a YouTube video
        </h1>
        <p style={{ fontSize: 14, color: "var(--fw-ink-3)", marginTop: 8, lineHeight: 1.6 }}>
          Paste a YouTube URL to generate an AI topic timeline, interactive chat, captions, practice steps, and more.
        </p>
      </div>

      <form onSubmit={handleAnalyze} style={{ display: "flex", alignItems: "center", background: "var(--fw-surface)", border: "1px solid var(--fw-rule)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", flexShrink: 0, color: "var(--fw-ink-3)" }}>
          <Icon name="youtube" size={14} style={{ color: "var(--fw-rust)" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase" }}>ANALYZE</span>
        </div>
        <div style={{ width: 1, height: 22, background: "var(--fw-rule)", flexShrink: 0 }} />
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "12px 14px", fontSize: 14, color: "var(--fw-ink)", fontFamily: "'Geist', system-ui, sans-serif", letterSpacing: "-.01em", minWidth: 0 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ margin: 4, padding: "8px 14px", borderRadius: 7, border: "none", cursor: loading ? "not-allowed" : "pointer", background: "var(--fw-ink)", color: "var(--fw-bg)", fontFamily: "'Geist', system-ui, sans-serif", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, opacity: loading ? .7 : 1, transition: "opacity .12s" }}
        >
          {loading ? (
            <><span style={{ display: "inline-block", width: 11, height: 11, border: "2px solid rgba(251,241,214,.25)", borderTopColor: "var(--fw-bg)", borderRadius: "50%", animation: "az-spin .65s linear infinite" }} /> Analyzing…</>
          ) : (
            <>Analyze <Icon name="arrow" size={12} /></>
          )}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--fw-rule)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--fw-rust)",
                borderRadius: 2,
                transition: "width .4s ease",
                minWidth: progress > 0 ? 12 : 0,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fw-ink-3)" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--fw-rust)", animation: "az-pulse 1.4s ease-in-out infinite" }} />
            {statusMsg}
          </div>
        </div>
      )}

      {error && (
        <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--fw-err)", padding: "7px 10px", background: "var(--fw-rust-soft)", borderRadius: 6, border: "1px solid rgba(197,106,67,.25)" }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes az-spin { to { transform: rotate(360deg); } }
        @keyframes az-pulse { 0%, 100% { opacity: .4; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  );
}
