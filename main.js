// below code inspired by https://github.com/josephrocca/getVideoFrames.js
import { sleep } from "https://cdn.skypack.dev/shuutils@7.3.2"
import getVideoFrames from "https://deno.land/x/get_video_frames@v0.0.10/mod.js"

let frameCount = 0

window.start = async function(file, url) {
  let ctx = canvasEl.getContext("2d")

  // `getVideoFrames` requires a video URL as input.
  // If you have a file/blob instead of a videoUrl, turn it into a URL like this:
  let videoUrl = url ?? URL.createObjectURL(file)

  await getVideoFrames({
    videoUrl,
    onFrame (frame) {  // `frame` is a VideoFrame object: https://developer.mozilla.org/en-US/docs/Web/API/VideoFrame
      ctx.drawImage(frame, 0, 0, canvasEl.width, canvasEl.height)
      sleep(100).then(() => {
        frame.close()
        frameCount++
      })
    },
    onConfig (config) {
      canvasEl.width = config.codedWidth
      canvasEl.height = config.codedHeight
    },
    onFinish () {
      console.log("finished!")
      console.log("frameCount", frameCount)
    },
  })

  if (!url) URL.revokeObjectURL(file) // revoke URL to prevent memory leak
}

start(undefined, 'samples/bunny.mp4')