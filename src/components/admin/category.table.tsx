"use client";

import {
  handleCreateCategoryAction,
  handleDeleteCategoryAction,
  handleUpdateCategoryAction,
} from "@/utils/actions";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  notification,
  Pagination,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect,
} from "antd";
import type { TableProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  SingleImageUploadField,
  discardUnsavedImages,
} from "./image.upload.field";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive: boolean;
}

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive?: boolean;
}

interface CategoryTreeOption {
  value: string;
  title: string;
  disabled: boolean;
  children: CategoryTreeOption[];
}

interface IProps {
  categories: Category[];
  current?: number;
  pageSize?: number;
  searchName?: string;
  error?: string;
}

const buildCategoryTree = (categories: Category[]): CategoryTreeNode[] => {
  const nodes: CategoryTreeNode[] = categories.map((category) => ({
    ...category,
    children: [],
  }));
  const nodesById = new Map(nodes.map((node) => [node._id, node]));
  const roots: CategoryTreeNode[] = [];

  nodes.forEach((node) => {
    const parent = node.parentId ? nodesById.get(node.parentId) : undefined;
    if (!parent || parent === node) {
      roots.push(node);
      return;
    }

    let ancestor: CategoryTreeNode | undefined = parent;
    const visited = new Set<string>();
    let createsCycle = false;
    while (ancestor) {
      if (ancestor._id === node._id || visited.has(ancestor._id)) {
        createsCycle = true;
        break;
      }
      visited.add(ancestor._id);
      ancestor = ancestor.parentId
        ? nodesById.get(ancestor.parentId)
        : undefined;
    }

    if (createsCycle) roots.push(node);
    else parent.children.push(node);
  });

  return roots;
};

const filterCategoryTree = (
  nodes: CategoryTreeNode[],
  searchTerm: string,
): CategoryTreeNode[] => {
  if (!searchTerm) return nodes;
  const normalizedSearch = searchTerm.toLocaleLowerCase();

  return nodes.reduce<CategoryTreeNode[]>((matches, node) => {
    const children = filterCategoryTree(node.children, searchTerm);
    if (
      node.name.toLocaleLowerCase().includes(normalizedSearch) ||
      children.length > 0
    ) {
      matches.push({ ...node, children });
    }
    return matches;
  }, []);
};

const collectDescendantIds = (node: CategoryTreeNode): Set<string> => {
  const ids = new Set<string>();
  const collect = (current: CategoryTreeNode) => {
    current.children.forEach((child) => {
      if (ids.has(child._id)) return;
      ids.add(child._id);
      collect(child);
    });
  };
  collect(node);
  return ids;
};

const CategoryTable = ({
  categories,
  current = 1,
  pageSize = 10,
  searchName = "",
  error,
}: IProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [form] = Form.useForm<CategoryFormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const visibleTree = useMemo(
    () => filterCategoryTree(categoryTree, searchName.trim()),
    [categoryTree, searchName],
  );
  const pageCount = Math.max(1, Math.ceil(visibleTree.length / pageSize));
  const activePage = Math.min(current, pageCount);
  const pagedTree = visibleTree.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  const parentOptions = useMemo(() => {
    const excludedIds = new Set<string>();
    if (editingCategory) {
      excludedIds.add(editingCategory._id);
      const editingNode = categories.find(
        (category) => category._id === editingCategory._id,
      );
      if (editingNode) {
        const fullTree = buildCategoryTree(categories);
        const findNode = (nodes: CategoryTreeNode[]): CategoryTreeNode | undefined => {
          for (const node of nodes) {
            if (node._id === editingCategory._id) return node;
            const found = findNode(node.children);
            if (found) return found;
          }
        };
        const treeNode = findNode(fullTree);
        if (treeNode) {
          collectDescendantIds(treeNode).forEach((id) => excludedIds.add(id));
        }
      }
    }

    const mapOptions = (
      nodes: CategoryTreeNode[],
    ): CategoryTreeOption[] =>
      nodes.map((node) => ({
        value: node._id,
        title: node.name,
        disabled: excludedIds.has(node._id),
        children: mapOptions(node.children),
      }));
    return mapOptions(categoryTree);
  }, [categories, categoryTree, editingCategory]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const cancelModal = () => {
    // Đóng lúc đang tải thì ảnh tải xong sẽ không còn form nào giữ URL của nó
    if (isUploading) {
      message.warning("Vui lòng chờ tải ảnh xong");
      return;
    }
    const image = form.getFieldValue("image");
    discardUnsavedImages(
      image ? [image] : [],
      editingCategory?.image ? [editingCategory.image] : [],
    );
    closeModal();
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalOpen(true);
  };

  const openUpdateModal = (category: Category) => {
    setEditingCategory(category);
    form.resetFields();
    form.setFieldsValue({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId ?? undefined,
      image: category.image,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values: CategoryFormValues) => {
    setIsSaving(true);
    try {
      const data = {
        ...values,
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || undefined,
        // Gửi null thay vì undefined để xóa được ảnh đã lưu
        image: values.image || null,
        parentId: values.parentId?.trim() || null,
      };
      const res = editingCategory
        ? await handleUpdateCategoryAction({
            _id: editingCategory._id,
            ...data,
          })
        : await handleCreateCategoryAction(data);

      if (!res?.data) {
        notification.error({
          title: editingCategory
            ? "Cập nhật thất bại"
            : "Tạo danh mục thất bại",
          description: res?.message || "Không thể lưu danh mục.",
        });
        return;
      }

      message.success(
        editingCategory
          ? "Cập nhật danh mục thành công!"
          : "Tạo danh mục thành công!",
      );
      closeModal();
      router.refresh();
    } catch (error) {
      notification.error({
        title: "Không thể lưu danh mục",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await handleDeleteCategoryAction(id);
      if (!res?.data) {
        notification.error({
          title: "Xóa danh mục thất bại",
          description: res?.message || "Không thể xóa danh mục.",
        });
        return;
      }

      message.success("Xóa danh mục thành công!");
      router.refresh();
    } catch (error) {
      notification.error({
        title: "Không thể xóa danh mục",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối máy chủ.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: TableProps<CategoryTreeNode>["columns"] = [
    { title: "Danh mục", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    {
      title: "Danh mục cha",
      dataIndex: "parentId",
      key: "parentId",
      render: (_parentId: Category["parentId"], category) =>
        categories.find((item) => item._id === category.parentId)?.name ??
        "Danh mục gốc",
    },
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      render: (image: string | undefined) =>
        image ? (
          <a href={image} target="_blank" rel="noreferrer">
            Xem ảnh
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? <Tag color="green">Đang hoạt động</Tag> : <Tag>Đã ẩn</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_value, category) => (
        <Space>
          <EditTwoTone
            twoToneColor="#f57800"
            className="cursor-pointer"
            onClick={() => openUpdateModal(category)}
          />
          <Popconfirm
            placement="leftTop"
            title="Xác nhận xóa danh mục"
            description={`Bạn có chắc chắn muốn xóa "${category.name}"?`}
            onConfirm={() => deleteCategory(category._id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              type="text"
              aria-label={`Xóa danh mục ${category.name}`}
              loading={isDeleting === category._id}
              icon={<DeleteTwoTone twoToneColor="#ff4d4f" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePaginationChange = (page: number, nextPageSize: number) => {
    updateQuery({
      current: String(pageSize === nextPageSize ? page : 1),
      pageSize: String(nextPageSize),
    });
  };

  const submitSearch = (value: string) => {
    updateQuery({ name: value.trim() || null, current: "1" });
  };

  return (
    <>
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title="Không thể tải danh sách danh mục"
          description={error}
        />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-medium">Quản lý danh mục</span>
        <Space wrap>
          <Input.Search
            key={searchParams.get("name") ?? ""}
            allowClear
            defaultValue={searchName}
            placeholder="Tìm theo tên danh mục"
            aria-label="Tìm theo tên danh mục"
            onSearch={submitSearch}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={openCreateModal}>
            Tạo danh mục
          </Button>
        </Space>
      </div>
      <Table<CategoryTreeNode>
        bordered
        dataSource={pagedTree}
        columns={columns}
        rowKey="_id"
        locale={{ emptyText: "Không có danh mục nào." }}
        expandable={{ defaultExpandAllRows: true }}
        pagination={false}
      />
      <div className="mt-4 flex justify-end">
        <Pagination
          current={activePage}
          pageSize={pageSize}
          total={visibleTree.length}
          showSizeChanger
          pageSizeOptions={[10, 20, 50]}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} trên ${total} danh mục gốc`
          }
          onChange={handlePaginationChange}
        />
      </div>

      <Modal
        title={editingCategory ? "Cập nhật danh mục" : "Tạo danh mục"}
        open={isModalOpen}
        confirmLoading={isSaving}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isUploading }}
        onCancel={cancelModal}
        okText={editingCategory ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        mask={{ closable: false }}
      >
        <Form
          form={form}
          name="category-form"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên danh mục!",
              },
            ]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập slug!",
              },
            ]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            label="Danh mục cha"
            name="parentId"
            extra="Để trống nếu đây là danh mục gốc."
          >
            <TreeSelect
              allowClear
              showSearch
              treeDefaultExpandAll
              treeNodeFilterProp="title"
              treeData={parentOptions}
              placeholder="Chọn danh mục cha"
              treeLine
              filterTreeNode={(inputValue, node) =>
                String(node.title)
                  .toLocaleLowerCase()
                  .includes(inputValue.toLocaleLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="Ảnh danh mục" name="image">
            <SingleImageUploadField
              savedUrl={editingCategory?.image}
              onUploadingChange={setIsUploading}
            />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
          <Form.Item
            label="Đang hoạt động"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryTable;
