import React, { useState } from 'react';
import { Table, Space, Button, Modal, message, Row, Col, Form, Select, DatePicker, InputNumber, Typography, Card } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AddCustomerForm from '../Forms_Sales/AddCustomerForm';

const { Title, Text } = Typography;
const { Option } = Select;

// Sample product data - replace with actual API call in production
const productData = [
  { id: '1', name: 'Live Chicken', price: 150, available: 100, unit: 'heads' },
  { id: '2', name: 'Dressed Chicken', price: 200, available: 50, unit: 'kgs' },
];

interface SaleItem {
  key: string;
  product: string;
  quantity: number;
  weight: number;
  pricePerUnit: number;
  paymentMethod: string;
  customer: string;
  saleDate: string;
}

const NewSale: React.FC = () => {
  const [form] = Form.useForm();
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [unit, setUnit] = useState<string>('');
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);

  // Set default sale date to today
  React.useEffect(() => {
    form.setFieldsValue({
      saleDate: dayjs(),
      paymentMethod: 'cash',
      quantity: 1,
      weight: 0,
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
      const newSale: SaleItem = {
        key: Date.now().toString(),
        product: product.name,
        quantity: values.quantity,
        weight: values.weight,
        pricePerUnit: values.pricePerUnit,
        customer: values.customer,
        saleDate: values.saleDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod
      };
      
      setSalesItems(prev => [...prev, newSale]);
      form.resetFields();
      message.success('Sale added successfully');
    }
  };

  const handleAddCustomer = (values: any) => {
    console.log('New customer:', values);
    message.success('Customer added successfully');
    setIsCustomerModalVisible(false);
    // Here you would typically add the customer to your state or API
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Sale Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: 'PriceUnit (₱)',
      dataIndex: 'pricePerUnit',
      key: 'pricePerUnit',
      render: (price: number) => `₱${price.toFixed(2)}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodNames: {[key: string]: string} = {
          'cash': 'Cash',
          'gcash': 'GCash',
          'bank_transfer': 'Bank Transfer'
        };
        return methodNames[method] || method;
      },
    },
    {
      title: 'Subtotal (₱)',
      key: 'subtotal',
      render: (_: any, record: SaleItem) => {
        const subtotal = record.quantity * record.pricePerUnit;
        return `₱${subtotal.toFixed(2)}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: SaleItem) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => setEditingItem(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.key)}
          />
        </Space>
      ),
    },
  ];

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!deletingKey) return;
    setSalesItems(prev => prev.filter(item => item.key !== deletingKey));
    setIsDeleteModalVisible(false);
    message.success('Item deleted successfully');
  };

  const calculateTotal = () => {
    return salesItems.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2>New Sale</h2>
        </Col>
      </Row>

      {/* Add Customer Modal */}
      <AddCustomerForm
        visible={isCustomerModalVisible}
        onCreate={handleAddCustomer}
        onCancel={() => setIsCustomerModalVisible(false)}
      />

      {/* Add Sales Form */}
      <Card 
        title={
          <Title level={4} style={{ margin: 0 }}>Order Information</Title>
        }
        style={{ marginBottom: 24 }}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Customer"
                name="customer"
                rules={[{ required: true, message: 'Please select a customer' }]}
              >
                <Select placeholder="Select customer" showSearch>
                  <Option value="customer1">John Doe</Option>
                  <Option value="customer2">Jane Smith</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Sale Date"
                name="saleDate"
                rules={[{ required: true, message: 'Please select sale date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
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
            </Col>
          </Row>

          <div style={{ margin: '24px 0' }}>
            <Text strong>Product Details</Text>
          </div>

          <Row gutter={16}>
            <Col span={8}>
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
            </Col>
            <Col span={4}>
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
            </Col>
            <Col span={4}>
              <Form.Item
                label="Weight (kg)"
                name="weight"
                rules={[{ required: true, message: 'Please enter weight' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Price per Unit (₱)"
                name="pricePerUnit"
                rules={[{ required: true, message: 'Please enter price per unit' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Sales Items Table */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Order Items</Title>
        <Table 
          columns={columns} 
          dataSource={salesItems}
          pagination={false}
          rowKey="key"
          footer={() => (
            <div className="text-right pr-4 font-semibold">
              Total: ₱{calculateTotal().toFixed(2)}
            </div>
          )}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
        <Button 
          type="default"
          icon={<PlusOutlined />}
          onClick={() => setIsCustomerModalVisible(true)}
          style={{ 
            whiteSpace: 'nowrap',
            background: '#fff',
            borderColor: '#d9d9d9',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          New Customer
        </Button>
        
        <Form.Item style={{ margin: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.preventDefault();
              form.submit();
            }}
            style={{ 
              background: '#fff',
              color: '#000',
              borderColor: '#d9d9d9',
              height: '40px'
            }}
          >
            Add to Order
          </Button>
        </Form.Item>
        
        <Button 
          type="primary"
          size="large"
          onClick={() => {
            if (salesItems.length === 0) {
              message.warning('Please add at least one item to save');
              return;
            }
            console.log('Saving sale items:', salesItems);
            message.success('Sale saved successfully');
          }}
          disabled={salesItems.length === 0}
        >
          Save Sale
        </Button>
      </div>

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>
    </div>
  );
};

export default NewSale;
