
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const hudCnt = document.getElementById("counter");
const hudSts = document.getElementById("status");
const flipBtn = document.getElementById("flip");

const audioEl = document.getElementById("audio");

// Web Audio API
// const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// const source = audioCtx.createMediaElementSource(audioEl);
const filter = audioCtx.createBiquadFilter();
filter.type = "lowpass";
// filter.frequency.value = 20000; // start with no cut
source.connect(filter).connect(audioCtx.destination);

let currentFacingMode = "user"; // ou "environment"
let handLandmarker;
let drawingUtils;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      // aspectRatio: { ideal: 9 / 16 },
      // orientation: "portrait",
      facingMode: { ideal: currentFacingMode },
      width: { ideal: 720 },
      height: { ideal: 1280 },
      frameRate: { ideal: 30, min: 15 },
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  resizeCanvas();

  // const audioEl = document.createElement("audio");
  // audioEl.crossOrigin = "anonymous";
  // audioEl.src = "audio.mp3";
  // audioEl.loop = true;
  // audioEl.play();
}

function resizeCanvas() {
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

// document.getElementById("startBtn").addEventListener("click", () => {
//   // Resume context on first gesture
//   if (audioCtx.state === "suspended") {
//     audioCtx.resume();
//   }
//   document.getElementById("startBtn").classList.add("hidden");
//   document.getElementById("stopBtn").classList.remove("hidden");
//   running = true;

//   audioEl.play();
// });

// document.getElementById("stopBtn").addEventListener("click", () => {
//   // Resume context on first gesture
//   if (audioCtx.state !== "suspended") {
//     audioCtx.suspend();
//   }
//   document.getElementById("startBtn").classList.remove("hidden");
//   document.getElementById("stopBtn").classList.add("hidden");
//   running = false;

//   audioEl.pause();
// });

async function boot() {
  try {
    hudSts.textContent = "Pedindo permissão da câmera…";
    await setupCamera();
    // await startLoop();
  } catch (err) {
    console.error(err);
    hudSts.textContent =
      "Erro ao acessar câmera ou carregar modelo. Veja o console.";
    alert("Falha ao inicializar: " + err.message);
  }
}

flipBtn.addEventListener("click", async () => {
  // alternar entre frontal/traseira (mobile)
  currentFacingMode =
    currentFacingMode === "user" ? "environment" : "user";
  await setupCamera();
});

boot();