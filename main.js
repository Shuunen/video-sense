// below code inspired by https://github.com/josephrocca/getVideoFrames.js
'use strict'
// @ts-ignore
import { sleep } from "https://cdn.skypack.dev/shuutils@7.3.2"
// @ts-ignore
import getVideoFrames from "https://deno.land/x/get_video_frames@v0.0.10/mod.js"

const loadingElement = document.querySelector('div#loading') ?? document.createElement('div')
const fileInput = document.querySelector('input[type="file"]')
if (!fileInput) throw new Error('no file input found')
// @ts-ignore
const context = canvasEl.getContext("2d")
const fontSize = 40
const minScore = 0.1
/** @type {CocoModel} */
let cocoModel = { isLoaded: false, detect: () => Promise.reject(new Error('coco model not loaded')) }
let frameCount = 0

/**
 * @param {VideoFrameConfig} config the video frame config
 * @returns {void}
 */
function onFrameConfig (config) {
  console.log("on frame config", config)
  frameCount = 0
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
  context.fillStyle = 'green'
  context.fillRect(x - context.lineWidth / 2, y - height + context.lineWidth, width, height)
  // draw text
  context.fillStyle = 'white'
  context.fillText(text, x + context.lineWidth, y)
}

/**
 * @param {CocoPrediction[]} predictions 
 */
function onPredictions (predictions) {
  console.log('on predictions :', (predictions.map(p => p.class) || ['nothing']).join(', '))
  context.font = fontSize + 'px Arial'
  predictions.forEach(drawPrediction)
}

async function detectCanvasContent () {
  console.log("detecting canvas content...")
  if (cocoModel === undefined) throw new Error('coco model not loaded')
  // can detect : tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
  const predictions = await cocoModel.detect(context.canvas, undefined, minScore)
  onPredictions(predictions)
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
  const imageUrl = url ?? getUrlForFile(file)
  console.log('on image selection, detecting content from :', imageUrl)
  const image = new Image()
  image.src = imageUrl
  image.onload = () => {
    context.canvas.width = image.naturalWidth
    context.canvas.height = image.naturalHeight
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)
    detectCanvasContent()
  }
  if (!url) URL.revokeObjectURL(imageUrl)
}

fileInput.addEventListener('change', (/** @type {Event} */ event) => {
  console.log('file selected :', event)
  // @ts-ignore
  const file = event.target?.files[0]
  if (!file) throw new Error('no file selected')
  if (file.type.startsWith('video')) onVideoSelection(file)
  else if (file.type.startsWith('image')) onImageSelection(file)
  else throw new Error('unsupported file type')
})

// @ts-ignore
cocoSsd.load().then((/** @type CocoModel */ model) => {
  cocoModel = model
  console.log('coco model loaded')
  // @ts-ignore
  loadingElement.style.display = 'none'
})

/**
 * @typedef {Object} CocoPrediction
 * @property {[number, number]} bbox the bounding box like [x, y, width, height]
 * @property {string} class the detected object class like "person", "bird", ...
 * @property {number} score the confidence score like 0.2 (low confidence) or 0.9 (high confidence)
 */

/**
 * @typedef {Object} VideoFrameConfig
 * @property {number} codedHeight the video frame height
 * @property {number} codedWidth the video frame width
 */

/**
 * @typedef {Object} CocoModel
 * @property {(image: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, minConfidence?: number, maxResults?: number) => Promise<CocoPrediction[]>} detect
 * @property {boolean} isLoaded indicates if the model is loaded
 */