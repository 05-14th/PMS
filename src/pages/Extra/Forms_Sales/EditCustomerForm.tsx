import React, { useEffect } from 'react';
import { Form, Input, Modal, Button } from 'antd';

interface EditCustomerFormProps {
  visible: boolean;
  onUpdate: (values: any) => void;
  onCancel: () => void;
  initialValues?: {
    customerId: string;
    customerName: string;
    businessName: string;
    contactNumber: string;
    email: string;
    address: string;
    key: string;
  };
}

const EditCustomerForm: React.FC<EditCustomerFormProps> = ({ 
  visible, 
  onUpdate, 
  onCancel, 
  initialValues 
}) => {
  const [form] = Form.useForm();

  // Set form initial values when they change
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Modal
      title="Edit Customer"
      open={visible}
      onCancel={onCancel}
      closable={false}
      footer={[
        <Button 
          key="cancel" 
          onClick={onCancel} 
          style={{ 
            background: '#fff', 
            border: '1px solid #d9d9d9',
            transition: 'all 0.3s'
          }}
          className="hover:bg-gray-100"
        >
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="default" 
          style={{ 
            background: '#fff', 
            border: '1px solid #d9d9d9',
            transition: 'all 0.3s'
          }}
          className="hover:bg-green-500 hover:text-white hover:border-green-500"
          onClick={() => {
            form
              .validateFields()
              .then((values) => {
                form.resetFields();
                onUpdate({ ...values, key: initialValues?.key, customerId: initialValues?.customerId });
              })
              .catch((info) => {
                console.log('Validate Failed:', info);
              });
          }}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_customer_form"
        initialValues={initialValues}
      >
        <Form.Item
          name="customerName"
          label="Customer Name"
          rules={[{ required: true, message: 'Please input the customer name!' }]}
        >
          <Input placeholder="Enter customer name" />
        </Form.Item>

        <Form.Item
          name="businessName"
          label="Business Name"
          rules={[{ required: true, message: 'Please input the business name!' }]}
        >
          <Input placeholder="Enter business name" />
        </Form.Item>

        <Form.Item
          name="contactNumber"
          label="Contact Number"
          rules={[
            { required: true, message: 'Please input the contact number!' },
            {
              pattern: /^09\d{9}$/,
              message: 'Please enter a valid Philippine mobile number (e.g., 09123456789)',
            },
          ]}
        >
          <Input placeholder="e.g., 09123456789" maxLength={11} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input the email!' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please input the address!' }]}
        >
          <Input.TextArea rows={3} placeholder="Enter complete address" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditCustomerForm;
