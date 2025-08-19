import {
    FilesetResolver,
    DrawingUtils,
    PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const hudCnt = document.getElementById("counter");
const hudSts = document.getElementById("status");

let poseLandmarker;
let drawingUtils;
let reps = 0;
let leftPunching = false;
let rightPunching = false;

async function initModel() {
    hudSts.textContent = "Loading model...";
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "VIDEO"
    });
    drawingUtils = new DrawingUtils(ctx);
    hudSts.textContent = "Model ready.";
    hudCnt.textContent = `🥊 Reps: ${reps}`;
    document.getElementById("startBtn").classList.remove("hidden");
}

function getAngle(a, b, c) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const abLen = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const cbLen = Math.sqrt(cb.x ** 2 + cb.y ** 2);
    return Math.acos(dot / (abLen * cbLen)) * (180 / Math.PI);
}

function detectPunches(landmarks) {
    const leftElbowAngle = getAngle(
        landmarks[11], // LEFT_SHOULDER
        landmarks[13], // LEFT_ELBOW
        landmarks[15]  // LEFT_WRIST
    );

    const rightElbowAngle = getAngle(
        landmarks[12], // RIGHT_SHOULDER
        landmarks[14], // RIGHT_ELBOW
        landmarks[16]  // RIGHT_WRIST
    );

    const PUNCH_THRESHOLD = 160; // arm almost straight
    const RETRACT_THRESHOLD = 100; // arm bent again

    // LEFT ARM
    if (!leftPunching && leftElbowAngle > PUNCH_THRESHOLD) {
        leftPunching = true; // punch started
    }
    if (leftPunching && leftElbowAngle < RETRACT_THRESHOLD) {
        reps++;
        leftPunching = false; // reset for next punch
    }

    // RIGHT ARM
    if (!rightPunching && rightElbowAngle > PUNCH_THRESHOLD) {
        rightPunching = true;
    }
    if (rightPunching && rightElbowAngle < RETRACT_THRESHOLD) {
        reps++;
        rightPunching = false;
    }

    hudCnt.textContent = `🥊 Reps: ${reps}`;
}

function drawResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.landmarks.length > 0) {
        const lm = results.landmarks[0];
        detectPunches(lm);
        if (debug == true) {
            drawingUtils.drawLandmarks(lm, { radius: 4, color: "red" });
            drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
                lineWidth: 2
            });
        }
    }
}

async function startLoop() {
    if (!poseLandmarker) await initModel();

    const onFrame = (now, metadata) => {
        if (!running) return;
        const results = poseLandmarker.detectForVideo(video, now);
        drawResults(results);

        if (video.requestVideoFrameCallback) {
            video.requestVideoFrameCallback(onFrame);
        } else {
            requestAnimationFrame((t) => onFrame(t, null));
        }
    };

    if (video.requestVideoFrameCallback) {
        video.requestVideoFrameCallback(onFrame);
    } else {
        requestAnimationFrame((t) => onFrame(t, null));
    }
}

document.getElementById("startBtn").addEventListener("click", () => {
    reps = 0;
    // Resume context on first gesture
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    document.getElementById("startBtn").classList.add("hidden");
    document.getElementById("stopBtn").classList.remove("hidden");
    if (running == false) {
        running = true;
        startLoop();
    }
    audioEl.play();
});

document.getElementById("stopBtn").addEventListener("click", () => {
    // Resume context on first gesture
    if (audioCtx.state !== "suspended") {
        audioCtx.suspend();
    }
    document.getElementById("startBtn").classList.remove("hidden");
    document.getElementById("stopBtn").classList.add("hidden");
    running = false;
    if (debug == true) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    alert("Your training is over! You've done " + reps + ' reps.');
    audioEl.pause();
});

if (running) {
    startLoop();
} else {
    initModel();
}