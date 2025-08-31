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
      onSave({ ...values, key: initialValues?.key });
      form.resetFields();
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
          type="default"
          onClick={handleSubmit}
          loading={loading}
          className="bg-white hover:bg-gray-50 border-gray-300"
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
        initialValues={initialValues}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please input the supplier name!' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>
          
          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: 'Please input the contact person!' }]}
          >
            <Input placeholder="Enter contact person" />
          </Form.Item>
          
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please input the phone number!' },
              {
                pattern: /^[0-9+\-\s()]*$/,
                message: 'Please enter a valid phone number!',
              },
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input the email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input the address!' }]}
            className="md:col-span-2"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>
          
          <Form.Item
            name="notes"
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