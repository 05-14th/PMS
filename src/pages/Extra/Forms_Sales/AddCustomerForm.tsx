import React from "react";
import { useState } from "react";
import { Form, Input, Modal, Button } from "antd";

interface AddCustomerFormProps {
  visible: boolean;
  onCreate: (values: any) => Promise<void>;
  onCancel: () => void;
}

const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  visible,
  onCreate,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // Add loading state
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true); // Start loading
      await onCreate(values); // Call the async create function
      form.resetFields();
    } catch (info) {
      console.log("Validate Failed:", info);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Modal
      title="Add New Customer"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Add Customer"
      // Add confirmLoading prop
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" name="add_customer_form">
        {/* Form Items are unchanged */}
        <Form.Item
          name="Name"
          label="Customer Name"
          rules={[
            { required: true, message: "Please input the customer name!" },
          ]}
        >
          <Input placeholder="Enter customer name" />
        </Form.Item>
        <Form.Item name="BusinessName" label="Business Name">
          <Input placeholder="Enter business name" />
        </Form.Item>
        <Form.Item name="ContactNumber" label="Contact Number">
          <Input placeholder="e.g., 09123456789" />
        </Form.Item>
        <Form.Item
          name="Email"
          label="Email"
          rules={[
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>
        <Form.Item name="Address" label="Address">
          <Input.TextArea rows={3} placeholder="Enter complete address" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default AddCustomerForm;
