// ----- CONSTANTS ----- //
const cnst = {
  ROW_LEN: 50,
  COL_LEN: 50,
  FFT_SIZE: 128,
};

// ----- SONGS ----- //
const songs = [
  {
    name: "Rolling in the Deep",
    artist: "Adele",
    path: "adele",
    duration: "3:53",
  },
  {
    name: "Oбійми",
    artist: "Oкеан Eльзи",
    path: "okean-elzy",
    duration: "3:44",
  },
  {
    name: "Алдадын",
    artist: "Мирбек Атабеков",
    path: "mirbek",
    duration: "3:36",
  },
  {
    name: "Кукла колдуна",
    artist: "Король и Шут ",
    path: "korol-i-shut",
    duration: "3:22",
  },
];

// ----- REFERENCES TO UI ELEMENTS ----- //
const ui = {
  // audio
  audio: document.getElementById("audio"),
  // player
  player: document.getElementById("player"),
  // player buttons
  playBtn: document.getElementById("play-btn"),
  pauseBtn: document.getElementById("pause-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  backwardBtn: document.getElementById("backward-btn"),
  volumeHighBtn: document.getElementById("volume-high-btn"),
  makeBigBtn: document.getElementById("make-big-btn"),
  mutedBtn: document.getElementById("muted-btn"),
  hideBtn: document.getElementById("hide-btn"),
  showBtn: document.getElementById("show-btn"),
  // player progress bars
  songProgress: document.getElementById("controls-progress"),
  volumeProgress: document.getElementById("volume-progress"),
  // player durations
  currDuration: document.getElementById("current-duration"),
  totalDuration: document.getElementById("total-duration"),
  // playlist
  playlist: document.getElementById("playlist"),
  // current song
  currSong: document.getElementById("current-song"),
  // scene
  scene: document.getElementById("container"),
};

// references to the children of durations
ui.songProgress.filled = ui.songProgress.querySelector(".progress-filled");
ui.volumeProgress.filled = ui.volumeProgress.querySelector(".progress-filled");
// references to the children of current song
ui.currSong.poster = ui.currSong.querySelector("#song-poster");
ui.currSong.name = ui.currSong.querySelector("#song-name");
ui.currSong.artist = ui.currSong.querySelector("#song-artist");

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
  nowPlaying: null,
  setNowPlaying: (newVal) => {
    state.nowPlaying = newVal;
  },
  currSong: songs[0],
  setCurrSong: (newVal) => {
    state.setCurrSong = newVal;
  },
  isPlayerHidden: false,
  setIsPlayerHidden: (newVal) => {
    state.isPlayerHidden = newVal;
  },
  isPlaylistHidden: false,
  setIsPlaylistHidden: (newVal) => {
    state.isPlaylistHidden = newVal;
  },
  visualization: "canvas",
  setVisualization: (newVal) => {
    state.visualization = newVal;
  },
};

// ----- INITIALIZE AUDIO CONTEXT, ANALYSER, AND DATA_ARRAY ----- //

const audioCtx = new window.AudioContext();

const audioSource = audioCtx.createMediaElementSource(ui.audio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = cnst.FFT_SIZE;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

const populatePlaylist = () => {
  playlistInnerHtml = "";

  const thead = `
    <thead>
      <tr>
        <th class="util-btn-cell">#</th>
        <th class="poster-cell">Title</th>
        <th class="title-cell"></th>
        <th title="Duration" class="duration-cell"><img src="/svg/clock.svg" alt="clock icon"/></th>
      </tr>
    </thead>
  `;

  let tbody = "<tbody>";

  songs.forEach((song) => {
    tbody += `
    <tr id="${song.path}-playlist-song" class="playlist-song">
      <td class="util-btn-cell">
        <p>${songs.indexOf(song) + 1}</p>
        <img class="playlist-play-btn" src="/svg/play.svg" alt="play icon" />
        <img class="playlist-pause-btn" src="/svg/pause.svg" alt="pause icon" />
        <div class="now-playing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </td>

      <td class="poster-cell">
        <img src="/posters/${song.path}.jpg" alt="${song.name} by ${
      song.artist
    }" />
      </td>

      <td class="title-cell">
        <h3>${song.name}</h3>
        <p>${song.artist}</p>
      </td>

      <td class="duration-cell">
        <p>${song.duration}</p>
      </td>
    </tr>
    `;
  });

  tbody += "</tbody>";

  const makeSmallBtn = `
    <button id="make-small-btn" type="button" title="Hide playlist">
      <img src="/svg/make-small.svg" alt="make small icon" />
    </button>
  `;

  playlistInnerHtml = thead + tbody + makeSmallBtn;

  ui.playlist.innerHTML = playlistInnerHtml;
};

// ----- POPULATE PLAYLIST TABLE ----- //
populatePlaylist();
ui.makeSmallBtn = document.getElementById("make-small-btn");

/* ----- EVENT HANDLERS ----- */

/* ----- audio ----- */

/* while the audio is playing, it should be updating the scene where the audio is visualized. TODO: construct a scene changing logic */
ui.audio.addEventListener("play", () => {
  if (state.visualization === "grid") {
    updateGrids();
  } else {
    updateCanvasRectGrid();
  }
});

ui.audio.addEventListener("timeupdate", () => {
  updateProgress(
    ui.songProgress,
    (ui.audio.currentTime / ui.audio.duration) * 100
  );

  updateDurations();
});

ui.audio.addEventListener("ended", () => {
  state.setIsPlaying(false);

  updateProgress(ui.songProgress, 0);

  ui.audio.currentTime = 0;

  togglePlaybackBtn();

  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".now-playing").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".playlist-pause-btn").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector("p").style.display = "block";
});

// button event handlers

// makes playlist element shrink and dissappear
ui.makeSmallBtn.addEventListener("click", () => {
  state.setIsPlaylistHidden(true);

  if (state.isPlayerHidden) {
    ui.makeBigBtn.style.translate = "0 104px";
    ui.playlist.style.translate = "0 104px";
  }

  ui.makeBigBtn.style.display = "block";
  ui.makeBigBtn.style.animation = undefined;
  ui.playlist.style.animation =
    "getSmall 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
});

ui.makeBigBtn.addEventListener("click", () => {
  state.setIsPlaylistHidden(false);

  ui.playlist.style.animation =
    "getBig 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
  ui.makeBigBtn.style.display = "none";
});

ui.hideBtn.addEventListener("click", () => {
  state.setIsPlayerHidden(true);

  ui.showBtn.style.display = "block";

  ui.player.style.animation = "2s hide cubic-bezier(0.19, 1, 0.22, 1) forwards";

  if (state.isPlaylistHidden) {
    ui.playlist.style.translate = "0 104px";
    ui.makeBigBtn.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;
  } else {
    ui.playlist.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.makeBigBtn.style.translate = "0 104px";
  }
});

ui.showBtn.addEventListener("click", () => {
  state.setIsPlayerHidden(false);

  ui.showBtn.style.display = "none";

  ui.player.style.animation = "2s show cubic-bezier(0.19, 1, 0.22, 1) forwards";

  if (state.isPlaylistHidden) {
    ui.makeBigBtn.style.translate = "0";
    ui.makeBigBtn.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.playlist.style.translate = "0";
  } else {
    ui.playlist.style.translate = "0";
    ui.playlist.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.makeBigBtn.style.translate = "0";
  }
});

ui.playBtn.addEventListener("click", () => {
  state.setIsPlaying(true);

  togglePlaybackBtn();

  if (audioCtx.state === "suspended") audioCtx.resume();

  audioSource.connect(analyser);
  analyser.connect(audioCtx.destination);

  ui.audio.play();

  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".playlist-play-btn").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".playlist-pause-btn").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector("p").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".now-playing").style.display = "flex";

  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".util-btn-cell").style.color = "var(--yellow)";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector("h3").style.color = "var(--yellow)";
});

ui.pauseBtn.addEventListener("click", () => {
  state.setIsPlaying(false);

  togglePlaybackBtn();

  ui.audio.pause();

  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector(".now-playing").style.display = "none";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector("p").style.display = "block";
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
  const scrubTime =
    (event.offsetX / ui.songProgress.offsetWidth) * ui.audio.duration;
  ui.audio.currentTime = scrubTime;
};

ui.songProgress.addEventListener("click", songScrub);
ui.songProgress.addEventListener(
  "mousemove",
  (e) => state.songProgMousedown && songScrub(e)
);
ui.songProgress.addEventListener("mousedown", () =>
  state.setSongProgMousedown(true)
);
ui.songProgress.addEventListener("mouseup", () =>
  state.setSongProgMousedown(false)
);
ui.songProgress.addEventListener("mouseleave", () =>
  state.setSongProgMousedown(false)
);

const volumeScrub = (event) => {
  ui.audio.volume = event.offsetX / ui.volumeProgress.offsetWidth;

  state.setCurrVolume(ui.audio.volume);

  updateProgress(ui.volumeProgress, ui.audio.volume * 100);
};

ui.volumeProgress.addEventListener("click", volumeScrub);
ui.volumeProgress.addEventListener(
  "mousemove",
  (e) => state.volumeProgMousedown && volumeScrub(e)
);
ui.volumeProgress.addEventListener("mousedown", () =>
  state.setVolumeProgMousedown(true)
);
ui.volumeProgress.addEventListener("mouseup", () =>
  state.setVolumeProgMousedown(false)
);
ui.volumeProgress.addEventListener("mouseleave", () =>
  state.setVolumeProgMousedown(false)
);

// ----- GRID CREATION FUNCTIONS ----- //
const createGrid = (
  gridContainerId,
  generateId,
  iStart,
  iEnd,
  jStart,
  jEnd
) => {
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
  ui.scene.style.display = "grid";
  ui.scene.style.gridTemplateColumns = "1fr 1fr";
  ui.scene.style.gridTemplateRows = "1fr 1fr";
  ui.scene.style.gap = "2px";

  createGrid(
    "left-grid-container",
    (i, j) => `left-${i}-${j}`,
    cnst.COL_LEN - 1,
    -1,
    cnst.ROW_LEN - 1,
    -1
  );
  createGrid(
    "right-grid-container",
    (i, j) => `right-${i}-${j}`,
    cnst.COL_LEN - 1,
    -1,
    0,
    cnst.ROW_LEN
  );
  createGrid(
    "bottom-left-grid-container",
    (i, j) => `bottom-left-${i}-${j}`,
    0,
    cnst.COL_LEN,
    cnst.ROW_LEN - 1,
    -1
  );
  createGrid(
    "bottom-right-grid-container",
    (i, j) => `bottom-right-${i}-${j}`,
    0,
    cnst.COL_LEN,
    0,
    cnst.ROW_LEN
  );
};
const getHslColor = (index, soundIntensity) => {
  const hue = (360 / 30) * index;
  const saturation = "100%";
  const lightness = 50 + (soundIntensity / 60) * 10 + "%";
  const color = `hsl(${hue}, ${saturation}, ${lightness})`;
  return color;
};
const updateGrids = () => {
  analyser.getByteFrequencyData(dataArray);
  for (let j = 0; j < cnst.ROW_LEN; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 20);
    for (let i = 0; i < cnst.COL_LEN; i++) {
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

const toggleNowPlaying = (animatingElement) => {
  if (state.nowPlaying != null) {
    state.nowPlaying.style.display = "none";
  }

  animatingElement.style.display = "flex";
  state.nowPlaying = animatingElement;
};

const updateDurations = () => {
  const currentMinutes = Math.floor(ui.audio.currentTime / 60);
  const currentSeconds = Math.floor(ui.audio.currentTime % 60);
  ui.currDuration.textContent = `${currentMinutes}:${
    currentSeconds < 10 ? "0" : ""
  }${currentSeconds}`;

  const totalMinutes = Math.floor(ui.audio.duration / 60);
  const totalSeconds = Math.floor(ui.audio.duration % 60);
  ui.totalDuration.textContent = `${totalMinutes}:${
    totalSeconds < 10 ? "0" : ""
  }${totalSeconds}`;
};

const updateProgress = (progress, percent) => {
  progress.filled.style.flexBasis = `${percent}%`;
};

// ----- APP INITIALIZATION FUNCTION ----- //
const initializeApp = () => {
  createScene(state.visualization);

  if (state.visualization === "grid") {
    createGrids();
  } else if (state.visualization === "canvas") {
    // createCanvas
  }
  togglePlaybackBtn();
  toggleVolumeBtn();

  ui.audio.addEventListener("loadedmetadata", () => {
    updateDurations();
  });

  updateProgress(ui.volumeProgress, ui.audio.volume * 100);

  initializeCurrSongData();
};

/* ------ SONG ELEMENTS IN THE PLAYLIST ------ */
songs.forEach((song) => {
  document
    .getElementById(`${song.path}-playlist-song`)
    .addEventListener("click", () => {
      songs.forEach((song) => {
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".util-btn-cell").style.color = "var(--grey)";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector("h3").style.color = "var(--white)";
      });
      document
        .getElementById(`${song.path}-playlist-song`)
        .querySelector(".util-btn-cell").style.color = "var(--yellow)";
      document
        .getElementById(`${song.path}-playlist-song`)
        .querySelector("h3").style.color = "var(--yellow)";

      if (state.isPlaying && state.currSong === song) {
        state.setIsPlaying(false);

        togglePlaybackBtn();

        ui.audio.pause();

        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".now-playing").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-pause-btn").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector("p").style.display = "block";
      } else {
        ui.audio.src = `/audio/${song.path}.mp3`;

        if (audioCtx.state === "suspended") audioCtx.resume();

        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);

        ui.audio.play();

        ui.currSong.poster.src = `/posters/${song.path}.jpg`;
        ui.currSong.poster.alt = `${song.name} by ${song.artist}`;
        ui.currSong.name.textContent = song.name;
        ui.currSong.artist.textContent = song.artist;

        state.currSong = song;

        state.setIsPlaying(true);
        togglePlaybackBtn();

        songs.forEach((song) => {
          document
            .getElementById(`${song.path}-playlist-song`)
            .querySelector(".now-playing").style.display = "none";
          document
            .getElementById(`${song.path}-playlist-song`)
            .querySelector("p").style.display = "block";
        });

        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-play-btn").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-pause-btn").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector("p").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".now-playing").style.display = "flex";
      }
    });

  document
    .getElementById(`${song.path}-playlist-song`)
    .addEventListener("mouseover", () => {
      if (state.isPlaying && state.currSong === song) {
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".now-playing").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-pause-btn").style.display = "block";
      } else {
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector("p").style.display = "none";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-play-btn").style.display = "block";
      }
    });

  document
    .getElementById(`${song.path}-playlist-song`)
    .addEventListener("mouseout", () => {
      if (state.isPlaying && state.currSong === song) {
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".now-playing").style.display = "flex";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-pause-btn").style.display = "none";
      } else {
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector("p").style.display = "block";
        document
          .getElementById(`${song.path}-playlist-song`)
          .querySelector(".playlist-play-btn").style.display = "none";
      }
    });
});

const initializeCurrSongData = () => {
  ui.currSong.poster.src = `/posters/${songs[0].path}.jpg`;
  ui.currSong.poster.alt = `${songs[0].name} by ${songs[0].artist}`;
  ui.currSong.name.textContent = `${songs[0].name}`;
  ui.currSong.artist.textContent = songs[0].artist;
};

const createScene = (sceneType) => {
  switch (sceneType) {
    case "grid":
      ui.scene.innerHTML = `<div class="grid-container" id="left-grid-container"></div>
      <div class="grid-container" id="right-grid-container"></div>
      <div class="grid-container" id="bottom-left-grid-container"></div>
      <div class="grid-container" id="bottom-right-grid-container"></div>`;
      break;
    case "canvas":
      ui.scene.innerHTML = `<canvas width="100%" height="100%">`;
      break;
  }
};

const updateCanvasRectGrid = () => {
  const canvas = ui.scene.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  analyser.getByteFrequencyData(dataArray);
  const width = canvas.width / 2;
  const height = canvas.height / 2;

  for (let j = 0; j < cnst.ROW_LEN + 1; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 12);

    for (let i = 0; i < cnst.COL_LEN + 1; i++) {
      const color = getHslColor(i, soundIntensity);
      const pixelHeight = height / cnst.ROW_LEN;
      const pixelWidth = width / cnst.COL_LEN;

      ctx.fillStyle = i < soundIntensity ? color : "#000";

      // Top-left quadrant
      ctx.fillRect(
        (cnst.COL_LEN - j) * pixelWidth,
        (cnst.ROW_LEN - i) * pixelHeight,
        pixelWidth,
        pixelHeight
      );

      // Bottom-right quadrant
      ctx.fillRect(
        width + j * pixelWidth,
        height + i * pixelHeight,
        pixelWidth,
        pixelHeight
      );

      // Top-right quadrant
      ctx.fillRect(
        width + j * pixelWidth,
        (cnst.ROW_LEN - i) * pixelHeight,
        pixelWidth,
        pixelHeight
      );

      // Bottom-left quadrant
      ctx.fillRect(
        (cnst.COL_LEN - j) * pixelWidth,
        height + i * pixelHeight,
        pixelWidth,
        pixelHeight
      );
    }
  }

  requestAnimationFrame(updateCanvasRectGrid);
};

// ----- INITIALIZE APP ----- //
initializeApp();
