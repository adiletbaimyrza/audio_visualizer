const audioPlayer = document.getElementById('audio-player')
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
const audioSource = audioCtx.createMediaElementSource(audioPlayer)
let analyser = audioCtx.createAnalyser()
analyser.fftSize = 128
let dataArray = null

const ROW_LENGTH = 64
const COL_LENGTH = 30
const SONG_NAMES = ['adele', 'mirbek', 'skryptonite']

let createGrid = (gridContainerId, generateId, iStart, iEnd, jStart, jEnd) => {
  const gridContainer = document.getElementById(gridContainerId)
  for (let i = iStart; i !== iEnd; iEnd > iStart ? i++ : i--) {
    for (let j = jStart; j !== jEnd; jEnd > jStart ? j++ : j--) {
      const gridItem = document.createElement('div')
      gridItem.classList.add('grid-item')
      gridItem.setAttribute('id', generateId(i, j))
      gridContainer.appendChild(gridItem)
    }
  }
}

let createGrids = () => {
  createGrid(
    'left-grid-container',
    (i, j) => `left-${i}-${j}`,
    COL_LENGTH - 1,
    -1,
    ROW_LENGTH - 1,
    -1
  )
  createGrid('right-grid-container', (i, j) => `right-${i}-${j}`, COL_LENGTH - 1, -1, 0, ROW_LENGTH)
  createGrid(
    'bottom-left-grid-container',
    (i, j) => `bottom-left-${i}-${j}`,
    0,
    COL_LENGTH,
    ROW_LENGTH - 1,
    -1
  )
  createGrid(
    'bottom-right-grid-container',
    (i, j) => `bottom-right-${i}-${j}`,
    0,
    COL_LENGTH,
    0,
    ROW_LENGTH
  )
}

let getHslColor = (index, soundIntensity) => {
  const hue = (360 / 30) * index
  const saturation = '100%'
  const lightness = 50 + (soundIntensity / 30) * 50 + '%'
  const color = `hsl(${hue}, ${saturation}, ${lightness})`
  return color
}

let updateGrids = () => {
  analyser.getByteFrequencyData(dataArray)
  for (let j = 0; j < ROW_LENGTH; j++) {
    const soundIntensity = Math.floor(dataArray[j] / 20)
    for (let i = 0; i < COL_LENGTH; i++) {
      const color = getHslColor(i, soundIntensity)
      document.getElementById(`left-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : '#000'
      document.getElementById(`right-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : '#000'
      document.getElementById(`bottom-left-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : '#000'
      document.getElementById(`bottom-right-${i}-${j}`).style.backgroundColor =
        i < soundIntensity ? color : '#000'
    }
  }
  requestAnimationFrame(updateGrids)
}

document.getElementById('audio-file').addEventListener('change', function () {
  audioUrl = URL.createObjectURL(this.files[0])
  audioPlayer.src = audioUrl

  const bufferLength = analyser.frequencyBinCount
  dataArray = new Uint8Array(bufferLength)

  audioSource.connect(analyser)
  analyser.connect(audioCtx.destination)
})

SONG_NAMES.forEach((song) => {
  document.getElementById(song).addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    if (!audioPlayer.paused) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
    }
    audioPlayer.src = `audio/${song}.mp3`
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    audioSource.connect(analyser)
    analyser.connect(audioCtx.destination)
    audioPlayer.play()
  })
})

document.getElementById('audio-player').addEventListener('play', () => {
  updateGrids()
})

createGrids()
