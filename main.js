// ----- CONSTANTS ----- //
const cnst = {
  ROW_LEN: 64,
  COL_LEN: 25,
  FFT_SIZE: 128,
};

// ----- REFERENCES TO UI ELEMENTS ----- //
const ui = {
  // audio
  audio: document.getElementById("audio"),
  // buttons
  playBtn: document.getElementById("play-btn"),
  pauseBtn: document.getElementById("pause-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  backwardBtn: document.getElementById("backward-btn"),
  volumeHighBtn: document.getElementById("volume-high-btn"),
  mutedBtn: document.getElementById("muted-btn"),
  // progress bars
  songProgress: document.getElementById("controls-progress"),
  volumeProgress: document.getElementById("volume-progress"),
  // durations
  currDuration: document.getElementById("current-duration"),
  totalDuration: document.getElementById("total-duration"),
};

// references to the children of durations
ui.songProgress.filled = ui.songProgress.querySelector(".progress-filled");
ui.volumeProgress.filled = ui.volumeProgress.querySelector(".progress-filled");

// ----- STATES AND SETTERS ----- //
// initialize states with default values
const state = {
  isPlaying: false,
  setIsPlaying: (newVal) => {
    state.isPlaying = newVal;
  },
  isMuted: false,
  setIsMuted: (newVal) => {
    state.isMuted = newVal;
  },
  currVolume: ui.audio.volume,
  setCurrVolume: (newVal) => {
    state.currVolume = newVal;
  },
  songProgMousedown: false,
  setSongProgMousedown: (newVal) => {
    state.songProgMousedown = newVal;
  },
  volumeProgMousedown: false,
  setVolumeProgMousedown: (newVal) => {
    state.volumeProgMousedown = newVal;
  },
};

// ----- INITIALIZE AUDIO CONTEXT, ANALYSER, AND DATA_ARRAY ----- //
const audioCtx = new window.AudioContext();
const audioSource = audioCtx.createMediaElementSource(ui.audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = cnst.FFT_SIZE;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

// ----- EVENT HANDLERS ----- //
// audio event handlers
ui.audio.addEventListener("play", () => {
  updateGrids();
});

ui.audio.addEventListener("timeupdate", () => {
  updateProgress(ui.songProgress, (ui.audio.currentTime / ui.audio.duration) * 100);

  updateDurations();
});

ui.audio.addEventListener("ended", () => {
  state.isPlaying = false;

  updateProgress(ui.songProgress, 0);

  ui.audio.currentTime = 0;

  togglePlaybackBtn();
});

// button event handlers
ui.playBtn.addEventListener("click", () => {
  state.setIsPlaying(true);

  togglePlaybackBtn();

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  audioSource.connect(analyser);
  analyser.connect(audioCtx.destination);

  ui.audio.play();
});

ui.pauseBtn.addEventListener("click", () => {
  state.setIsPlaying(false);

  togglePlaybackBtn();

  ui.audio.pause();
});

ui.forwardBtn.addEventListener("click", () => {
  ui.audio.currentTime += 15;
});

ui.backwardBtn.addEventListener("click", () => {
  ui.audio.currentTime -= 15;
});

ui.volumeHighBtn.addEventListener("click", () => {
  state.setIsMuted(true);

  ui.audio.volume = 0;

  updateProgress(ui.volumeProgress, 0);

  toggleVolumeBtn();
});

ui.mutedBtn.addEventListener("click", () => {
  state.setIsMuted(false);

  ui.audio.volume = state.currVolume;

  updateProgress(ui.volumeProgress, ui.audio.volume * 100);

  toggleVolumeBtn();
});

// progress bar event handlers
const songScrub = (event) => {
  const scrubTime = (event.offsetX / ui.songProgress.offsetWidth) * ui.audio.duration;
  ui.audio.currentTime = scrubTime;
};

ui.songProgress.addEventListener("click", songScrub);
ui.songProgress.addEventListener("mousemove", (e) => state.songProgMousedown && songScrub(e));
ui.songProgress.addEventListener("mousedown", () => state.setSongProgMousedown(true));
ui.songProgress.addEventListener("mouseup", () => state.setSongProgMousedown(false));
ui.songProgress.addEventListener("mouseleave", () => state.setSongProgMousedown(false));

const volumeScrub = (event) => {
  ui.audio.volume = event.offsetX / ui.volumeProgress.offsetWidth;

  state.setCurrVolume(ui.audio.volume);

  updateProgress(ui.volumeProgress, ui.audio.volume * 100);
};

ui.volumeProgress.addEventListener("click", volumeScrub);
ui.volumeProgress.addEventListener("mousemove", (e) => state.volumeProgMousedown && volumeScrub(e));
ui.volumeProgress.addEventListener("mousedown", () => state.setVolumeProgMousedown(true));
ui.volumeProgress.addEventListener("mouseup", () => state.setVolumeProgMousedown(false));
ui.volumeProgress.addEventListener("mouseleave", () => state.setVolumeProgMousedown(false));

// ----- GRID CREATION FUNCTIONS ----- //
const createGrid = (gridContainerId, generateId, iStart, iEnd, jStart, jEnd) => {
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
const createGrids = () => {
  createGrid("left-grid-container", (i, j) => `left-${i}-${j}`, cnst.COL_LEN - 1, -1, cnst.ROW_LEN - 1, -1);
  createGrid("right-grid-container", (i, j) => `right-${i}-${j}`, cnst.COL_LEN - 1, -1, 0, cnst.ROW_LEN);
  createGrid("bottom-left-grid-container", (i, j) => `bottom-left-${i}-${j}`, 0, cnst.COL_LEN, cnst.ROW_LEN - 1, -1);
  createGrid("bottom-right-grid-container", (i, j) => `bottom-right-${i}-${j}`, 0, cnst.COL_LEN, 0, cnst.ROW_LEN);
};
const getHslColor = (index, soundIntensity) => {
  const hue = (360 / 30) * index;
  const saturation = "100%";
  const lightness = 50 + (soundIntensity / 30) * 50 + "%";
  const color = `hsl(${hue}, ${saturation}, ${lightness})`;
  return color;
};
const updateGrids = () => {
  analyser.getByteFrequencyData(dataArray);
  for (let j = 0; j < cnst.ROW_LEN; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 20);
    for (let i = 0; i < cnst.COL_LEN; i++) {
      const color = getHslColor(i, soundIntensity);
      document.getElementById(`left-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`right-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-left-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
      document.getElementById(`bottom-right-${i}-${j}`).style.backgroundColor = i < soundIntensity ? color : "#000";
    }
  }
  requestAnimationFrame(updateGrids);
};

// ----- HELPER FUNCTIONS ----- //
const togglePlaybackBtn = () => {
  if (state.isPlaying) {
    ui.playBtn.style.display = "none";
    ui.pauseBtn.style.display = "block";
  } else {
    ui.playBtn.style.display = "block";
    ui.pauseBtn.style.display = "none";
  }
};

const toggleVolumeBtn = () => {
  if (state.isMuted) {
    ui.volumeHighBtn.style.display = "none";
    ui.mutedBtn.style.display = "flex";
  } else {
    ui.volumeHighBtn.style.display = "flex";
    ui.mutedBtn.style.display = "none";
  }
};

const updateDurations = () => {
  const currentMinutes = Math.floor(ui.audio.currentTime / 60);
  const currentSeconds = Math.floor(ui.audio.currentTime % 60);
  ui.currDuration.textContent = `${currentMinutes}:${currentSeconds < 10 ? "0" : ""}${currentSeconds}`;

  const totalMinutes = Math.floor(ui.audio.duration / 60);
  const totalSeconds = Math.floor(ui.audio.duration % 60);
  ui.totalDuration.textContent = `${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
};

const updateProgress = (progress, percent) => {
  progress.filled.style.flexBasis = `${percent}%`;
};

// ----- APP INITIALIZATION FUNCTION ----- //
const initializeApp = () => {
  createGrids();

  togglePlaybackBtn();
  toggleVolumeBtn();

  ui.audio.addEventListener("loadedmetadata", () => {
    updateDurations();
  });

  updateProgress(ui.volumeProgress, ui.audio.volume * 100);
};

// ----- INITIALIZE APP ----- //
initializeApp();
