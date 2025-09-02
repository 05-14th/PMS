import React, { useState, useEffect } from 'react';
import { Input, Select, Table, Space, Button, Typography, Row, Col, message, Modal } from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import AddForm from '../Forms_Itemlist/AddForm';
import EditForm from '../Forms_Itemlist/EditForm';
import axios from 'axios';

interface Item {
  key: string;
  ItemID: string;
  ItemName: string;
  Category: string;
  Unit: string;
  SupplierID?: string | null;
}

const { Title } = Typography;

const categories = [
  { value: 'Feed', label: 'Feed' },
  { value: 'Vitamins', label: 'Vitamins' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Equipment', label: 'Equipment' }
];

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      message.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) {
      console.error('Items is not an array:', items);
      return [];
    }
    
    return items.filter(item => {
      if (!item) return false;
      
      const matchesSearch = item.ItemName?.toLowerCase().includes(searchText.toLowerCase()) ?? false;
      const matchesCategory = categoryFilter === 'all' || 
        item.Category?.toLowerCase() === categoryFilter.toLowerCase();
      
      return matchesSearch && matchesCategory;
    }).map((item, idx) => ({
      ...item,
      key: item.ItemID || item.key || `item-${idx}`
    }));
  }, [items, searchText, categoryFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleAdd = (newItem: Omit<Item, 'key'>) => {
    const itemWithKey = { ...newItem, key: Date.now().toString() };
    setItems(prevItems => [...prevItems, itemWithKey]);
    setIsAddModalVisible(false);
    message.success('Item added successfully');
  };

  const handleEdit = (updatedItem: Item) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.key === updatedItem.key ? updatedItem : item
      )
    );
    setIsEditModalVisible(false);
    setEditingItem(null);
    message.success('Item updated successfully');
  };

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    try {
      setIsLoading(true);
      await api.delete(`/deleteItem/${deletingKey}`);
      message.success('Item deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      message.error('Failed to delete item');
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  const columns: TableProps<Item>['columns'] = [
    {
      title: 'Item Name',
      dataIndex: 'ItemName',
      key: 'ItemName',
      sorter: (a, b) => a.ItemName.localeCompare(b.ItemName),
    },
    {
      title: 'Category',
      dataIndex: 'Category',
      key: 'Category',
      filters: categories.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value, record) => record.Category === value,
    },
    {
      title: 'Unit',
      dataIndex: 'Unit',
      key: 'Unit',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            onClick={() => {
              setEditingItem(record);
              setIsEditModalVisible(true);
            }}
            icon={<EditOutlined />}
          />
          <Button 
            danger
            onClick={() => handleDelete(record.key)}
            icon={<DeleteOutlined />}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="relative mb-6">
        <Title level={3} className="text-gray-800">Item Management</Title>
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
          Add New Item
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={8} lg={6} className="mb-4 sm:mb-0">
            <Input
              placeholder="Search items..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              className="w-full"
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={handleCategoryChange}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories
              ]}
              suffixIcon={<FilterOutlined className="text-gray-400" />}
            />
          </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={filteredItems}
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={isLoading}
        />
      </div>

      <AddForm
        visible={isAddModalVisible}
        onCreate={handleAdd}
        onCancel={() => setIsAddModalVisible(false)}
        categories={categories}
      />

      {editingItem && (
        <EditForm
          visible={isEditModalVisible}
          onUpdate={handleEdit}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingItem(null);
          }}
          initialValues={editingItem}
          categories={categories}
        />
      )}

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmLoading={isLoading}
      >
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ItemList;
