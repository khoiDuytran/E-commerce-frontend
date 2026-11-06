"use client";

import { handleGetVideoUploadSignatureAction } from "@/utils/actions";
import { getVideoPosterUrl } from "@/utils/store";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Progress, message } from "antd";
import { useRef, useState } from "react";
import {
  SingleImageUploadField,
  discardUnsavedImages,
} from "./image.upload.field";

// Gói Cloudinary miễn phí giới hạn video 100MB; để thấp hơn cho trang chủ tải nhanh
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface IVideoProps {
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  savedUrl?: string | null;
  onUploadingChange: (isUploading: boolean) => void;
}

// Tải video thẳng từ trình duyệt lên Cloudinary bằng chữ ký do backend cấp,
// vì server action chỉ nhận request vài MB
const uploadVideoToCloudinary = async (
  file: File,
  onProgress: (percent: number) => void,
) => {
  const res = await handleGetVideoUploadSignatureAction();
  const signed = res?.data;
  if (!signed) throw new Error(res?.message || "Không lấy được chữ ký tải lên");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("public_id", signed.public_id);
  formData.append("allowed_formats", signed.allowed_formats);

  // Dùng XMLHttpRequest để có tiến độ tải lên, fetch chưa hỗ trợ việc này
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let body: { secure_url?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Giữ body rỗng để báo lỗi chung bên dưới
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
        resolve(body.secure_url);
      } else {
        reject(new Error(body.error?.message || "Cloudinary từ chối video"));
      }
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng khi tải video"));
    xhr.send(formData);
  });
};

const VideoUploadField = ({
  value,
  onChange,
  savedUrl,
  onUploadingChange,
}: IVideoProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const upload = async (file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      message.error("Chỉ hỗ trợ video MP4, WEBM hoặc MOV");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      message.error("Video vượt quá 50MB");
      return;
    }

    setProgress(0);
    onUploadingChange(true);
    try {
      const url = await uploadVideoToCloudinary(file, setProgress);
      onChange?.(url);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Tải video thất bại",
      );
    } finally {
      setProgress(null);
      onUploadingChange(false);
    }
  };

  const remove = () => {
    if (!value) return;
    onChange?.(undefined);
    discardUnsavedImages([value], savedUrl ? [savedUrl] : []);
  };

  return (
    <div>
      {value && (
        <div className="max-w-sm">
          <video
            src={value}
            poster={getVideoPosterUrl(value)}
            controls
            muted
            playsInline
            preload="metadata"
            className="w-full rounded border border-gray-200 bg-black"
          />
          <Button
            className="mt-2"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={remove}
          >
            Xóa video
          </Button>
        </div>
      )}
      {progress !== null && <Progress percent={progress} size="small" />}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {!value && (
        <Button
          icon={<UploadOutlined />}
          loading={progress !== null}
          onClick={() => inputRef.current?.click()}
        >
          {progress !== null ? "Đang tải video..." : "Tải video lên"}
        </Button>
      )}
      <div className="mt-1 text-xs text-gray-400">
        MP4, WEBM hoặc MOV, tối đa 50MB. Video tự phát và tắt tiếng trên trang
        chủ.
      </div>
    </div>
  );
};

interface IProps extends IVideoProps {
  mediaType: IBannerMediaType;
}

// value và onChange do Form.Item truyền vào
const BannerMediaField = ({ mediaType, ...props }: IProps) =>
  mediaType === "video" ? (
    <VideoUploadField {...props} />
  ) : (
    <SingleImageUploadField {...props} />
  );

export default BannerMediaField;
