import React from 'react';
import { Form, Input, Select, Modal, Button } from 'antd';

const { Option } = Select;

interface AddFormProps {
  visible: boolean;
  onCreate: (values: any) => void;
  onCancel: () => void;
  categories: Array<{ value: string; label: string }>;
}

const AddForm: React.FC<AddFormProps> = ({ visible, onCreate, onCancel, categories }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="Add New Item"
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
                onCreate(values);
              })
              .catch((info) => {
                console.log('Validate Failed:', info);
              });
          }}
        >
          Add Item
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="add_item_form"
        initialValues={{ modifier: 'public' }}
      >
        <Form.Item
          name="ItemName"
          label="Item Name"
          rules={[{ required: true, message: 'Please input the item name!' }]}
        >
          <Input placeholder="Enter item name" />
        </Form.Item>

        <Form.Item
          name="Category"
          label="Category"
          rules={[{ required: true, message: 'Please select a category!' }]}
        >
          <Select placeholder="Select a category">
            {categories
              .filter(cat => cat.value !== 'all')
              .map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="Unit"
          label="Unit"
          rules={[{ required: true, message: 'Please input the unit!' }]}
        >
          <Input placeholder="e.g., kg, pcs, liter" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddForm;
