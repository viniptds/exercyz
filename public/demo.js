import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

// URLs oficiais: wasm + modelo .task hospedados no jsDelivr/Google
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";


const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const hudCnt = document.getElementById("counter");
const hudSts = document.getElementById("status");

// let currentFacingMode = "user"; // ou "environment"
let handLandmarker;
let drawingUtils;
let running = true;

function countFingersForHand(landmarks, handednessLabel) {
  // IDs: polegar(4), indicador(8), médio(12), anelar(16), mindinho(20)
  const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
  const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };
  const IPthumb = 3; // articulação do polegar

  // dedos "retos" (exceto polegar): tip.y < pip.y (y menor = mais alto na imagem)
  const indexUp = landmarks[TIP.index].y < landmarks[PIP.index].y;
  const middleUp = landmarks[TIP.middle].y < landmarks[PIP.middle].y;
  const ringUp = landmarks[TIP.ring].y < landmarks[PIP.ring].y;
  const pinkyUp = landmarks[TIP.pinky].y < landmarks[PIP.pinky].y;

  // polegar depende da mão (compara eixo X)
  const rightHand = handednessLabel?.toLowerCase().includes("right");
  const thumbUp = rightHand
    ? landmarks[TIP.thumb].x > landmarks[IPthumb].x // mão direita: polegar à direita
    : landmarks[TIP.thumb].x < landmarks[IPthumb].x; // mão esquerda: polegar à esquerda

  const raised = [thumbUp, indexUp, middleUp, ringUp, pinkyUp];
  return { total: raised.filter(Boolean).length, raised };
}

async function initModel() {
  hudSts.textContent = "Carregando modelo…";
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    numHands: 2,
    runningMode: "VIDEO",
  });
  drawingUtils = new DrawingUtils(ctx);
  hudSts.textContent = "Modelo pronto.";
  document.getElementById("startBtn").classList.remove("hidden");
}

function drawResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let totalAllHands = 0;

  if (results.landmarks.length > 0) {
    const lm = results.landmarks[0];
    const curl = fingerCurlPercentAngle(lm, 5, 6, 8); // indicador
    // Mapear 0–100% para frequência 500–20000 Hz
    const freq = 500 + (1 - curl / 100) * (20000 - 500);
    filter.frequency.value = freq;

     // Update the ui filter percentage in the ui using a threshold from settimeout
    document.getElementById("filterPercent").textContent = `${curl}%`;

  }
  (results.landmarks || []).forEach((landmarks, i) => {
    const indexPercent = fingerCurlPercentAngle(landmarks, 5, 6, 8); // indicador
    const middlePercent = fingerCurlPercentAngle(landmarks, 9, 10, 12); // médio
    console.log(`Indicador: ${indexPercent}% dobrado`);

    // desenhar skeleton
    if (debug == true) {
      drawingUtils.drawConnectors(
        landmarks,
        HandLandmarker.HAND_CONNECTIONS,
        { lineWidth: 2 }
      );
      drawingUtils.drawLandmarks(landmarks, { radius: 3 });
    }

    // contagem por mão
    const label = results.handedness[i]?.[0]?.categoryName || "";
    const { total } = countFingersForHand(landmarks, label);
    totalAllHands += total;

    // rótulo por mão (próximo ao punho)
    // const wrist = landmarks[0];
    // const x = wrist.x * canvas.width;
    // const y = wrist.y * canvas.height - 10;
    // ctx.font = "600 14px ui-sans-serif, system-ui, -apple-system";
    // ctx.fillStyle = "rgba(0,0,0,0.5)";
    // ctx.fillRect(x - 4, y - 14, 80, 18);
    // ctx.fillStyle = "#fff";
    // ctx.fillText(`${label}: ${total}`, x, y);
  });

  hudCnt.textContent = `✋ ${totalAllHands}`;
  hudSts.textContent = results.landmarks?.length
    ? `Mãos detectadas: ${results.landmarks.length}`
    : "Nenhuma mão detectada";
}

async function startLoop() {
  if (!handLandmarker) await initModel();

  // sincroniza com os frames reais do vídeo
  const onFrame = (now, metadata) => {
    if (!running) return;

    const results = handLandmarker.detectForVideo(video, now);
    drawResults(results);

    // usa a API moderna quando disponível (melhor timing); fallback para rAF
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


function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function fingerCurlPercent(
  landmarks,
  mcpIndex,
  tipIndex,
  minDist,
  maxDist
) {
  const d = distance(landmarks[mcpIndex], landmarks[tipIndex]);
  const norm = Math.min(
    Math.max((maxDist - d) / (maxDist - minDist), 0),
    1
  );
  return Math.round(norm * 100); // 0 = estendido, 100 = fechado
}

function angleDegrees(a, b, c) {
  // b é o vértice (PIP)
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  const cosTheta = dot / (magAB * magCB);
  return Math.acos(Math.min(Math.max(cosTheta, -1), 1)) * (180 / Math.PI);
}

function fingerCurlPercentAngle(landmarks, mcpIndex, pipIndex, tipIndex) {
  const ang = angleDegrees(
    landmarks[mcpIndex],
    landmarks[pipIndex],
    landmarks[tipIndex]
  );
  // mapear: 180° (reto) → 0%, 60° (dobrado) → 100%
  const percent = (180 - ang) / (180 - 60);
  return Math.round(Math.min(Math.max(percent, 0), 1) * 100);
}

document.getElementById("startBtn").addEventListener("click", () => {
  // Resume context on first gesture
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  document.getElementById("startBtn").classList.add("hidden");
  document.getElementById("stopBtn").classList.remove("hidden");
  document.getElementById("filterPercent").classList.remove("hidden");
  // make #audio visible
  document.getElementById("audio").classList.remove("hidden");
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
  document.getElementById("audio").classList.add("hidden");
  document.getElementById("filterPercent").classList.add("hidden");
  running = false;

  if (debug == true) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  // alert('Seu treino acabou! Você fez ' + reps + ' repetições.');

  audioEl.pause();
});

if (running) {
  startLoop();
} else {
  initModel();
}