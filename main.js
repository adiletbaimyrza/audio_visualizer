// ----- CONSTANTS ----- //
const cnst = {
  ROW_LEN: 50,
  COL_LEN: 50,
  FFT_SIZE: 128,
};

let animationRequestId;

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
  makeSmallBtn: document.getElementById("make-small-btn"),
  mutedBtn: document.getElementById("muted-btn"),
  hideBtn: document.getElementById("hide-btn"),
  showBtn: document.getElementById("show-btn"),
  forwardStepBtn: document.getElementById("forward-step-btn"),
  backwardStepBtn: document.getElementById("backward-step-btn"),
  fullScreenBtn: document.getElementById("full-screen-btn"),
  microphoneBtn: document.getElementById("microphone-btn"),
  // scene change buttons
  gridSceneBtn: document.getElementById("canvas-rect-grid"),
  linesSceneBtn: document.getElementById("canvas-lines"),
  sphereSceneBtn: document.getElementById("three-d-sphere"),
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
  isLive: false,
  setIsLive: (newVal) => {
    state.isLive = newVal;
  },
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
  scene: "grid",
  setScene: (newVal) => {
    state.scene = newVal;
  },
  songId: 0,
  setSongId: (newVal) => {
    state.songId = newVal;
  },
};

// ----- INITIALIZE AUDIO CONTEXT, ANALYSER, AND DATA_ARRAY ----- //

let audioCtx = new window.AudioContext();

let audioSource = audioCtx.createMediaElementSource(ui.audio);
let analyser = audioCtx.createAnalyser();
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
        <img src="/posters/${song.path}.webp" alt="${song.name} by ${
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

  playlistInnerHtml = thead + tbody;

  ui.playlist.innerHTML = playlistInnerHtml;
};

// ----- POPULATE PLAYLIST TABLE ----- //
populatePlaylist();

/* ----- EVENT HANDLERS ----- */

/* ----- audio ----- */

/* while the audio is playing, it should be updating the scene where the audio is visualized. TODO: construct a scene changing logic */
ui.audio.addEventListener("play", () => {
  if (state.scene === "grid") {
    if (animationRequestId) {
      cancelAnimationFrame(animationRequestId);
    }
    updateGridScene();
  } else if (state.scene === "waves") {
    if (animationRequestId) {
      cancelAnimationFrame(animationRequestId);
    }
    updateWaveScene();
  } else if (state.scene === "background") {
    if (animationRequestId) {
      cancelAnimationFrame(animationRequestId);
    }
    updateBackgroundScene();
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

ui.forwardStepBtn.addEventListener("click", () => {
  const newSongId = Math.abs(state.songId + 1) % 4;
  state.setSongId(newSongId);
  const nextSong = songs[state.songId];

  songs.forEach((song) => {
    document
      .getElementById(`${song.path}-playlist-song`)
      .querySelector(".util-btn-cell").style.color = "var(--grey)";
    document
      .getElementById(`${song.path}-playlist-song`)
      .querySelector("h3").style.color = "var(--white)";
  });

  document
    .getElementById(`${nextSong.path}-playlist-song`)
    .querySelector(".util-btn-cell").style.color = "var(--now-playing)";
  document
    .getElementById(`${nextSong.path}-playlist-song`)
    .querySelector("h3").style.color = "var(--now-playing)";

  if (state.isPlaying && state.currSong === nextSong) {
    state.setIsPlaying(false);

    togglePlaybackBtn();

    ui.audio.pause();

    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector(".now-playing").style.display = "none";
    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector(".playlist-pause-btn").style.display = "none";
    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector("p").style.display = "block";
  } else {
    ui.audio.src = `/audio/${nextSong.path}.mp3`;

    if (audioCtx.state === "suspended") audioCtx.resume();

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);

    ui.audio.play();

    ui.currSong.poster.src = `/posters/${nextSong.path}.webp`;
    ui.currSong.poster.alt = `${nextSong.name} by ${nextSong.artist}`;
    ui.currSong.name.textContent = nextSong.name;
    ui.currSong.artist.textContent = nextSong.artist;

    state.currSong = nextSong;

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
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector(".playlist-play-btn").style.display = "none";
    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector(".playlist-pause-btn").style.display = "none";
    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector("p").style.display = "none";
    document
      .getElementById(`${nextSong.path}-playlist-song`)
      .querySelector(".now-playing").style.display = "flex";
  }
});

ui.backwardStepBtn.addEventListener("click", () => {
  const newSongId = state.songId === 0 ? 4 : state.songId - 1;
  state.setSongId(newSongId);
  const prevSong = songs[state.songId];

  songs.forEach((song) => {
    document
      .getElementById(`${song.path}-playlist-song`)
      .querySelector(".util-btn-cell").style.color = "var(--grey)";
    document
      .getElementById(`${song.path}-playlist-song`)
      .querySelector("h3").style.color = "var(--white)";
  });

  document
    .getElementById(`${prevSong.path}-playlist-song`)
    .querySelector(".util-btn-cell").style.color = "var(--now-playing)";
  document
    .getElementById(`${prevSong.path}-playlist-song`)
    .querySelector("h3").style.color = "var(--now-playing)";

  if (state.isPlaying && state.currSong === prevSong) {
    state.setIsPlaying(false);

    togglePlaybackBtn();

    ui.audio.pause();

    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector(".now-playing").style.display = "none";
    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector(".playlist-pause-btn").style.display = "none";
    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector("p").style.display = "block";
  } else {
    ui.audio.src = `/audio/${prevSong.path}.mp3`;

    if (audioCtx.state === "suspended") audioCtx.resume();

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);

    ui.audio.play();

    ui.currSong.poster.src = `/posters/${prevSong.path}.webp`;
    ui.currSong.poster.alt = `${prevSong.name} by ${prevSong.artist}`;
    ui.currSong.name.textContent = prevSong.name;
    ui.currSong.artist.textContent = prevSong.artist;

    state.currSong = prevSong;

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
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector(".playlist-play-btn").style.display = "none";
    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector(".playlist-pause-btn").style.display = "none";
    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector("p").style.display = "none";
    document
      .getElementById(`${prevSong.path}-playlist-song`)
      .querySelector(".now-playing").style.display = "flex";
  }
});

ui.gridSceneBtn.addEventListener("click", () => {
  state.setScene("grid");
  console.log(state.scene);
  ui.audio.pause();
  ui.audio.play();
});

ui.sphereSceneBtn.addEventListener("click", () => {
  state.setScene("background");
  console.log(state.scene);
  ui.audio.pause();
  ui.audio.play();
});

ui.linesSceneBtn.addEventListener("click", () => {
  state.setScene("waves");
  console.log(state.scene);
  ui.audio.pause();
  ui.audio.play();
});

// makes playlist element shrink and dissappear
ui.makeSmallBtn.addEventListener("click", () => {
  state.setIsPlaylistHidden(true);

  if (state.isPlayerHidden) {
    ui.makeBigBtn.style.translate = "0 112px";
    ui.makeSmallBtn.style.translate = "0 112px";
    ui.playlist.style.translate = "0 112px";
  }

  ui.makeSmallBtn.style.display = "none";
  ui.makeBigBtn.style.display = "block";
  ui.makeBigBtn.style.animation = undefined;
  ui.makeSmallBtn.style.animation = undefined;
  ui.playlist.style.animation =
    "getSmall 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
});

ui.makeBigBtn.addEventListener("click", () => {
  state.setIsPlaylistHidden(false);

  setTimeout(() => {
    ui.makeSmallBtn.style.display = "block";
  }, 90);

  ui.playlist.style.animation =
    "getBig 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
  ui.makeBigBtn.style.display = "none";
});

ui.hideBtn.addEventListener("click", () => {
  state.setIsPlayerHidden(true);

  ui.showBtn.style.display = "block";
  ui.hideBtn.style.display = "none";

  ui.player.style.animation = "2s hide cubic-bezier(0.19, 1, 0.22, 1) forwards";
  ui.showBtn.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;

  if (state.isPlaylistHidden) {
    ui.playlist.style.translate = "0 112px";
    ui.makeSmallBtn.style.translate = "0 112px";
    ui.makeBigBtn.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;
  } else {
    ui.playlist.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.makeSmallBtn.style.animation = `2s slideDown cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.makeBigBtn.style.translate = "0 112px";
  }
});

ui.showBtn.addEventListener("click", () => {
  state.setIsPlayerHidden(false);

  ui.showBtn.style.display = "none";
  ui.hideBtn.style.display = "block";

  ui.player.style.animation = "2s show cubic-bezier(0.19, 1, 0.22, 1) forwards";

  ui.hideBtn.style.translate = "0";
  ui.hideBtn.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;

  if (state.isPlaylistHidden) {
    ui.makeBigBtn.style.translate = "0";
    ui.makeBigBtn.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.playlist.style.translate = "0";
    ui.makeSmallBtn.style.translate = "0";
  } else {
    ui.playlist.style.translate = "0";
    ui.playlist.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    ui.makeSmallBtn.style.translate = "0";
    ui.makeSmallBtn.style.animation = `2s slideUp cubic-bezier(0.19, 1, 0.22, 1) forwards`;
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
    .querySelector(".util-btn-cell").style.color = "var(--now-playing)";
  document
    .getElementById(`${state.currSong.path}-playlist-song`)
    .querySelector("h3").style.color = "var(--now-playing)";
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

const handleMicrophone = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!analyser) {
    analyser = audioCtx.createAnalyser();
  }

  if (state.isLive) {
    if (audioCtx.state === "suspended") audioCtx.resume();

    audioSource.connect(analyser);

    ui.playlist.style.display = "flex";
    ui.player.style.display = "flex";
    ui.hideBtn.style.display = "block";
    ui.makeSmallBtn.style.display = "block";
    ui.showBtn.style.display = "none";

    state.setIsLive(false);
  } else {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        audioSource = audioCtx.createMediaStreamSource(stream);
        audioSource.connect(analyser);

        if (audioCtx.state === "suspended") audioCtx.resume();

        ui.playlist.style.display = "none";
        ui.player.style.display = "none";
        ui.hideBtn.style.display = "none";
        ui.showBtn.style.display = "none";
        ui.makeBigBtn.style.display = "none";
        ui.makeSmallBtn.style.display = "none";

        state.setScene("grid");
        console.log(state.scene);
        ui.audio.pause();
        ui.audio.play();
        state.setIsLive(true);
      })
      .catch((err) => {
        console.error("Error accessing the microphone: ", err);
      });
  }
};

ui.fullScreenBtn.addEventListener("click", toggleFullScreen);

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
  createScene(state.scene);

  togglePlaybackBtn();
  toggleVolumeBtn();

  ui.audio.addEventListener("loadedmetadata", () => {
    updateDurations();
  });

  updateProgress(ui.volumeProgress, ui.audio.volume * 60);

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
        .querySelector(".util-btn-cell").style.color = "var(--now-playing)";
      document
        .getElementById(`${song.path}-playlist-song`)
        .querySelector("h3").style.color = "var(--now-playing)";

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

        ui.currSong.poster.src = `/posters/${song.path}.webp`;
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

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

const initializeCurrSongData = () => {
  ui.currSong.poster.src = `/posters/${songs[0].path}.webp`;
  ui.currSong.poster.alt = `${songs[0].name} by ${songs[0].artist}`;
  ui.currSong.name.textContent = `${songs[0].name}`;
  ui.currSong.artist.textContent = songs[0].artist;
};

const createScene = (sceneType) => {
  switch (sceneType) {
    case "grid":
      ui.scene.innerHTML = `<canvas width="100%" height="100%">`;
      break;
  }
};

const updateGridScene = () => {
  const canvas = ui.scene.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  analyser.getByteFrequencyData(dataArray);

  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;

  for (let j = 0; j < cnst.ROW_LEN + 1; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 6);

    for (let i = 0; i < cnst.COL_LEN + 1; i++) {
      const pixelHeight = halfHeight / cnst.ROW_LEN;
      const pixelWidth = halfWidth / cnst.COL_LEN;

      const baseHue = (Date.now() / 15) % 360;
      const scaleFactor = 3;
      const hue =
        (baseHue +
          ((i / (cnst.COL_LEN * scaleFactor)) * 360 +
            (j / (cnst.ROW_LEN * scaleFactor)) * 360)) %
        360;

      const saturation = 70 + ((i + j) % 30);

      ctx.strokeStyle =
        i < soundIntensity ? `hsl(${hue}, ${saturation}%, 50%)` : "#000000";
      ctx.lineWidth = 1;

      ctx.strokeRect(
        (cnst.COL_LEN - j) * pixelWidth,
        (cnst.ROW_LEN - i) * pixelHeight,
        pixelWidth,
        pixelHeight
      );
      ctx.strokeRect(
        halfWidth + j * pixelWidth,
        halfHeight + i * pixelHeight,
        pixelWidth,
        pixelHeight
      );
      ctx.strokeRect(
        halfWidth + j * pixelWidth,
        (cnst.ROW_LEN - i) * pixelHeight,
        pixelWidth,
        pixelHeight
      );
      ctx.strokeRect(
        (cnst.COL_LEN - j) * pixelWidth,
        halfHeight + i * pixelHeight,
        pixelWidth,
        pixelHeight
      );
    }
  }

  if (state.scene === "grid") {
    animationRequestId = requestAnimationFrame(updateGridScene);
  }
};

const updateBackgroundScene = () => {
  const canvas = ui.scene.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  analyser.getByteFrequencyData(dataArray);

  const avgIntensity =
    dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
  const intensityRatio = avgIntensity / 255;

  const baseHue = (Date.now() / 30) % 360;
  const hue = (baseHue + 2) % 360;

  const saturation = 100;
  const lightness = 50 * intensityRatio;

  const centerColor = `hsl(${Math.floor(hue)}, ${saturation}%, ${Math.floor(
    lightness
  )}%)`;

  const edgeColor = "#000000";

  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 1.5
  );

  gradient.addColorStop(0, centerColor);
  gradient.addColorStop(1, edgeColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.scene === "background") {
    animationRequestId = requestAnimationFrame(updateBackgroundScene);
  }
};

const updateWaveScene = () => {
  const canvas = ui.scene.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  analyser.getByteFrequencyData(dataArray);

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;
  const centerX = width / 2;

  ctx.clearRect(0, 0, width, height);

  const generateControlPoints = (
    direction,
    offset,
    amplitudeFactor,
    frequency
  ) => {
    const points = [];
    let upsideDown = false;
    const incrementStep = 1;
    const amplitudeThreshold = 10;

    for (let i = 0; i < dataArray.length; i += incrementStep) {
      const amplitude = (dataArray[i] / 255) * centerY * amplitudeFactor;
      if (amplitude < amplitudeThreshold) continue;

      let x, y;
      if (!upsideDown) {
        x = centerX + direction * (i / dataArray.length) * centerX;
        y = centerY - amplitude + offset;
        upsideDown = true;
      } else {
        x = centerX + direction * (i / dataArray.length) * centerX;
        y = centerY + amplitude + offset;
        upsideDown = false;
      }
      points.push({ x, y });
    }
    return points;
  };

  const drawSmoothLine = (ctx, ctrl_points) => {
    const l = ctrl_points.length;
    if (l < 2) return;

    ctx.beginPath();
    ctx.moveTo(ctrl_points[0].x, ctrl_points[0].y);

    for (let i = 0; i < l - 1; i++) {
      const p0 = ctrl_points[i];
      const p1 = ctrl_points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.5;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) * 0.5;
      const cp2y = p1.y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
    }
    ctx.stroke();
  };

  const drawWave = (
    direction,
    offset,
    amplitudeFactor,
    frequency,
    colorOffset,
    lineWidth,
    shadowColor
  ) => {
    const leftControlPoints = generateControlPoints(
      direction,
      offset,
      amplitudeFactor,
      frequency
    );
    const rightControlPoints = generateControlPoints(
      -direction,
      offset,
      amplitudeFactor,
      frequency
    );

    const baseHue = (Date.now() / 15) % 360;
    const hue = (baseHue + colorOffset) % 360;
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
    ctx.strokeStyle = gradient;

    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 2;
    ctx.lineWidth = lineWidth;

    drawSmoothLine(ctx, leftControlPoints);
    drawSmoothLine(ctx, rightControlPoints);
  };

  drawWave(1, 0, 0.7, 1, 0, 1, "rgba(255, 255, 255, 0.5)");

  if (state.scene === "waves") {
    animationRequestId = requestAnimationFrame(updateWaveScene);
  } else {
    cancelAnimationFrame(animationRequestId);
  }
};

// ----- INITIALIZE APP ----- //
initializeApp();
