import React, { useState } from 'react';
import { Table, Space, Button, Modal, message, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import AddSales from '../Forms_Sales/AddSales';

interface SaleItem {
  key: string;
  product: string;
  quantity: number;
  weight: number;
  pricePerUnit: number;
  paymentMethod: string;
}

const NewSale: React.FC = () => {
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
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
      title: 'Price/Unit (₱)',
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
        <Col>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => setIsAddCustomerModalVisible(true)}
            style={{ 
              background: '#ffffff', 
              color: '#000000', 
              borderColor: '#d9d9d9',
              fontWeight: 500
            }}
          >
            Add Customer
          </Button>
        </Col>
      </Row>

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

<div className="mt-4 text-right">
  <Button 
    type="default"
    size="large"
    style={{
      backgroundColor: '#ffffff',
      borderColor: '#d9d9d9',
      color: '#595959',
      fontWeight: 500,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}
    onClick={() => {
      if (salesItems.length === 0) {
        message.warning('Please add at least one item to save');
        return;
      }
      // TODO: Implement save functionality
      console.log('Saving sale items:', salesItems);
      message.success('Sale saved successfully');
    }}
    disabled={salesItems.length === 0}
    className="hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200"
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

      <Modal
        title="Add New Sale"
        open={isAddCustomerModalVisible}
        onCancel={() => setIsAddCustomerModalVisible(false)}
        footer={null}
        width={800}
        closable={false}
      >
        <AddSales 
          onAddSale={(sale) => {
            setSalesItems(prev => [...prev, sale]);
            setIsAddCustomerModalVisible(false);
            message.success('Sale added successfully');
          }}
          onCancel={() => setIsAddCustomerModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default NewSale;
