import { uploadFileVoUsingPost } from '@/services/backend/fileController';
import { getFileViewUrl } from '@/utils/cos';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Modal, Slider, Typography, Upload, UploadProps } from 'antd';
import React, { useRef, useState } from 'react';

interface Props {
  biz: string;
  aspectRatio?: number;
  aspectRatioLabel?: string;
  dailyId?: number;
  maxSizeMB?: number;
  onChange?: (url: string, filePath?: string) => void;
  value?: string;
}

const createImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片读取失败，请重新选择'));
    image.src = src;
  });

/**
 * 图片上传组件
 * @constructor
 */
const PictureUploader: React.FC<Props> = (props) => {
  const { biz, value, onChange, aspectRatio, aspectRatioLabel, dailyId, maxSizeMB = 3 } = props;
  const [loading, setLoading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string>();
  const [cropFile, setCropFile] = useState<File>();
  const [imageSize, setImageSize] = useState<{ height: number; width: number }>();
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const uploadImage = async (file: File) => {
    setLoading(true);
    try {
      const res = await uploadFileVoUsingPost(
        {
          biz,
          dailyId,
        },
        {},
        file,
      );
      // 拼接完整图片路径
      const filePath = res.data?.filePath ?? '';
      const fullPath = getFileViewUrl(filePath || res.data?.url) || '';
      onChange?.(fullPath, filePath);
      return fullPath;
    } catch (e: any) {
      message.error('上传失败，' + e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const validateImage = (file: File) => {
    if (!file.type?.startsWith('image/')) {
      message.error('请上传图片格式文件');
      return false;
    }
    return true;
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('图片压缩失败'));
        },
        'image/jpeg',
        quality,
      );
    });

  const compressCanvas = async (canvas: HTMLCanvasElement, limitBytes: number) => {
    let quality = 0.92;
    let blob = await canvasToBlob(canvas, quality);

    while (blob.size > limitBytes && quality > 0.5) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, quality);
    }

    while (blob.size > limitBytes && canvas.width > 640) {
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = Math.round(canvas.width * 0.85);
      nextCanvas.height = Math.round(canvas.height * 0.85);
      const nextContext = nextCanvas.getContext('2d');
      if (!nextContext) {
        break;
      }
      nextContext.drawImage(canvas, 0, 0, nextCanvas.width, nextCanvas.height);
      canvas.width = nextCanvas.width;
      canvas.height = nextCanvas.height;
      canvas.getContext('2d')?.drawImage(nextCanvas, 0, 0);
      quality = 0.82;
      blob = await canvasToBlob(canvas, quality);
    }

    return blob;
  };

  const buildCroppedImage = async () => {
    if (!cropImage || !aspectRatio) {
      throw new Error('请先选择图片');
    }
    const sourceImage = await createImage(cropImage);
    const imageRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
    const fitByHeight = imageRatio > aspectRatio;
    const sourceWidth = fitByHeight
      ? Math.min(sourceImage.naturalWidth, (sourceImage.naturalHeight * aspectRatio) / zoom)
      : Math.min(sourceImage.naturalWidth, sourceImage.naturalWidth / zoom);
    const sourceHeight = fitByHeight
      ? Math.min(sourceImage.naturalHeight, sourceImage.naturalHeight / zoom)
      : Math.min(sourceImage.naturalHeight, sourceWidth / aspectRatio);
    const maxSourceX = Math.max(0, sourceImage.naturalWidth - sourceWidth);
    const maxSourceY = Math.max(0, sourceImage.naturalHeight - sourceHeight);
    const sourceX = (maxSourceX * positionX) / 100;
    const sourceY = (maxSourceY * positionY) / 100;
    const targetWidth = Math.min(1600, Math.round(sourceWidth));
    const targetHeight = Math.round(targetWidth / aspectRatio);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('图片处理失败');
    }
    context.fillStyle = '#fff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(
      sourceImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    const blob = await compressCanvas(canvas, maxSizeMB * 1024 * 1024);
    const filename = (cropFile?.name || 'cover').replace(/\.[^.]+$/, '');
    return new File([blob], `${filename}.jpg`, {
      type: 'image/jpeg',
    });
  };

  const openCropper = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageUrl = reader.result as string;
        const image = await createImage(imageUrl);
        setCropFile(file);
        setCropImage(imageUrl);
        setImageSize({
          height: image.naturalHeight,
          width: image.naturalWidth,
        });
        setPositionX(50);
        setPositionY(50);
        setZoom(1);
        setCropOpen(true);
      } catch (error: any) {
        message.error(error.message || '图片读取失败，请重新选择');
      }
    };
    reader.onerror = () => {
      message.error('图片读取失败，请重新选择');
    };
    reader.readAsDataURL(file);
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!validateImage(file as File)) {
      return Upload.LIST_IGNORE;
    }

    if (aspectRatio) {
      openCropper(file as File);
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleCropOk = async () => {
    try {
      const file = await buildCroppedImage();
      await uploadImage(file);
      setCropOpen(false);
    } catch (error: any) {
      message.error(error.message || '图片处理失败');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    multiple: false,
    maxCount: 1,
    showUploadList: false,
    accept: 'image/*',
    beforeUpload,
    customRequest: async (fileObj: any) => {
      try {
        const fullPath = await uploadImage(fileObj.file as File);
        fileObj.onSuccess?.(fullPath);
      } catch (e: any) {
        fileObj.onError?.(e);
      }
    },
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  const cropPreviewStyle = () => {
    if (!cropImage || !aspectRatio || !imageSize) {
      return {};
    }
    const imageRatio = imageSize.width / imageSize.height;
    const fitByHeight = imageRatio > aspectRatio;
    const backgroundSize = fitByHeight
      ? `${(imageRatio / aspectRatio) * zoom * 100}% ${zoom * 100}%`
      : `${zoom * 100}% ${(aspectRatio / imageRatio) * zoom * 100}%`;

    return {
      backgroundImage: `url(${cropImage})`,
      backgroundPosition: `${positionX}% ${positionY}%`,
      backgroundRepeat: 'no-repeat',
      backgroundSize,
    };
  };

  return (
    <>
      <Upload {...uploadProps}>
        {value ? (
          <img
            src={value}
            alt="picture"
            style={{
              aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
              height: '100%',
              objectFit: 'cover',
              width: '100%',
            }}
          />
        ) : (
          uploadButton
        )}
      </Upload>
      <Modal
        title={`裁剪封面图${aspectRatioLabel ? `（${aspectRatioLabel}）` : ''}`}
        open={cropOpen}
        okText="裁剪并上传"
        cancelText="取消"
        confirmLoading={loading}
        onCancel={() => setCropOpen(false)}
        onOk={handleCropOk}
        destroyOnClose
      >
        <Typography.Text type="secondary">
          拖动下方滑块调整图片缩放，裁剪后的图片会压缩到 {maxSizeMB}MB 以内再上传。
        </Typography.Text>
        <div
          ref={viewportRef}
          style={{
            aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
            background: '#f5f5f5',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            marginTop: 16,
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            ...cropPreviewStyle(),
          }}
        />
        <Typography.Text style={{ display: 'block', marginTop: 16 }}>缩放</Typography.Text>
        <Slider min={1} max={3} step={0.01} value={zoom} onChange={setZoom} />
        <Typography.Text style={{ display: 'block' }}>横向位置</Typography.Text>
        <Slider min={0} max={100} step={1} value={positionX} onChange={setPositionX} />
        <Typography.Text style={{ display: 'block' }}>纵向位置</Typography.Text>
        <Slider min={0} max={100} step={1} value={positionY} onChange={setPositionY} />
      </Modal>
    </>
  );
};

export default PictureUploader;
