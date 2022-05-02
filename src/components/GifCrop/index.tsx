import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
    Crop,
    PixelCrop,
  } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import styles from './styles.module.scss';
import { canvasPreview } from './canvasPreview'
import gifFrames from 'gif-frames'
import GIF from 'gif.js';
import 'react-image-crop/dist/ReactCrop.css'


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

const GifCrop: React.FC = () => {
    const [imgSrc, setImgSrc] = useState('')
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [scale, aspect] = [1, 16 / 9]
    const [framesFile, setFramesFile] = useState([])
    const [framesFileCropped, setFramesFileCropped] = useState([])
    const [finished, setFinished] = useState({
      length: 0,
      status: false,
    });
    const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>)=>{
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
          console.log(image);
          const blob = new Blob([image.getImage()._obj], {
            type: 'image/jpg',
          })
          frameImages.push({
            file: new File([blob], `frame-image-${index}`),
            delay: image.frameInfo.delay,
          })
        })
  
        setFramesFile(frameImages)
        setFinished({
          length: frameImages.length,
          status: false,
        })
        console.log(frameImages);

      } catch (error) {}
    }, [])

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>)=>{
      if (aspect) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, aspect))
      }
    }, [aspect])

    const handleCropAllFrames = useCallback(()=>{
      framesFile.forEach((frame, index) => {
        const canvas = document.createElement('canvas')
        const image = document.createElement('img')
        const url = URL.createObjectURL(frame.file)
        image.src = url
        image.onload = function () {
          canvasPreview(image, canvas, completedCrop, scale)
  
          setFramesFileCropped((prev) => [...prev, {canvas, index, delay: frame.delay}])
        }
      })
    },[completedCrop, framesFile, scale])

    const handleGenerateGif = useCallback(async () => {
      var gif = new GIF({
        workers: 2,
        quality: 10,
        width: framesFileCropped[0].clientWidth,
        height: framesFileCropped[0].clientHeight,
      });

      const framesOrdered = framesFileCropped.sort((a,b)=> {
        if (a.index < b.index) return -1;
        if (a.index > b.index) return 1;
        return 0;
      })

      framesOrdered.forEach(frame=>{
        gif.addFrame(frame.canvas, {delay: frame.delay*10});
      })
      // add an image element
      gif.on('finished', function(blob) {
        window.open(URL.createObjectURL(blob));
      });
      

      gif.render();
      setFinished({
        length: 0,
        status: false,
      })
      console.log('cropa')

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
  
    useEffect(()=>{
      if (framesFileCropped.length === finished.length && finished.length !== 0) {
        
        handleGenerateGif();
      }
    },[framesFileCropped, finished])

  return (
      <div className={styles.cropperContainer}>
          <>
              <div className="Crop-Controls">
                  <input type="file" accept="image/*" onChange={onSelectFile} />
              </div>
              <ReactCrop
                  crop={crop}
                  onChange={(c, percentCrop) => {
                      console.log(c);
                      setCrop(c)
                  }}
                  onComplete={(c) => {
                      setCompletedCrop(c)
                  }}
                  aspect={aspect}
              >
                  {imgSrc && 
                  <img
                      src={imgSrc}
                      alt='imagem para ser cortada'
                      onLoad={onImageLoad}
                  />}
              </ReactCrop>
              <div className={styles.editContainer}>
                  <div>
                      <button
                          type="button"
                          onClick={() => {
                              handleCropAllFrames()
                          }}
                      >
                          Cortar 
                      </button>
                  </div>
              </div>
          </>
      </div>
    )
}

export default GifCrop;