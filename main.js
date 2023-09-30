// below code inspired by https://github.com/josephrocca/getVideoFrames.js
'use strict'
import { sleep } from "https://cdn.skypack.dev/shuutils@7.3.2"
import getVideoFrames from "https://deno.land/x/get_video_frames@v0.0.10/mod.js"

const loadingElement = document.querySelector('#loading')
const fileInput = document.querySelector('input[type="file"]')
const context = canvasEl.getContext("2d")
const fontSize = 40
const minScore = 0.1
let cocoModel = undefined
let frameCount = 0

/**
 * @param {VideoFrameConfig} config the video frame config
 * @returns {void}
 */
function onFrameConfig (config) {
  console.log("config", config)
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
  console.log('coco detected :', (predictions.map(p => p.class) || ['nothing']).join(', '))
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
  context.drawImage(frame, 0, 0, canvasEl.width, canvasEl.height)
  await sleep(10)
  frame.close()
  if (frameCount === 0) detectCanvasContent(frame)
  frameCount++
}

function onFrameFinish () {
  console.log("finished!")
  console.log("frameCount", frameCount)
}

/**
 * @param {File} [file] the video file
 * @param {string} [url] the video url
 * @returns {void}
 */
async function onVideoSelection (file, url) {
  const videoUrl = url ?? URL.createObjectURL(file)
  console.log('on video selection, extracting frames from :', videoUrl)
  await getVideoFrames({ videoUrl, onFrame, onConfig: onFrameConfig, onFinish: onFrameFinish, })
  if (!url) URL.revokeObjectURL(file) // revoke URL to prevent memory leak
}

/**
 * @param {File} [file] the image file
 * @param {string} [url] the image url
 * @returns {void}
 */
function onImageSelection (file, url) {
  const imageUrl = url ?? URL.createObjectURL(file)
  console.log('on image selection, detecting content from :', imageUrl)
  const image = new Image()
  image.src = imageUrl
  image.onload = () => {
    context.canvas.width = image.naturalWidth
    context.canvas.height = image.naturalHeight
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)
    detectCanvasContent()
  }
  if (!url) URL.revokeObjectURL(file) // revoke URL to prevent memory leak
}

fileInput.addEventListener('change', (/** @type {Event} */ event) => {
  console.log('file selected :', event)
  const file = event.target.files[0]
  if (!file) throw new Error('no file selected')
  if (file.type.startsWith('video')) onVideoSelection(file)
  else if (file.type.startsWith('image')) onImageSelection(file)
  else throw new Error('unsupported file type')
})

cocoSsd.load().then(model => {
  cocoModel = model
  console.log('coco model loaded')
  loadingElement.style.display = 'none'
})

/**
 * @typedef {Object} CocoPrediction
 * @property {number[]} bbox the bounding box like [x, y, width, height]
 * @property {string} class the detected object class like "person", "bird", ...
 * @property {number} score the confidence score like 0.2 (low confidence) or 0.9 (high confidence)
 */

/**
 * @typedef {Object} VideoFrameConfig
 * @property {number} codedHeight the video frame height
 * @property {number} codedWidth the video frame width
 */