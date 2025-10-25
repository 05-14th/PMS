// ADDED: useEffect for data fetching, axios for API calls, and message for user feedback
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Input, Table, Space, Button, Typography, Row, Col, Select, Modal, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import AddSupplier from '../Forms_Supplier/AddSupplier';
import EditSupplier from '../Forms_Supplier/EditSupplier';

const { Title } = Typography;

// CHANGED: The interface now matches the Go back-end model exactly.
interface Supplier {
  SupplierID: number;
  SupplierName: string;
  ContactPerson: string; 
  PhoneNumber: string;
  Email: string; 
  Address: string; 
  Notes: string; 
}

// ADDED: An axios instance to communicate with the API.
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const SupplierComponent: React.FC = () => {
  // CHANGED: Removed the hardcoded sample data. The state now starts as an empty array.
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [searchText, setSearchText] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  // CHANGED: deletingKey is now a number to match the SupplierID.
  const [deletingKey, setDeletingKey] = useState<number | null>(null);

  // ADDED: A function to fetch live data from the server.
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to load suppliers.');
    } finally {
      setIsLoading(false);
    }
  };

  // ADDED: A useEffect hook to call fetchData() once when the component loads.
  useEffect(() => {
    fetchData();
  }, []);

  // Get unique supplier names for the filter dropdown
  const supplierOptions = useMemo(() => {
    // CHANGED: Uses SupplierName to match the new interface.
    const uniqueSuppliers = Array.from(new Set(suppliers.map(s => s.SupplierName)));
    return [
      { value: 'all', label: 'All Suppliers' },
      ...uniqueSuppliers.map(supplier => ({
        value: supplier.toLowerCase(),
        label: supplier
      }))
    ];
  }, [suppliers]);

  // Filter suppliers by search text and selected supplier
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = !searchText || 
        Object.values(supplier).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        );
      
      // CHANGED: Uses SupplierName to match the new interface.
      const matchesSupplier = selectedSupplier === 'all' || 
        supplier.SupplierName.toLowerCase() === selectedSupplier.toLowerCase();
      
      return matchesSearch && matchesSupplier;
    });
  }, [suppliers, searchText, selectedSupplier]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleSupplierFilter = (value: string) => {
    setSelectedSupplier(value);
  };

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record);
    setIsEditModalVisible(true);
  };

  // CHANGED: This function now saves the new supplier to the database.
  const handleAddSubmit = async (values: Omit<Supplier, 'SupplierID'>) => {
    setIsLoading(true);
    try {
      await api.post('/api/suppliers', values);
      setIsAddModalVisible(false);
      message.success('Supplier added successfully');
      await fetchData(); // Refresh data from server
    } catch (error) {
      console.error('Error adding supplier:', error);
      message.error('Failed to add supplier.');
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGED: This function now saves the updated supplier to the database.
  const handleEditSubmit = async (values: Supplier) => {
    if (!editingSupplier) return;
    setIsLoading(true);
    try {
      const payload = { ...editingSupplier, ...values };
      await api.put(`/api/suppliers/${editingSupplier.SupplierID}`, payload);
      setIsEditModalVisible(false);
      setEditingSupplier(null);
      message.success('Supplier updated successfully');
      await fetchData(); // Refresh data from server
    } catch (error) {
      console.error('Error updating supplier:', error);
      message.error('Failed to update supplier.');
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGED: The key is now a number (the SupplierID).
  const handleDelete = (key: number) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  // CHANGED: This function now deletes the supplier from the database.
  const confirmDelete = async () => {
    if (!deletingKey) return;
    setIsLoading(true);
    try {
      await api.delete(`/api/suppliers/${deletingKey}`);
      message.success('Supplier deleted successfully');
      await fetchData(); // Refresh data from server
    } catch (error) {
      console.error('Error deleting supplier:', error);
      message.error('Failed to delete supplier.');
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  const columns = [
    // CHANGED: dataIndex for each column now matches the new interface.
    {
      title: 'SUPPLIER NAME',
      dataIndex: 'SupplierName',
      key: 'SupplierName',
      sorter: (a: Supplier, b: Supplier) => a.SupplierName.localeCompare(b.SupplierName),
    },
    {
      title: 'CONTACT PERSON',
      dataIndex: 'ContactPerson',
      key: 'ContactPerson',
    },
    {
      title: 'PHONE NUMBER',
      dataIndex: 'PhoneNumber',
      key: 'PhoneNumber',
    },
    {
      title: 'EMAIL',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: 'ADDRESS',
      dataIndex: 'Address',
      key: 'Address',
    },
    {
      title: 'NOTES',
      dataIndex: 'Notes',
      key: 'Notes',
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: Supplier) => (
        <Space size="small">
          <Button 
            onClick={() => handleEdit(record)}
            icon={<EditOutlined />}
          />
          <Button 
            danger
            // CHANGED: Passes the correct SupplierID to the delete handler.
            onClick={() => handleDelete(record.SupplierID)}
            icon={<DeleteOutlined />}
          />
        </Space>
      ),
    },
  ];

  // The JSX below is unchanged, it will now use the live data and functions.
  return (
    <div className="p-4">
      <div className="relative mb-6">
        <Title level={3} className="text-gray-800">Suppliers</Title>
        <Button 
          type="default"
          icon={<PlusOutlined />} 
          onClick={() => setIsAddModalVisible(true)}
          className="absolute top-0 right-0 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
          style={{
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            height: 'auto',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          Add Supplier
        </Button>
      </div>
      <Card className="shadow-sm">
        <Row gutter={[16, 16]} className="mb-4 sm:mb-6" align="middle">
          <Col xs={24} sm={12} md={12} lg={10} xl={8}>
            <Input
              size="middle"
              placeholder="Search suppliers..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={handleSearch}
              allowClear
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={10} xl={8}>
            <Select
              size="middle"
              className="w-full"
              placeholder="Filter by supplier"
              value={selectedSupplier}
              onChange={handleSupplierFilter}
              options={supplierOptions}
              suffixIcon={<FilterOutlined className="text-gray-400" />}
            />
          </Col>
        </Row>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredSuppliers}
            rowKey="SupplierID" // CHANGED: The rowKey now uses the correct ID.
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </div>
        <AddSupplier
          visible={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          onAdd={handleAddSubmit}
          loading={isLoading}
        />
        {editingSupplier && (
          <EditSupplier
            visible={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingSupplier(null);
            }}
            onSave={handleEditSubmit}
            initialValues={editingSupplier}
            loading={isLoading}
          />
        )}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalVisible}
          onOk={confirmDelete}
          onCancel={() => setIsDeleteModalVisible(false)}
          confirmLoading={isLoading}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <p>Are you sure you want to delete this supplier?</p>
        </Modal>
      </Card>
    </div>
  );
};

export default SupplierComponent; // Renamed to avoid name conflict.