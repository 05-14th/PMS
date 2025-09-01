import React, { useState } from 'react';
import { Card, Input, Table, Space, Button, Typography, Row, Col, message, Modal } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AddCustomerForm from '../Forms_Sales/AddCustomerForm';
import EditCustomerForm from '../Forms_Sales/EditCustomerForm';

const { Title } = Typography;

interface Customer {
  key: string;
  customerId: string;
  customerName: string;
  businessName: string;
  contactNumber: string;
  email: string;
  address: string;
  dateAdded: string;
}

const Customers: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Sample data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      key: '1',
      customerId: 'CUST001',
      customerName: 'John Smith',
      businessName: 'Smith Poultry Farm',
      contactNumber: '09123456789',
      email: 'john.smith@example.com',
      address: '123 Poultry St., Quezon City',
      dateAdded: '2025-01-15',
    },
    {
      key: '2',
      customerId: 'CUST002',
      customerName: 'Maria Garcia',
      businessName: 'Garcia Poultry Supply',
      contactNumber: '09234567890',
      email: 'maria.garcia@example.com',
      address: '456 Chicken Ave., Makati City',
      dateAdded: '2025-02-20',
    },
    {
      key: '3',
      customerId: 'CUST003',
      customerName: 'Robert Johnson',
      businessName: 'Johnson Farm Fresh',
      contactNumber: '09345678901',
      email: 'robert.j@example.com',
      address: '789 Farm Road, Bulacan',
      dateAdded: '2025-03-10',
    },
    {
      key: '4',
      customerId: 'CUST004',
      customerName: 'Sarah Wilson',
      businessName: 'Wilson Poultry Distributors',
      contactNumber: '09456789012',
      email: 'sarah.wilson@example.com',
      address: '321 Poultry Circle, Laguna',
      dateAdded: '2025-04-05',
    },
    {
      key: '5',
      customerId: 'CUST005',
      customerName: 'Michael Brown',
      businessName: 'Brown Farm Produce',
      contactNumber: '09567890123',
      email: 'michael.b@example.com',
      address: '654 Farmville, Batangas',
      dateAdded: '2025-05-12',
    },
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    // Implement search logic here
  };

  const handleAddCustomer = (values: Omit<Customer, 'key' | 'customerId' | 'dateAdded'>) => {
    const newCustomer: Customer = {
      key: (customers.length + 1).toString(),
      customerId: `CUST${String(customers.length + 1).padStart(3, '0')}`,
      dateAdded: new Date().toISOString().split('T')[0],
      ...values,
    };
    
    setCustomers([...customers, newCustomer]);
    setIsAddModalVisible(false);
    message.success('Customer added successfully');
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    setIsEditModalVisible(true);
  };

  const handleUpdateCustomer = (values: Partial<Customer>) => {
    if (!editingCustomer) return;
    
    setCustomers(customers.map(customer => 
      customer.key === editingCustomer.key 
        ? { ...customer, ...values } 
        : customer
    ));
    
    setIsEditModalVisible(false);
    setEditingCustomer(null);
    message.success('Customer updated successfully');
  };

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    
    try {
      setIsLoading(true);
      // TODO: Connect to your API to delete the customer
      // await api.deleteCustomer(deletingKey);
      
      // Update local state
      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.key !== deletingKey));
      message.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      message.error('Failed to delete customer');
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.contactNumber.includes(searchText) ||
    customer.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'CUSTOMER NAME',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a: Customer, b: Customer) => a.customerName.localeCompare(b.customerName),
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'BUSINESS NAME',
      dataIndex: 'businessName',
      key: 'businessName',
    },
    {
      title: 'CONTACT NUMBER',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'ADDRESS',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'DATE ADDED',
      dataIndex: 'dateAdded',
      key: 'dateAdded',
      sorter: (a: Customer, b: Customer) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime(),
    },
    {
      title: 'ACTION',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Customer) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.key);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card className="shadow-sm">
        <Row justify="space-between" align="middle" className="mb-6">
          <Col>
            <Title level={4} className="mb-0">Customers</Title>
          </Col>
          <Col>
            <Button 
              type="default" 
              icon={<PlusOutlined />}
              style={{ 
                background: 'white',
                border: '1px solid #d9d9d9',
                color: 'rgba(0, 0, 0, 0.88)'
              }}
              onClick={() => setIsAddModalVisible(true)}
            >
              Add New Customer
            </Button>
          </Col>
        </Row>
        
        <div className="mb-4">
          <Input
            placeholder="Search customer name, business, contact, or email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            style={{ width: 400 }}
            allowClear
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredCustomers}
          loading={isLoading}
          rowKey="customerId"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Add Customer Modal */}
      <AddCustomerForm
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onCreate={handleAddCustomer}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerForm
          visible={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingCustomer(null);
          }}
          onUpdate={handleUpdateCustomer}
          initialValues={editingCustomer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmLoading={isLoading}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this customer? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Customers;
