import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector = null;
let running = false;

export async function initDancePoseAnalyzer() {
    if (detector) return;
    
    console.log("[Framewise] Initializing MoveNet...");
    
    try {
        // Explicitly set backend and await ready
        await tf.setBackend('webgl');
        await tf.ready();
        
        const currentBackend = tf.getBackend();
        console.log("[Framewise] TFJS Backend active:", currentBackend);

        if (currentBackend !== 'webgl') {
            console.warn(`[Framewise] Requested 'webgl' backend but got '${currentBackend}'. Performance might be affected.`);
        }

        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                enableSmoothing: true
            }
        );
        console.log("[Framewise] Dance pose analyzer ready with MoveNet");
    } catch (err) {
        console.error("[Framewise] Failed to initialize MoveNet/TFJS:", err);
        // Try fallback to CPU if WebGL fails
        try {
            console.log("[Framewise] Attempting fallback to CPU backend...");
            await tf.setBackend('cpu');
            await tf.ready();
            detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                }
            );
        } catch (fallbackErr) {
            console.error("[Framewise] CPU fallback also failed:", fallbackErr);
        }
    }
}

export function startDancePoseAnalyzer() {
    const player = document.querySelector(".html5-video-player") || document.querySelector("#movie_player");
    if (!player) {
        console.log("YouTube player container not found");
        return;
    }

    const video = player.querySelector("video") || document.querySelector("video");
    if (!video) {
        console.log("YouTube video element not found");
        return;
    }

    let canvas = document.getElementById("framewise-dance-pose-canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "framewise-dance-pose-canvas";
        player.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    running = true;

    function updateCanvasSize() {
        const rect = video.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        canvas.style.position = "absolute";
        canvas.style.left = (rect.left - playerRect.left) + "px";
        canvas.style.top = (rect.top - playerRect.top) + "px";
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "2147483647";

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    }

    async function loop() {
        if (!running) return;

        updateCanvasSize();

        // Robust check for frames
        if (!video.paused && !video.ended && detector && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
            try {
                const poses = await detector.estimatePoses(video);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (poses && poses.length > 0) {
                    drawSkeleton(ctx, poses[0].keypoints, canvas.width, canvas.height);
                }
            } catch (e) {
                console.error("Frame detection error:", e);
            }
        }

        requestAnimationFrame(loop);
    }

    loop();
}

export function stopDancePoseAnalyzer() {
    running = false;
    const canvas = document.getElementById("framewise-dance-pose-canvas");
    if (canvas) canvas.remove();
}

function drawSkeleton(ctx, keypoints, width, height) {
    const video = document.querySelector("video");
    if (!video) return;

    const scaleX = width / video.videoWidth;
    const scaleY = height / video.videoHeight;

    const minScore = 0.2;
    drawLines(ctx, keypoints, minScore, scaleX, scaleY);
    drawPoints(ctx, keypoints, minScore, scaleX, scaleY);
}

function drawPoints(ctx, keypoints, minScore, scaleX, scaleY) {
    keypoints.forEach((p) => {
        if (p.score > minScore) {
            ctx.beginPath();
            ctx.arc(p.x * scaleX, p.y * scaleY, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#FF0055";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function drawLines(ctx, keypoints, minScore, scaleX, scaleY) {
    const pairs = [
        ["left_shoulder", "right_shoulder"],
        ["left_shoulder", "left_elbow"],
        ["left_elbow", "left_wrist"],
        ["right_shoulder", "right_elbow"],
        ["right_elbow", "right_wrist"],
        ["left_shoulder", "left_hip"],
        ["right_shoulder", "right_hip"],
        ["left_hip", "right_hip"],
        ["left_hip", "left_knee"],
        ["left_knee", "left_ankle"],
        ["right_hip", "right_knee"],
        ["right_knee", "right_ankle"],
    ];

    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    pairs.forEach(([a, b]) => {
        const p1 = keypoints.find((p) => p.name === a);
        const p2 = keypoints.find((p) => p.name === b);

        if (p1 && p2 && p1.score > minScore && p2.score > minScore) {
            ctx.beginPath();
            ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
            ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
            ctx.stroke();
        }
    });
}

initDancePoseAnalyzer();

window.addEventListener("message", (event) => {
    if (event.data?.type === "FRAMEWISE_START_DANCE_POSE") {
        startDancePoseAnalyzer();
    }

    if (event.data?.type === "FRAMEWISE_STOP_DANCE_POSE") {
        stopDancePoseAnalyzer();
    }
});