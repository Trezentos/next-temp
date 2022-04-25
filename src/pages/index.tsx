import React, { useState, useRef, useEffect, useCallback } from 'react'

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'
import { canvasPreview } from './canvasPreview'
import gifFrames from 'gif-frames'
import gifshot from 'gifshot'
import 'react-image-crop/dist/ReactCrop.css'

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function App() {
  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, aspect] = [1, 16 / 9]
  const [framesFile, setFramesFile] = useState([])
  const [framesFileCropped, setFramesFileCropped] = useState([])
  const [frameDelay, setFrameDelay] = useState()

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (e.target.files && e.target.files.length > 0) {
        setCrop(undefined) // Makes crop preview update between images.
        const reader = new FileReader()
        reader.addEventListener('load', () =>
          setImgSrc(reader.result.toString() || ''),
        )
        reader.readAsDataURL(e.target.files[0])
      }

      const url = URL.createObjectURL(e.target.files[0])
      const frameData = await gifFrames({
        url,
        frames: 'all',
        cumulative: true,
        outputType: 'jpg',
      })
      let frameImages = []

      frameData.forEach((image, index) => {
        const blob = new Blob([image.getImage()._obj], {
          type: 'image/jpg',
        })
        frameImages.push(new File([blob], `frame-image-${index}`))
      })

      setFramesFile(frameImages)
    } catch (error) {}
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  function handleCropAllFrames() {
    framesFile.forEach((frame, index) => {
      const canvas = document.createElement('canvas')
      const image = document.createElement('img')
      const url = URL.createObjectURL(frame)
      image.src = url
      image.onload = function () {
        canvasPreview(image, canvas, completedCrop, scale)

        const imageCropped = canvas.toDataURL('image/jpg')
        const blob = new Blob([imageCropped], {
          type: 'image/jpg',
        })
        setFramesFileCropped((prev) => [...prev, imageCropped])
      }
    })
  }

  const generateGif = useCallback(async () => {
    if (framesFileCropped) {
      await gifshot.createGIF(
        {
          'gifWidth': 400,
          'numFrames': 10,
          interval: Number(0.1),
          frameDuration: 1,
          sampleInterval: 2,
          keepCameraOn: false,
          showFrameText: true,

          images: framesFileCropped.map((frame, index) => ({
            src: frame,
            text: `Frame-index-${index}`,
          })),
          
        },
        function (obj) {
          if (!obj.error) {
            var image = obj.image,
              animatedImage = document.createElement('img')
            animatedImage.src = image
            document.body.appendChild(animatedImage)
          }
        },
      )
    }
  }, [framesFileCropped])

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // We use canvasPreview as it's much faster than imgPreview.
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
      )
    }
  }, [completedCrop, scale])

  return (
    <div className="App">
      <div className="Crop-Controls">
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>
      {Boolean(imgSrc) && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => {
            setCrop(percentCrop)
          }}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imgSrc}
            style={{ transform: `scale(${scale})` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      )}

      <div>
        <button
          type="button"
          onClick={() => {
            handleCropAllFrames()
            generateGif()
          }}
        >
          Cropar
        </button>
      </div>
    </div>
  )
}
