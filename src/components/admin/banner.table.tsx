"use client";

import {
  handleCreateBannerAction,
  handleDeleteBannerAction,
  handleUpdateBannerAction,
} from "@/utils/actions";
import { getVideoPosterUrl } from "@/utils/store";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import BannerMediaField from "./banner.media.field";
import { discardUnsavedImages } from "./image.upload.field";

interface BannerFormValues {
  title: string;
  mediaType: IBannerMediaType;
  mediaUrl?: string;
  link?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface IProps {
  banners: IBannerRecord[];
  meta: IPageMeta;
  searchTitle?: string;
  error?: string;
}

// Giống kiểm tra của backend: đường dẫn nội bộ "/..." hoặc URL http(s)
const LINK_PATTERN = /^(\/(?!\/)\S*|https?:\/\/\S+)$/;

const MEDIA_TYPE_LABELS: Record<IBannerMediaType, string> = {
  image: "Ảnh",
  video: "Video",
};

const BannerPreview = ({ banner }: { banner: IBannerRecord }) =>
  banner.mediaType === "video" ? (
    <video
      src={banner.mediaUrl}
      poster={getVideoPosterUrl(banner.mediaUrl)}
      muted
      playsInline
      preload="metadata"
      className="h-17 w-30 rounded bg-black object-cover"
      onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
      onMouseLeave={(e) => e.currentTarget.pause()}
    />
  ) : (
    <Image
      src={banner.mediaUrl}
      alt={banner.title}
      width={120}
      height={68}
      className="rounded object-cover"
    />
  );

const BannerTable = ({ banners, meta, searchTitle = "", error }: IProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [form] = Form.useForm<BannerFormValues>();
  // Không dùng Form.useWatch: Form nằm trong Modal nên chưa mount khi modal chưa mở
  const [mediaType, setMediaType] = useState<IBannerMediaType>("image");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IBannerRecord | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const savedMedia = editingBanner ? [editingBanner.mediaUrl] : [];

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    form.resetFields();
  };

  const cancelModal = () => {
    // Đóng lúc đang tải thì file tải xong sẽ không còn form nào giữ URL của nó
    if (isUploading) {
      message.warning("Vui lòng chờ tải file xong");
      return;
    }
    const mediaUrl = form.getFieldValue("mediaUrl");
    discardUnsavedImages(mediaUrl ? [mediaUrl] : [], savedMedia);
    closeModal();
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    form.resetFields();
    setMediaType("image");
    form.setFieldsValue({
      mediaType: "image",
      isActive: true,
      // Banner mới xếp cuối danh sách (form hiển thị thứ tự từ 1)
      sortOrder: meta.total + 1,
    });
    setIsModalOpen(true);
  };

  const openUpdateModal = (banner: IBannerRecord) => {
    setEditingBanner(banner);
    form.resetFields();
    setMediaType(banner.mediaType);
    form.setFieldsValue({
      title: banner.title,
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      link: banner.link,
      sortOrder: banner.sortOrder + 1,
      isActive: banner.isActive,
    });
    setIsModalOpen(true);
  };

  // Đổi loại banner thì file cũ không còn dùng được
  const onValuesChange = (changed: Partial<BannerFormValues>) => {
    if (!changed.mediaType) return;
    setMediaType(changed.mediaType);
    const mediaUrl = form.getFieldValue("mediaUrl");
    discardUnsavedImages(mediaUrl ? [mediaUrl] : [], savedMedia);
    form.setFieldValue("mediaUrl", undefined);
  };

  const onFinish = async (values: BannerFormValues) => {
    if (!values.mediaUrl) return;
    setIsSaving(true);
    try {
      const data = {
        title: values.title.trim(),
        mediaType: values.mediaType,
        mediaUrl: values.mediaUrl,
        // Gửi null để xóa đường dẫn đã lưu
        link: values.link?.trim() || null,
        // Backend lưu thứ tự từ 0, giao diện hiển thị từ 1
        sortOrder: Math.max((values.sortOrder ?? 1) - 1, 0),
        isActive: values.isActive ?? true,
      };
      const res = editingBanner
        ? await handleUpdateBannerAction({ _id: editingBanner._id, ...data })
        : await handleCreateBannerAction(data);

      if (!res?.data) {
        notification.error({
          title: editingBanner ? "Cập nhật thất bại" : "Tạo banner thất bại",
          description: res?.message || "Không thể lưu banner.",
        });
        return;
      }

      message.success(
        editingBanner
          ? "Cập nhật banner thành công!"
          : "Tạo banner thành công!",
      );
      closeModal();
      router.refresh();
    } catch (error) {
      notification.error({
        title: "Không thể lưu banner",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (banner: IBannerRecord, isActive: boolean) => {
    setBusyId(banner._id);
    try {
      const res = await handleUpdateBannerAction({ _id: banner._id, isActive });
      if (!res?.data) {
        notification.error({
          title: "Đổi trạng thái thất bại",
          description: res?.message || "Không thể cập nhật banner.",
        });
        return;
      }
      message.success(isActive ? "Đã hiển thị banner" : "Đã ẩn banner");
      router.refresh();
    } catch {
      notification.error({
        title: "Không thể cập nhật banner",
        description: "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const deleteBanner = async (id: string) => {
    setBusyId(id);
    try {
      const res = await handleDeleteBannerAction(id);
      if (!res?.data) {
        notification.error({
          title: "Xóa banner thất bại",
          description: res?.message || "Không thể xóa banner.",
        });
        return;
      }
      message.success("Xóa banner thành công!");
      router.refresh();
    } catch {
      notification.error({
        title: "Không thể xóa banner",
        description: "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const columns: TableProps<IBannerRecord>["columns"] = [
    {
      title: "Xem trước",
      key: "preview",
      width: 150,
      render: (_value, banner) => <BannerPreview banner={banner} />,
    },
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Loại",
      dataIndex: "mediaType",
      key: "mediaType",
      render: (type: IBannerMediaType) => (
        <Tag color={type === "video" ? "purple" : "blue"}>
          {MEDIA_TYPE_LABELS[type]}
        </Tag>
      ),
    },
    {
      title: "Đường dẫn",
      dataIndex: "link",
      key: "link",
      render: (link?: string) => link || "—",
    },
    {
      title: "Thứ tự",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 90,
      render: (sortOrder: number) => sortOrder + 1,
    },
    {
      title: "Hiển thị",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, banner) => (
        <Switch
          checked={isActive}
          loading={busyId === banner._id}
          aria-label={`Hiển thị banner ${banner.title}`}
          onChange={(checked) => void toggleActive(banner, checked)}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_value, banner) => (
        <Space>
          <EditTwoTone
            twoToneColor="#f57800"
            className="cursor-pointer"
            onClick={() => openUpdateModal(banner)}
          />
          <Popconfirm
            placement="leftTop"
            title="Xác nhận xóa banner"
            description={`Bạn có chắc chắn muốn xóa "${banner.title}"?`}
            onConfirm={() => deleteBanner(banner._id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              type="text"
              aria-label={`Xóa banner ${banner.title}`}
              loading={busyId === banner._id}
              icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title="Không thể tải danh sách banner"
          description={error}
        />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-medium">Banner trang chủ</div>
          <div className="text-xs text-gray-500">
            Banner đang hiển thị chạy lần lượt theo thứ tự tăng dần (tối đa 10).
          </div>
        </div>
        <Space wrap>
          <Input.Search
            key={searchParams.get("title") ?? ""}
            allowClear
            defaultValue={searchTitle}
            placeholder="Tìm theo tiêu đề"
            aria-label="Tìm theo tiêu đề banner"
            onSearch={(value) =>
              updateQuery({ title: value.trim() || null, current: "1" })
            }
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={openCreateModal}>
            Thêm banner
          </Button>
        </Space>
      </div>
      <Table<IBannerRecord>
        bordered
        dataSource={banners}
        columns={columns}
        rowKey="_id"
        locale={{ emptyText: "Chưa có banner nào." }}
        scroll={{ x: "max-content" }}
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} trên ${total} banner`,
          onChange: (page, nextPageSize) =>
            updateQuery({
              current: String(meta.pageSize === nextPageSize ? page : 1),
              pageSize: String(nextPageSize),
            }),
        }}
      />

      <Modal
        title={editingBanner ? "Cập nhật banner" : "Thêm banner"}
        open={isModalOpen}
        confirmLoading={isSaving}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isUploading }}
        onCancel={cancelModal}
        okText={editingBanner ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        mask={{ closable: false }}
      >
        <Form
          form={form}
          name="banner-form"
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            extra="Dùng để quản lý và làm mô tả thay thế cho ảnh."
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tiêu đề!",
              },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item label="Loại banner" name="mediaType">
            <Radio.Group disabled={isUploading}>
              <Radio.Button value="image">Ảnh</Radio.Button>
              <Radio.Button value="video">Video</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label={mediaType === "video" ? "Video" : "Ảnh"}
            name="mediaUrl"
            rules={[
              {
                required: true,
                message:
                  mediaType === "video"
                    ? "Vui lòng tải video lên!"
                    : "Vui lòng tải ảnh lên!",
              },
            ]}
          >
            <BannerMediaField
              mediaType={mediaType}
              savedUrl={editingBanner?.mediaUrl}
              onUploadingChange={setIsUploading}
            />
          </Form.Item>
          <Form.Item
            label="Đường dẫn khi bấm vào banner"
            name="link"
            extra='Ví dụ "/shop" hoặc "https://...". Để trống nếu không cần.'
            rules={[
              {
                pattern: LINK_PATTERN,
                message: 'Đường dẫn phải bắt đầu bằng "/" hoặc http(s)://',
              },
            ]}
          >
            <Input maxLength={500} />
          </Form.Item>
          <Form.Item
            label="Thứ tự hiển thị"
            name="sortOrder"
            extra="Số nhỏ hiển thị trước."
          >
            <InputNumber<number>
              min={1}
              max={10000}
              precision={0}
              parser={(value) => Number(value || 1)}
            />
          </Form.Item>
          <Form.Item label="Hiển thị" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BannerTable;
