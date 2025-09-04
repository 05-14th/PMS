import React, { useEffect } from 'react';
import { Form, Input, Button, Modal } from 'antd';

interface EditSupplierProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: any) => void;
  initialValues?: any;
  loading?: boolean;
}

const EditSupplier: React.FC<EditSupplierProps> = ({
  visible,
  onCancel,
  onSave,
  initialValues,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave(values); // No need to merge keys, parent component handles it
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Edit Supplier"
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
          Save Changes
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
          {/* CHANGED: name props are now PascalCase to match the data */}
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

export default EditSupplier;