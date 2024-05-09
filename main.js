const ui = {
  audio: document.getElementById("audio"),
  playBtn: document.getElementById("play-btn"),
  pauseBtn: document.getElementById("pause-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  backwardBtn: document.getElementById("backward-btn"),
  controlsProgress: document.getElementById("controls-progress"),
  volumeProgress: document.getElementById("volume-progress"),
  currentDuration: document.getElementById("current-duration"),
  totalDuration: document.getElementById("total-duration"),
};

ui.controlsProgress.filled = ui.controlsProgress.querySelector(".progress-filled");
ui.volumeProgress.filled = ui.volumeProgress.querySelector(".progress-filled");

const state = {
  isPlaying: false,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const audioSource = audioCtx.createMediaElementSource(ui.audio);
let analyser = audioCtx.createAnalyser();
analyser.fftSize = 128;
let dataArray = new Uint8Array(analyser.frequencyBinCount);

const ROW_LENGTH = 64;
const COL_LENGTH = 25;

let createGrid = (gridContainerId, generateId, iStart, iEnd, jStart, jEnd) => {
  const gridContainer = document.getElementById(gridContainerId);
  for (let i = iStart; i !== iEnd; iEnd > iStart ? i++ : i--) {
    for (let j = jStart; j !== jEnd; jEnd > jStart ? j++ : j--) {
      const gridItem = document.createElement("div");
      gridItem.classList.add("grid-item");
      gridItem.setAttribute("id", generateId(i, j));
      gridContainer.appendChild(gridItem);
    }
  }
};

let createGrids = () => {
  createGrid("left-grid-container", (i, j) => `left-${i}-${j}`, COL_LENGTH - 1, -1, ROW_LENGTH - 1, -1);
  createGrid("right-grid-container", (i, j) => `right-${i}-${j}`, COL_LENGTH - 1, -1, 0, ROW_LENGTH);
  createGrid("bottom-left-grid-container", (i, j) => `bottom-left-${i}-${j}`, 0, COL_LENGTH, ROW_LENGTH - 1, -1);
  createGrid("bottom-right-grid-container", (i, j) => `bottom-right-${i}-${j}`, 0, COL_LENGTH, 0, ROW_LENGTH);
};

let getHslColor = (index, soundIntensity) => {
  const hue = (360 / 30) * index;
  const saturation = "100%";
  const lightness = 50 + (soundIntensity / 30) * 50 + "%";
  const color = `hsl(${hue}, ${saturation}, ${lightness})`;
  return color;
};

let updateGrids = () => {
  analyser.getByteFrequencyData(dataArray);
  for (let j = 0; j < ROW_LENGTH; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 20);
    for (let i = 0; i < COL_LENGTH; i++) {
      const color = getHslColor(i, soundIntensity);
      document.getElementById(`left-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`right-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-left-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-right-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
    }
  }
  requestAnimationFrame(updateGrids);
};

ui.audio.addEventListener("play", () => {
  updateGrids();
});

const togglePlaybackBtn = () => {
  if (state.isPlaying) {
    ui.playBtn.classList.add("hidden");
    ui.pauseBtn.classList.remove("hidden");
  } else {
    ui.playBtn.classList.remove("hidden");
    ui.pauseBtn.classList.add("hidden");
  }
};

ui.playBtn.addEventListener("click", () => {
  state.isPlaying = !state.isPlaying;

  togglePlaybackBtn();

  if (state.isPlaying) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);

    ui.audio.play();
  } else {
    ui.audio.pause();
  }
});

ui.pauseBtn.addEventListener("click", () => {
  state.isPlaying = !state.isPlaying;

  togglePlaybackBtn();

  if (state.isPlaying) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);

    ui.audio.play();
  } else {
    ui.audio.pause();
  }
});

let controlsMousedown = false;
let volumeMousedown = false;

function controlsScrub(event) {
  const scrubTime = (event.offsetX / ui.controlsProgress.offsetWidth) * ui.audio.duration;
  ui.audio.currentTime = scrubTime;
}

ui.controlsProgress.addEventListener("click", controlsScrub);
ui.controlsProgress.addEventListener("mousemove", (e) => controlsMousedown && controlsScrub(e));
ui.controlsProgress.addEventListener("mousedown", () => (controlsMousedown = true));
ui.controlsProgress.addEventListener("mouseup", () => (controlsMousedown = false));
ui.controlsProgress.addEventListener("mouseleave", () => (controlsMousedown = false));

ui.volumeProgress.addEventListener("input", () => {
  ui.audio.volume = ui.volumeProgress.value;
  console.log(ui.volumeProgress.value);
});

ui.forwardBtn.addEventListener("click", () => {
  ui.audio.currentTime += 15;
});

ui.backwardBtn.addEventListener("click", () => {
  ui.audio.currentTime -= 15;
});

ui.audio.addEventListener("timeupdate", () => {
  const percent = (ui.audio.currentTime / ui.audio.duration) * 100;
  ui.controlsProgress.filled.style.flexBasis = `${percent}%`;

  updateDurations();
});

ui.audio.addEventListener("ended", () => {
  state.isPlaying = false;
  ui.controlsProgress.filled.style.flexBasis = "0%";
  ui.audio.currentTime = 0;

  togglePlaybackBtn();
});

const updateDurations = () => {
  const currentMinutes = Math.floor(ui.audio.currentTime / 60);
  const currentSeconds = Math.floor(ui.audio.currentTime % 60);
  ui.currentDuration.textContent = `${currentMinutes}:${currentSeconds < 10 ? "0" : ""}${currentSeconds}`;

  const totalMinutes = Math.floor(ui.audio.duration / 60);
  const totalSeconds = Math.floor(ui.audio.duration % 60);
  ui.totalDuration.textContent = `${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
};

ui.audio.addEventListener("loadedmetadata", () => {
  updateDurations();
});

createGrids();
togglePlaybackBtn();
updateDurations();
