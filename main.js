const ui = {
  audio: document.getElementById("audio"),

  playbackBtn: document.getElementById("playback-btn"),
  forwardStepBtn: document.getElementById("forward-step-btn"),
  backwardStepBtn: document.getElementById("backward-step-btn"),
  controlsProgress: document.getElementById("controls__progress"),
};

ui.playbackBtn.img = ui.playbackBtn.querySelector("img");
ui.controlsProgress.filled = ui.controlsProgress.querySelector(".progress__filled");

const state = {
  isPlaying: false,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const audioSource = audioCtx.createMediaElementSource(ui.audio);
let analyser = audioCtx.createAnalyser();
analyser.fftSize = 128;
let dataArray = new Uint8Array(analyser.frequencyBinCount);

const ROW_LENGTH = 64;
const COL_LENGTH = 30;
/* const SONG_NAMES = ["adele", "mirbek", "skryptonite"]; */

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
  createGrid(
    "left-grid-container",
    (i, j) => `left-${i}-${j}`,
    COL_LENGTH - 1,
    -1,
    ROW_LENGTH - 1,
    -1
  );
  createGrid(
    "right-grid-container",
    (i, j) => `right-${i}-${j}`,
    COL_LENGTH - 1,
    -1,
    0,
    ROW_LENGTH
  );
  createGrid(
    "bottom-left-grid-container",
    (i, j) => `bottom-left-${i}-${j}`,
    0,
    COL_LENGTH,
    ROW_LENGTH - 1,
    -1
  );
  createGrid(
    "bottom-right-grid-container",
    (i, j) => `bottom-right-${i}-${j}`,
    0,
    COL_LENGTH,
    0,
    ROW_LENGTH
  );
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
      document.getElementById(`left-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : "#000";
      document.getElementById(`right-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-left-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-right-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : "#000";
    }
  }
  requestAnimationFrame(updateGrids);
};

/* document.getElementById("audio-file").addEventListener("change", function () {
  audioUrl = URL.createObjectURL(this.files[0]);
  ui.audio.src = audioUrl;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  audioSource.connect(analyser);
  analyser.connect(audioCtx.destination);
}); */

/* SONG_NAMES.forEach((song) => {
  document.getElementById(song).addEventListener("click", () => {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    if (!ui.audio.paused) {
      ui.audio.pause();
      ui.audio.currentTime = 0;
    }
    ui.audio.src = `/audio/${song}.mp3`;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    ui.audio.play();
  });
}); */

/* document.getElementById("audio-player").addEventListener("play", () => {
  updateGrids();
}); */

ui.audio.addEventListener("play", () => {
  updateGrids();
});

const togglePlaybackBtn = () => {
  ui.playbackBtn.img.src = state.isPlaying ? "/svg/pause.svg" : "/svg/play.svg";
};

ui.playbackBtn.addEventListener("click", () => {
  state.isPlaying = !state.isPlaying;

  togglePlaybackBtn();

  if (state.isPlaying) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);

    ui.audio.play();
  } else {
    ui.audio.pause();
  }
});

ui.forwardStepBtn.addEventListener("click", () => {
  ui.audio.currentTime += 15;
});

ui.backwardStepBtn.addEventListener("click", () => {
  ui.audio.currentTime -= 15;
});

ui.audio.addEventListener("timeupdate", () => {
  const percent = (ui.audio.currentTime / ui.audio.duration) * 100;
  ui.controlsProgress.filled.style.flexBasis = `${percent}%`;
});

ui.audio.addEventListener("ended", () => {
  state.isPlaying = false;
  ui.controlsProgress.filled.style.flexBasis = "0%";
  ui.audio.currentTime = 0;

  togglePlaybackBtn();
});

createGrids();
