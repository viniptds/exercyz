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


async function getAudio() {
  // Call fetch GET to /audio and apply #audio src
  const response = await fetch('/audio');
  const data = await response.json();
  if (data.success) {
    audioEl.src = data.audio ?? 'audio.mp3';
  } else {
    alert(data.error ?? 'Error fetching audio');
    audioEl.src = 'audio.mp3';
  }
}

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
}

function resizeCanvas() {
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

async function boot() {
  try {
    // Set audio src from .env
    await getAudio();

    hudSts.textContent = "Awaiting camera permission...";
    await setupCamera();

    // await startLoop();
  } catch (err) {
    console.error(err);
    hudSts.textContent =
      "Error on acessing camera ou loading model. Check your console.";
    // alert("Falha ao inicializar: " + err.message);
  }
}

flipBtn.addEventListener("click", async () => {
  // alternar entre frontal/traseira (mobile)
  if (currentFacingMode === "user") {
    video.classList.remove("reverse");
    currentFacingMode = "environment";
    // flipBtn.textContent = "Traseira";
  } else {
    video.classList.add("reverse");
    currentFacingMode = "user";
    // flipBtn.textContent = "Frontal";
  }
  await setupCamera();
});

boot();