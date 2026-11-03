"use client";
import { handleDeleteUserAction } from "@/utils/actions";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import { Alert, Button, Popconfirm, Table } from "antd";
import type { TablePaginationConfig } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import UserCreate from "./user.create";
import UserUpdate from "./user.update";

interface IProps {
  users: IUserRecord[];
  meta: IPageMeta;
  error?: string;
}

const UserTable = (props: IProps) => {
  const { users, meta, error } = props;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [dataUpdate, setDataUpdate] = useState<IUserRecord | null>(null);

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
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Actions",

      render: (_: unknown, record: IUserRecord) => {
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

            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa user"}
              description={"Bạn có chắc chắn muốn xóa user này ?"}
              onConfirm={async () => await handleDeleteUserAction(record?._id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <span className="cursor-pointer">
                <DeleteTwoTone twoToneColor="#ff4d4f" />
              </span>
            </Popconfirm>
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
