import { useCallback, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import styles from './styles.module.scss';

export interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: 'px' | '%';
}

interface ICropper {
    setCropToParent?: (crop: Crop) => void;
    src: string;
    frames: File[] | undefined;
}

function CropDemo({ src, setCropToParent, frames }: ICropper) {
    const [crop, setCrop] = useState<Crop>()
    const [url, setUrl] = useState('');
    const imgRef = useRef<HTMLImageElement>(null)
    const [aspect, setAspect] = useState<number | undefined>(16 / 9)
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)



    const handleCropFrames = useCallback(() => {
        const urlObject = URL.createObjectURL(frames[0]);

        console.log(frames)
        console.log(crop)
        setUrl(urlObject);


    }, [crop, frames])

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget
            console.log(width, height)
            setCrop(centerAspectCrop(width, height, aspect))
        }
    }


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

    return (
        <div className={styles.cropperContainer}>
            <>
                <ReactCrop
                    crop={crop}
                    onChange={(c, percentCrop) => {
                        console.log('percentCrop: ', percentCrop);
                        setCrop(c)
                        setCropToParent(crop);
                    }}
                    onComplete={(c) => {
                        console.log(c)
                        setCompletedCrop(c)
                    }}
                    aspect={aspect}
                >
                    {src &&
                        <img
                            src={src}
                            alt='imagem para ser cortada'
                            onLoad={onImageLoad}
                        />
                    }
                </ReactCrop>
                <button onClick={handleCropFrames} >Cortar</button>
                <div className={styles.editContainer}>
                    
                <canvas
                    ref={previewCanvasRef}
                    style={{
                    border: '1px solid black',
                    objectFit: 'contain',
                    width: completedCrop.width,
                    height: completedCrop.height,
                    }}
                />

                </div>
            </>
        </div>
    )
}

export default CropDemo;