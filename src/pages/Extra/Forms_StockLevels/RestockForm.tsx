import React from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Modal, Button } from 'antd';

const { Option } = Select;

interface RestockFormProps {
  visible: boolean;
  onCancel: () => void;
  onRestock: (values: any) => void;
  loading: boolean;
  selectedItem: any;
}

const RestockForm: React.FC<RestockFormProps> = ({
  visible,
  onCancel,
  onRestock,
  loading,
  selectedItem,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onRestock(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Restock"
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
          className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-800"
        >
          Save
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          purchaseDate: undefined,
          unit: selectedItem?.unit || 'kg',
        }}
      >
        <Form.Item
          name="purchaseDate"
          label="Purchase Date"
          rules={[{ required: true, message: 'Please select purchase date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity Purchased"
          rules={[{ required: true, message: 'Please enter quantity' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Unit"
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="amountPaid"
          label="Total Amount Paid"
          rules={[{ required: true, message: 'Please enter amount' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="₱" />
        </Form.Item>

        <Form.Item
          name="supplierId"
          label="Supplier"
          rules={[{ required: true, message: 'Please select a supplier' }]}
        >
          <Select placeholder="Select supplier">
            <Option value="1">ABC Feeds</Option>
            <Option value="2">Poultry Supplies Inc.</Option>
            <Option value="3">Farm Essentials</Option>
          </Select>
        </Form.Item>

        <div className="text-center text-gray-600 text-base font-medium mb-3 mt-2">If new:</div>

        <Form.Item
          name="contactPerson"
          label="Contact Person"
          rules={[{ required: true, message: 'Please enter contact person' }]}
        >
          <Input placeholder="Enter contact person" />
        </Form.Item>
        
        <Form.Item
          name="contactNumber"
          label="Contact Number"
          rules={[
            { required: true, message: 'Please enter contact number' },
            { pattern: /^[0-9+\- ]+$/, message: 'Please enter a valid phone number' }
          ]}
        >
          <Input placeholder="Enter contact number" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RestockForm;