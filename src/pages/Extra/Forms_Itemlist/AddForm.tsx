import React from 'react';
// Step 1: Import 'message' for displaying feedback to the user
import { Form, Input, Select, Modal, Button, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

interface AddFormProps {
  visible: boolean;
  // Step 2: Change 'onCreate' to a simpler 'onSuccess' callback
  // This tells the parent component that the action was successful, so it can refetch the data.
  onSuccess: () => void;
  onCancel: () => void;
  categories: Array<{ value: string; label: string }>;
}

const AddForm: React.FC<AddFormProps> = ({ visible, onSuccess, onCancel, categories }) => {
  const [form] = Form.useForm();

  const handleAddItem = async (values: any) => {
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_APP_SERVERHOST,
        timeout: 10000,
      });

      // Step 3: Use the correct RESTful endpoint for creating an item
      const response = await api.post('/api/items', {
        ItemName: values.ItemName,
        Category: values.Category,
        Unit: values.Unit,
      });

      // After a successful API call, call the onSuccess prop to trigger a refresh
      if (response.data.success) {
        onSuccess();
      } else {
        message.error('An unknown error occurred while adding the item.');
      }
    } catch (err) {
      message.error('Failed to add item. Please try again.');
      console.error('Failed to add item', err);
    }
  };

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
          type="primary" // Changed to primary for better UI convention
          onClick={() => {
            form
              .validateFields()
              .then((values) => {
                // We no longer reset fields here, the parent will close the modal
                handleAddItem(values);
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