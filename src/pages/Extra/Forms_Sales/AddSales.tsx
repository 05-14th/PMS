import React, { useState, useEffect } from 'react';
import { Form, Button, Select, DatePicker, InputNumber, Typography, Space, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Sample product data - replace with actual API call in production
const productData = [
  { id: '1', name: 'Live Chicken', price: 150, available: 100, unit: 'heads' },
  { id: '2', name: 'Dressed Chicken', price: 200, available: 50, unit: 'kgs' },
];

interface AddSalesProps {
  onAddSale: (sale: {
    key: string;
    product: string;
    quantity: number;
    weight: number;
    pricePerUnit: number;
    customer: string;
    saleDate: string;
    paymentMethod: string;
  }) => void;
  onCancel: () => void;
}

const AddSales: React.FC<AddSalesProps> = ({ onAddSale, onCancel }) => {
  const [form] = Form.useForm();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [unit, setUnit] = useState<string>('');

  // Set default sale date to today
  useEffect(() => {
    form.setFieldsValue({
      saleDate: dayjs(),
      paymentMethod: 'cash' // Set default payment method
    });
  }, [form]);

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    const product = productData.find(p => p.id === value);
    if (product) {
      setAvailableQty(product.available);
      setUnit(product.unit);
      form.setFieldsValue({
        pricePerUnit: product.price,
        weight: 0,
        quantity: 1
      });
    }
  };

  const onFinish = (values: any) => {
    const product = productData.find(p => p.id === values.product);
    if (product) {
      onAddSale({
        key: Date.now().toString(),
        product: product.name,
        quantity: values.quantity,
        weight: values.weight,
        pricePerUnit: values.pricePerUnit,
        customer: values.customer,
        saleDate: values.saleDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod
      });
    }
  };

  return (
    <Card 
      title={
        <Title level={4} style={{ margin: 0 }}>Order Information</Title>
      }
      style={{ maxWidth: '100%' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          quantity: 1,
          weight: 0,
        }}
      >
        <Form.Item
          label="Customer"
          name="customer"
          rules={[{ required: true, message: 'Please select a customer' }]}
        >
          <Select placeholder="Select customer" showSearch>
            <Option value="customer1">John Doe</Option>
            <Option value="customer2">Jane Smith</Option>
            {/* Add more customers as needed */}
          </Select>
        </Form.Item>

        <Form.Item
          label="Sale Date"
          name="saleDate"
          rules={[{ required: true, message: 'Please select sale date' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          label="Payment Method"
          name="paymentMethod"
          rules={[{ required: true, message: 'Please select payment method' }]}
        >
          <Select placeholder="Select payment method">
            <Option value="cash">Cash</Option>
            <Option value="gcash">GCash</Option>
            <Option value="bank_transfer">Bank Transfer</Option>
          </Select>
        </Form.Item>

        <div style={{ margin: '24px 0' }}>
          <Text strong>Add Products to Order</Text>
        </div>

        <Form.Item
          label="Product"
          name="product"
          rules={[{ required: true, message: 'Please select a product' }]}
        >
          <Select 
            placeholder="Select product"
            onChange={handleProductChange}
            showSearch
            optionFilterProp="children"
          >
            {productData.map(product => (
              <Option key={product.id} value={product.id}>
                {product.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProduct && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Available: {availableQty} {unit}
            </Text>
          </div>
        )}

        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[
            { required: true, message: 'Please enter quantity' },
            {
              validator: (_, value) => {
                if (value > availableQty) {
                  return Promise.reject(`Only ${availableQty} available`);
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={1} max={availableQty} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Weight (kg)"
          name="weight"
          rules={[{ required: true, message: 'Please enter weight' }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Price/Unit (₱)"
          name="pricePerUnit"
          rules={[{ required: true, message: 'Please enter price per unit' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit"
              icon={<PlusOutlined />}
              style={{ 
                background: '#fff',
                color: '#000000',
                borderColor: '#d9d9d9',
                fontWeight: 500
              }}
            >
              Add to Order
            </Button>
            <Button 
              onClick={onCancel}
              style={{
                background: '#fff',
                color: '#666',
                borderColor: '#d9d9d9',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddSales;