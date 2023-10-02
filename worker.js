import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"
import "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"

// @ts-ignore cocoSsd is a global variable
const model = await cocoSsd.load()

self.postMessage({ type: 'ready' })

self.onmessage = async (event) => {
    const { type, blob, minScore } = event.data
    if (type === 'predict') {
        const bitmap = await createImageBitmap(blob)
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
        const predictions = await model.detect(canvas, undefined, minScore)
        self.postMessage({ type: 'predictions', predictions })
    }
}