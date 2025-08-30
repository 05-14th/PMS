import React, { useState, useMemo } from 'react';
import { Card, Input, Table, Space, Button, Typography, Row, Col, Select, Modal } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import AddSupplier from './Forms_Supplier/AddSupplier';
import EditSupplier from './Forms_Supplier/EditSupplier';

const { Title } = Typography;

interface Supplier {
  key: string;
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  notes: string;
}

const Supplier: React.FC = () => {
  // Sample data - replace with actual data from your API
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      key: '1',
      supplierName: 'ABC Feeds',
      contactPerson: 'Isamael Bonaporte',
      phoneNumber: '09123456789',
      email: 'Bonaporte@abcfeeds.com',
      address: '123 Supplier St, Makati City',
      notes: 'Primary feed supplier',
    },
    // Add more sample data as needed
  ]);

  const [searchText, setSearchText] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Get unique supplier names for the filter dropdown
  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = Array.from(new Set(suppliers.map(s => s.supplierName)));
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
        Object.entries(supplier).some(([key, value]) => 
          key !== 'key' && value && 
          value.toString().toLowerCase().includes(searchText.toLowerCase())
        );
      
      const matchesSupplier = selectedSupplier === 'all' || 
        supplier.supplierName.toLowerCase() === selectedSupplier.toLowerCase();
      
      return matchesSearch && matchesSupplier;
    });
  }, [suppliers, searchText, selectedSupplier]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleSupplierFilter = (value: string) => {
    setSelectedSupplier(value);
  };

  const handleAdd = () => {
    setIsAddModalVisible(true);
  };

  const handleAddSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      // TODO: Replace with your actual API call
      // const response = await api.addSupplier(values);
      // setSuppliers([...suppliers, { ...values, key: response.id }]);
      
      // For now, just add to local state
      const newSupplier = {
        ...values,
        key: Date.now().toString(),
      };
      setSuppliers([...suppliers, newSupplier]);
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record);
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      // TODO: Replace with your actual API call
      // await api.updateSupplier(editingSupplier?.key, values);
      
      // Update local state
      setSuppliers(suppliers.map(supplier => 
        supplier.key === editingSupplier?.key 
          ? { ...values, key: editingSupplier.key } 
          : supplier
      ));
      
      setIsEditModalVisible(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with your actual API call
      // await api.deleteSupplier(deletingKey);
      
      // Update local state
      setSuppliers(suppliers.filter(supplier => supplier.key !== deletingKey));
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  const columns = [
    {
      title: 'SUPPLIER NAME',
      dataIndex: 'supplierName',
      key: 'supplierName',
      sorter: (a: Supplier, b: Supplier) => a.supplierName.localeCompare(b.supplierName),
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'CONTACT PERSON',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'PHONE NUMBER',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
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
    },
    {
      title: 'NOTES',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 200,
      render: (_: any, record: Supplier) => (
        <Space size="small">
          <Button
            type="text"
            icon={<PlusOutlined className="text-green-500" />}
            onClick={() => handleAdd(record)}
            className="hover:bg-green-50"
          />
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-50"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
            className="hover:bg-red-50"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-sm border-0">
        <div className="mb-4 sm:mb-6">
          <Row gutter={[16, 16]} className="mb-4 sm:mb-6">
            <Col xs={24}>
              <Title level={4} className="m-0 text-gray-800 text-lg sm:text-xl">
                Supplier Management
              </Title>
              <p className="text-gray-500 m-0 text-sm sm:text-base">
                Manage your suppliers efficiently
              </p>
            </Col>
          </Row>

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
                showSearch
                optionFilterProp="label"
                allowClear
                onClear={() => setSelectedSupplier('all')}
              />
            </Col>
          </Row>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredSuppliers}
            rowKey="key"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} suppliers`,
              className: 'px-1 sm:px-4 py-2',
              size: 'small',
              showLessItems: true,
              responsive: true,
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <div className="py-8 sm:py-12">
                  <p className="text-gray-500 text-base sm:text-lg">No suppliers found</p>
                </div>
              ),
            }}
            className="rounded-lg"
            size="middle"
          />
        </div>
      </Card>

      <AddSupplier
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onAdd={handleAddSubmit}
        loading={isLoading}
      />

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

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingKey(null);
        }}
        confirmLoading={isLoading}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this supplier? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Supplier;