import React from 'react';
import { Form, Input, Button, Modal } from 'antd';

interface AddSupplierProps {
  visible: boolean;
  onCancel: () => void;
  onAdd: (values: any) => void;
  loading?: boolean;
}

const AddSupplier: React.FC<AddSupplierProps> = ({ visible, onCancel, onAdd, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onAdd(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Add Supplier"
      open={visible}
      onCancel={onCancel}
      closable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
        >
          Save
        </Button>,
      ]}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <Form.Item
            name="SupplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please input the supplier name!' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>
          
          <Form.Item
            name="ContactPerson"
            label="Contact Person"
          >
            <Input placeholder="Enter contact person" />
          </Form.Item>
          
          <Form.Item
            name="PhoneNumber"
            label="Phone Number"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          
          <Form.Item
            name="Email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          
          <Form.Item
            name="Address"
            label="Address"
            className="md:col-span-2"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>
          
          <Form.Item
            name="Notes"
            label="Notes"
            className="md:col-span-2"
          >
            <Input.TextArea rows={2} placeholder="Enter any additional notes" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSupplier;