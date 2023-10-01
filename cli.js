'use strict'
import cocoSsd from '@tensorflow-models/coco-ssd'
import tf from '@tensorflow/tfjs-node'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'

console.log('cli start @', new Date().toLocaleTimeString());

(async () => {
  const model = await cocoSsd.load()
  console.log('coco model loaded')
  const response = await fetch('https://i.imgflip.com/80xkm1.jpg')
  const data = await response.arrayBuffer()
  const image = tf.node.decodeImage(new Uint8Array(data))
  const predictions = await model.detect(/** @type tf.Tensor3D */(image))
  console.log('coco found :', predictions.map(p => p.class).join(', '))
})()