"use client";
import {
  handleDeleteUserAction,
  handleUpdateUserStatusAction,
} from "@/utils/actions";
import {
  CheckCircleTwoTone,
  DeleteTwoTone,
  EditTwoTone,
  StopTwoTone,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  notification,
} from "antd";

const { Text } = Typography;
import type { TablePaginationConfig } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import UserCreate from "./user.create";
import UserUpdate from "./user.update";

interface IProps {
  users: IUserRecord[];
  meta: IPageMeta;
  currentUserId?: string;
  error?: string;
}

// Khớp với quy tắc backend: không xóa/khóa chính mình hoặc admin khác
const getLockReason = (record: IUserRecord, currentUserId?: string) => {
  if (record._id === currentUserId) {
    return "Không thể thực hiện trên tài khoản của chính bạn";
  }
  if (record.role === "ADMIN") {
    return "Không thể thực hiện trên tài khoản quản trị viên khác";
  }
  return null;
};

// Icon bị làm mờ thay cho nút thao tác bị chặn, tooltip giải thích lý do
const LockedAction = ({
  reason,
  children,
}: {
  reason: string;
  children: React.ReactNode;
}) => (
  <Tooltip title={reason}>
    <span
      aria-disabled="true"
      aria-label={reason}
      className="mr-2 cursor-not-allowed opacity-30 grayscale"
    >
      {children}
    </span>
  </Tooltip>
);

const UserTable = (props: IProps) => {
  const { users, meta, currentUserId, error } = props;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [dataUpdate, setDataUpdate] = useState<IUserRecord | null>(null);

  const onToggleStatus = async (record: IUserRecord) => {
    const isDisabled = !record.isDisabled;
    const res = await handleUpdateUserStatusAction(record._id, isDisabled);
    if (res?.data) {
      message.success(
        isDisabled ? "Đã vô hiệu hóa tài khoản" : "Đã mở khóa tài khoản",
      );
    } else {
      notification.error({
        title: isDisabled ? "Vô hiệu hóa thất bại" : "Mở khóa thất bại",
        description: res?.message,
      });
    }
  };

  const onDelete = async (record: IUserRecord) => {
    const res = await handleDeleteUserAction(record._id);
    if (res?.data) {
      message.success("Đã xóa người dùng");
    } else {
      notification.error({ title: "Xóa thất bại", description: res?.message });
    }
  };

  const columns = [
    {
      title: "STT",
      render: (_: unknown, __: IUserRecord, index: number) => {
        return <>{index + 1 + (meta?.current - 1) * meta?.pageSize}</>;
      },
    },
    {
      title: "ID",
      dataIndex: "_id",
    },
    {
      title: "Tên",
      dataIndex: "name",
      render: (name: string | undefined, record: IUserRecord) => (
        <>
          {name || <Text type="secondary">Chưa đặt tên</Text>}
          {record._id === currentUserId && (
            <Tag color="blue" className="ml-2">
              (Bạn)
            </Tag>
          )}
        </>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role: UserRole | undefined) =>
        role === "ADMIN" ? (
          <Tag color="gold">Quản trị viên</Tag>
        ) : (
          <Tag>Người dùng</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isDisabled",
      render: (isDisabled: boolean | undefined, record: IUserRecord) => {
        if (isDisabled) return <Tag color="red">Vô hiệu hóa</Tag>;
        if (!record.isActive) return <Tag color="orange">Chưa kích hoạt</Tag>;
        return <Tag color="green">Hoạt động</Tag>;
      },
    },
    {
      title: "Actions",

      render: (_: unknown, record: IUserRecord) => {
        const lockReason = getLockReason(record, currentUserId);
        return (
          <>
            <EditTwoTone
              twoToneColor="#f57800"
              className="mr-2 ml-2 cursor-pointer"
              onClick={() => {
                setIsUpdateModalOpen(true);
                setDataUpdate(record);
              }}
            />

            {/* Mở khóa không nguy hiểm nên chỉ chặn khi tài khoản đang hoạt động */}
            {lockReason && !record.isDisabled ? (
              <LockedAction reason={lockReason}>
                <StopTwoTone twoToneColor="#ff4d4f" />
              </LockedAction>
            ) : (
              <Popconfirm
                placement="leftTop"
                title={
                  record.isDisabled
                    ? "Xác nhận mở khóa tài khoản"
                    : "Xác nhận vô hiệu hóa tài khoản"
                }
                description={
                  record.isDisabled
                    ? "Người dùng sẽ đăng nhập lại được."
                    : "Người dùng sẽ không đăng nhập được nữa."
                }
                onConfirm={async () => await onToggleStatus(record)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Tooltip title={record.isDisabled ? "Mở khóa" : "Vô hiệu hóa"}>
                  <span className="mr-2 cursor-pointer">
                    {record.isDisabled ? (
                      <CheckCircleTwoTone twoToneColor="#52c41a" />
                    ) : (
                      <StopTwoTone twoToneColor="#ff4d4f" />
                    )}
                  </span>
                </Tooltip>
              </Popconfirm>
            )}

            {lockReason ? (
              <LockedAction reason={lockReason}>
                <DeleteTwoTone twoToneColor="#ff4d4f" />
              </LockedAction>
            ) : (
              <Popconfirm
                placement="leftTop"
                title={"Xác nhận xóa user"}
                description={"Bạn có chắc chắn muốn xóa user này ?"}
                onConfirm={async () => await onDelete(record)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Tooltip title="Xóa">
                  <span className="cursor-pointer">
                    <DeleteTwoTone twoToneColor="#ff4d4f" />
                  </span>
                </Tooltip>
              </Popconfirm>
            )}
          </>
        );
      },
    },
  ];

  const onChange = (pagination: TablePaginationConfig) => {
    if (pagination && pagination.current) {
      const params = new URLSearchParams(searchParams);
      params.set("current", String(pagination.current));
      replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <span>Quản lý người dùng</span>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Tạo người dùng
        </Button>
      </div>
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title="Không thể tải danh sách người dùng"
          description={error}
        />
      )}
      <Table
        bordered
        dataSource={users}
        columns={columns}
        rowKey={"_id"}
        pagination={{
          current: meta?.current,
          pageSize: meta?.pageSize,
          showSizeChanger: true,
          total: meta?.total,
          showTotal: (total, range) => {
            return (
              <div>
                {" "}
                {range[0]}-{range[1]} trên {total} rows
              </div>
            );
          },
        }}
        onChange={onChange}
      />

      <UserCreate
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />

      <UserUpdate
        isUpdateModalOpen={isUpdateModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
      />
    </>
  );
};

export default UserTable;
