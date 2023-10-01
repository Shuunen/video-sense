
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
 */
