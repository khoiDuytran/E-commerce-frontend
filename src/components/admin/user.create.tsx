import { handleCreateUserAction } from "@/utils/actions";
import { Modal, Input, Form, Row, Col, message, notification } from "antd";

interface IProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
}

interface ICreateUserForm {
  email: string;
  password: string;
  name: string;
}

const UserCreate = (props: IProps) => {
  const { isCreateModalOpen, setIsCreateModalOpen } = props;

  const [form] = Form.useForm();

  const handleCloseCreateModal = () => {
    form.resetFields();
    setIsCreateModalOpen(false);
  };

  const onFinish = async (values: ICreateUserForm) => {
    const res = await handleCreateUserAction(values);
    if (res?.data) {
      handleCloseCreateModal();
      message.success("Tạo thành công!");
    } else {
      notification.error({
        title: "Tạo thất bại",
        description: res?.message,
      });
    }
  };

  return (
    <Modal
      title="Thêm người dùng mới"
      open={isCreateModalOpen}
      onOk={() => form.submit()}
      onCancel={() => handleCloseCreateModal()}
      mask={{ closable: false }}
    >
      <Form
        name="create-user"
        onFinish={onFinish}
        layout="vertical"
        form={form}
      >
        <Row gutter={[15, 15]}>
          <Col span={24}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Vui lòng nhập email!" }]}
            >
              <Input type="email" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserCreate;
