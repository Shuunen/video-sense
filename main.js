// below code inspired by https://github.com/josephrocca/getVideoFrames.js
'use strict'
// @ts-ignore
import { sleep } from "https://cdn.skypack.dev/shuutils@7.3.2"
// @ts-ignore
import getVideoFrames from "https://deno.land/x/get_video_frames@v0.0.10/mod.js"

const worker = new Worker('worker.js', { type: 'module' })
// @ts-expect-error Notyf is globally defined
const toast = new Notyf()
const /** @type HTMLDivElement|null */ loadingElement = document.querySelector('div#loading')
const formElement = document.querySelector('form')
if (!formElement) throw new Error('no form element found')
if (!loadingElement) throw new Error('no loading element found')
const fileInput = document.querySelector('input[type="file"]')
if (!fileInput) throw new Error('no file input found')
const textInput = document.querySelector('input[type="text"]')
if (!textInput) throw new Error('no text input found')
// @ts-ignore
const context = canvasEl.getContext("2d")
let fontSize = 40
const minScore = 0.3
let frameCount = 0

/**
 * @param {ErrorEvent|PromiseRejectionEvent} error
 */
function onError (error) {
  const message = error instanceof ErrorEvent ? error.message : String(error.reason.message)
  toast.error(message)
}

/**
 * @param {VideoFrameConfig} config the video frame config
 * @returns {void}
 */
function onFrameConfig (config) {
  console.log("on frame config", config)
  frameCount = 0
  context.canvas.style.display = '' // don't toggle, just make sure it's visible
  context.canvas.width = config.codedWidth
  context.canvas.height = config.codedHeight
}

/**
 * @param {CocoPrediction} prediction the prediction to draw on canvas
 * @returns {void}
 */
function drawPrediction (prediction) {
  context.beginPath()
  context.rect(...prediction.bbox)
  context.lineWidth = 4
  context.strokeStyle = 'green'
  context.stroke()
  const x = prediction.bbox[0]
  const y = prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
  const text = prediction.score.toFixed(2) + ' ' + prediction.class
  const height = fontSize * 1.1
  const width = text.length * fontSize / 1.9
  // draw background for the text
  context.fillStyle = 'rgba(0, 80, 0, 0.6)'
  context.fillRect(x - context.lineWidth / 2, y - context.lineWidth - 2, width, height)
  // draw text
  context.fillStyle = 'white'
  context.fillText(text, x + context.lineWidth, y + context.lineWidth + fontSize / 2)
}

/**
 * @param {CocoPrediction[]} predictions
 */
function onPredictions (predictions) {
  console.log('on predictions :', (predictions.map(p => p.class) || ['nothing']).join(', '))
  fontSize = Math.round(context.canvas.height / 10)
  context.font = fontSize + 'px Arial'
  console.log('fontSize', fontSize)
  predictions.forEach(drawPrediction)
}

async function detectCanvasContent () {
  context.canvas.toBlob((/** @type {Blob} */blob) => {
    worker.postMessage({ blob, minScore, type: "predict" })
  })
}

/**
 * @param {VideoFrame} frame the video frame
 */
async function onFrame (frame) {
  if (frameCount !== 0) return frame.close()
  // @ts-ignore
  context.drawImage(frame, 0, 0, canvasEl.width, canvasEl.height)
  await sleep(10)
  frame.close()
  if (frameCount === 0) detectCanvasContent()
  frameCount++
}

function onFrameFinish () {
  console.log("finished!")
  console.log("frameCount", frameCount)
}

/**
 * @param {File} [file] the file
 * @returns {string} the url
 */
function getUrlForFile (file) {
  if (file === undefined) throw new Error('file is undefined, cannot get url')
  return URL.createObjectURL(/** @type {Blob} */(file))
}

/**
 * @param {File} [file] the video file
 * @param {string} [url] the video url
 * @returns {Promise<void>}
 */
async function onVideoSelection (file, url) {
  const path = url ?? file?.name ?? ''
  if (!isVideoExtensionHandled(path)) throw new Error('un-handled video extension : ' + path.split('.').pop())
  const videoUrl = url ?? getUrlForFile((file))
  console.log('on video selection, extracting frames from :', videoUrl)
  await getVideoFrames({ videoUrl, onFrame, onConfig: onFrameConfig, onFinish: onFrameFinish, })
  if (!url) URL.revokeObjectURL(videoUrl)
}

/**
 * @param {File} [file] the image file
 * @param {string} [url] the image url
 * @returns {void}
 */
function onImageSelection (file, url) {
  const path = url ?? file?.name ?? ''
  if (!isImageExtensionHandled(path)) throw new Error('un-handled image extension : ' + path.split('.').pop())
  const imageUrl = url ?? getUrlForFile(file)
  console.log('on image selection, detecting content from :', { file, url, imageUrl })
  const image = new Image()
  image.src = imageUrl
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    if (!url) URL.revokeObjectURL(imageUrl)
    context.canvas.style.display = '' // don't toggle, just make sure it's visible
    context.canvas.width = image.naturalWidth
    context.canvas.height = image.naturalHeight
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)
    detectCanvasContent()
  }
}

/**
 * Show an element if hidden, hide it if shown
 * @param {HTMLElement|null} element
 */
function toggleDisplay (element) {
  if (!element) return console.warn('toggleDisplay : element is null')
  element.style.display = element.style.display === 'none' ? '' : 'none'
}
/**
 * @param {string} path like 'https://i.imgur.com/NUyttbn.mp4' or 'super-123.jpg'
 */
function isVideoExtensionHandled (path) {
  return /\.(mp4)$/i.test(path)
}

/**
 * @param {string} path like 'https://i.imgur.com/NUyttbn.mp4' or 'super-123.jpg'
 */
function isImageExtensionHandled (path) {
  return /\.(jpg|jpeg|png|gif|bmp)$/i.test(path)
}

/****************************
 *      Event listeners     *
 ****************************/

fileInput.addEventListener('change', (/** @type {Event} */ event) => {
  // @ts-ignore
  const /** @type File */ file = event.target?.files[0]
  console.log('file selected :', file)
  if (!file) throw new Error('no file selected')
  if (file.type.startsWith('video')) onVideoSelection(file)
  else if (file.type.startsWith('image')) onImageSelection(file)
  else throw new Error('unsupported file type')
})

textInput.addEventListener('change', (/** @type {Event} */ event) => {
  // @ts-ignore
  const text = event.target?.value
  console.log('text selected :', text)
  if (!text) throw new Error('no text selected')
  if (isImageExtensionHandled(text)) onImageSelection(undefined, text)
  else if (isVideoExtensionHandled(text)) onVideoSelection(undefined, text)
  else throw new Error('unsupported extension : ' + text.split('.').pop())
})

worker.addEventListener('message', async (/** @type {MessageEvent} */ event) => {
  console.log('message from worker :', event.data)
  if (event.data.type === 'ready') {
    toast.success('Coco ready, loading example video...')
    toggleDisplay(loadingElement)
    onVideoSelection(undefined, 'https://i.imgur.com/NUyttbn.mp4')
  }
  else if (event.data.type === 'predictions') {
    onPredictions(event.data.predictions)
  }
  else console.warn('unknown message type :', event.data.type)
})

window.addEventListener('error', (/** @type {ErrorEvent} */ error) => onError(error))

window.addEventListener('unhandledrejection', (/** @type {PromiseRejectionEvent} */ error) => onError(error))
