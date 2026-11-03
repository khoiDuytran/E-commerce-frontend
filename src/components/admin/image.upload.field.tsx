"use client";

import {
  handleDeleteImagesAction,
  handleUploadImageAction,
} from "@/utils/actions";
import {
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Image, Tooltip, message } from "antd";
import { useRef, useState } from "react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface IProps {
  // value và onChange do Form.Item truyền vào
  value?: string[];
  onChange?: (value: string[]) => void;
  // Ảnh đã lưu trong database: chỉ xóa thật sau khi bấm lưu, để còn hủy được
  savedUrls: string[];
  onUploadingChange: (isUploading: boolean) => void;
  // Chỉ giữ một ảnh, như ảnh danh mục hoặc logo thương hiệu
  single?: boolean;
}

// Hủy form: xóa các ảnh vừa tải lên nhưng chưa được lưu vào sản phẩm
export const discardUnsavedImages = (
  current: string[] | undefined,
  savedUrls: string[],
) => {
  const unsaved = (current ?? []).filter((url) => !savedUrls.includes(url));
  if (unsaved.length > 0) void handleDeleteImagesAction(unsaved).catch(() => {});
};

const ImageUploadField = ({
  value = [],
  onChange,
  savedUrls,
  onUploadingChange,
  single = false,
}: IProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const setUploading = (next: boolean) => {
    setIsUploading(next);
    onUploadingChange(next);
  };

  // Tải lần lượt từng ảnh vì server action giới hạn dung lượng mỗi request.
  // Danh sách bị khóa khi đang tải nên có thể cộng dồn từ value ban đầu.
  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    let next = value;
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        message.error(`${file.name}: chỉ hỗ trợ JPG, PNG, WEBP hoặc AVIF`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        message.error(`${file.name}: ảnh vượt quá 5MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await handleUploadImageAction(formData);
        if (res?.data?.url) {
          next = [...next, res.data.url];
          onChange?.(next);
        } else {
          message.error(`${file.name}: ${res?.message || "Tải ảnh thất bại"}`);
        }
      } catch {
        message.error(`${file.name}: lỗi khi kết nối máy chủ`);
      }
    }
    setUploading(false);
  };

  const moveImage = (index: number, offset: number) => {
    const next = [...value];
    const [moved] = next.splice(index, 1);
    next.splice(index + offset, 0, moved);
    onChange?.(next);
  };

  const removeImage = (url: string) => {
    onChange?.(value.filter((item) => item !== url));
    discardUnsavedImages([url], savedUrls);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, index) => (
          <div key={url} className="w-28">
            <div className="relative">
              <Image
                src={url}
                alt={`Ảnh ${index + 1}`}
                width={112}
                height={112}
                className="rounded border border-gray-200 object-cover"
              />
              {!single && index === 0 && (
                <span className="absolute left-1 top-1 z-10 rounded bg-black/70 px-1.5 text-xs text-white">
                  Ảnh bìa
                </span>
              )}
            </div>
            <div
              className={`mt-1 flex ${single ? "justify-center" : "justify-between"}`}
            >
              {!single && (
                <Tooltip title="Chuyển lên trước">
                  <Button
                    size="small"
                    type="text"
                    aria-label="Chuyển lên trước"
                    icon={<LeftOutlined />}
                    disabled={isUploading || index === 0}
                    onClick={() => moveImage(index, -1)}
                  />
                </Tooltip>
              )}
              <Tooltip title="Xóa ảnh">
                <Button
                  size="small"
                  type="text"
                  danger
                  aria-label="Xóa ảnh"
                  icon={<DeleteOutlined />}
                  disabled={isUploading}
                  onClick={() => removeImage(url)}
                />
              </Tooltip>
              {!single && (
                <Tooltip title="Chuyển ra sau">
                  <Button
                    size="small"
                    type="text"
                    aria-label="Chuyển ra sau"
                    icon={<RightOutlined />}
                    disabled={isUploading || index === value.length - 1}
                    onClick={() => moveImage(index, 1)}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={!single}
        hidden
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Cho phép chọn lại cùng một file sau khi đã xóa
          e.target.value = "";
          if (files.length > 0) void uploadFiles(files);
        }}
      />
      {!(single && value.length > 0) && (
        <Button
          className={value.length > 0 ? "mt-3" : ""}
          icon={<UploadOutlined />}
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Đang tải ảnh..." : "Tải ảnh lên"}
        </Button>
      )}
      <div className="mt-1 text-xs text-gray-400">
        {single
          ? "JPG, PNG, WEBP hoặc AVIF, tối đa 5MB. Muốn đổi ảnh thì xóa ảnh hiện tại rồi tải ảnh mới."
          : "JPG, PNG, WEBP hoặc AVIF, tối đa 5MB mỗi ảnh. Ảnh đầu tiên là ảnh bìa."}
      </div>
    </div>
  );
};

interface ISingleProps {
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  savedUrl?: string | null;
  onUploadingChange: (isUploading: boolean) => void;
}

// Dùng cho field của Form lưu một URL thay vì danh sách
export const SingleImageUploadField = ({
  value,
  onChange,
  savedUrl,
  onUploadingChange,
}: ISingleProps) => (
  <ImageUploadField
    single
    value={value ? [value] : []}
    onChange={(urls) => onChange?.(urls[0])}
    savedUrls={savedUrl ? [savedUrl] : []}
    onUploadingChange={onUploadingChange}
  />
);

export default ImageUploadField;
