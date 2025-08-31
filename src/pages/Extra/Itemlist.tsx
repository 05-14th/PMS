import React, { useState } from 'react';
import { Card, Input, Select, Table, Space, Button, Typography, Row, Col, message, Modal } from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import AddForm from './Forms_Itemlist/AddForm';
import EditForm from './Forms_Itemlist/EditForm';

const { Title } = Typography;

interface Item {
  key: string;
  ItemID: string;
  ItemName: string;
  Category: string;
  Unit: string;
  SupplierID?: string | null;
}

const ItemList: React.FC = () => {
  // -------------------------------
  // Gerry (Backend Dev 👨‍💻)
  // 👉 Replace this placeholder with API response from GET /api/items
  // -------------------------------
  const [items, setItems] = useState<Item[]>([
    {
      key: '1',
      ItemID: '1',
      ItemName: 'Chicken Feed',
      Category: 'Feed',
      Unit: 'kg',
      SupplierID: '101',
    },
    {
      key: '2',
      ItemID: '2',
      ItemName: 'Vitamin Boost',
      Category: 'Vitamins',
      Unit: 'pcs',
      SupplierID: '102',
    },
    {
      key: '3',
      ItemID: '3',
      ItemName: 'Disinfectant',
      Category: 'Medicine',
      Unit: 'liter',
      SupplierID: '103',
    },
  ]);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Categories for filtering and form
  const [categories] = useState<Array<{ value: string; label: string; text: string }>>([
    { value: 'all', label: 'All Categories', text: 'All Categories' },
    { value: 'feed', label: 'Feed', text: 'Feed' },
    { value: 'vitamins', label: 'Vitamins', text: 'Vitamins' },
    { value: 'medicine', label: 'Medicine', text: 'Medicine' },
    { value: 'equipment', label: 'Equipment', text: 'Equipment' },
  ]);

  // -------------------------------
  // Gerry (Backend Dev 👨‍💻)
  // 👉 Define how to render data from API in the table
  // Columns map to database fields (ItemName, Category, Unit)
  // -------------------------------
  const columns: TableProps<Item>['columns'] = [
    {
      title: 'ITEM NAME',
      dataIndex: 'ItemName',
      key: 'ItemName',
      sorter: (a, b) => a.ItemName.localeCompare(b.ItemName),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'CATEGORY',
      dataIndex: 'Category',
      key: 'Category',
      filters: categories.filter(cat => cat.value !== 'all'),
      onFilter: (value: string | number | bigint | boolean, record: Item) =>
        record.Category?.toLowerCase() === value.toString().toLowerCase(),
      render: (category: string) => (
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
          {category}
        </span>
      ),
    },
    {
      title: 'UNIT',
      dataIndex: 'Unit',
      key: 'Unit',
      render: (unit) => <span className="text-gray-600">{unit}</span>,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            onClick={() => handleEdit(record)}
            className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
            icon={<EditOutlined />}
          />
          <Button 
            danger
            onClick={() => handleDelete(record.key)}
            className="bg-white hover:bg-gray-100 text-red-600 border-gray-300"
            icon={<DeleteOutlined />}
          />
        </Space>
      ),
    },
  ];

  // ✅ Filter items by search + category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.ItemName.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ||
      item.Category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  // -------------------------------
  // Gerry (Backend Dev 👨‍💻)
  // 👉 Connect to POST /api/items for adding a new item
  // -------------------------------
  const handleAdd = () => {
    setIsAddModalVisible(true);
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  const handleAddSubmit = (values: any) => {
    // TODO: Connect to your API to add the new item
    console.log('Received values of form: ', values);
    
    // For now, just show a success message and close the modal
    message.success('Item added successfully');
    setIsAddModalVisible(false);
    
    // TODO: Update the items list after successful API call
    // setItems([...items, newItem]);
  };

  const handleEdit = (record: Item) => {
    setEditingItem(record);
    setIsEditModalVisible(true);
  };

  const handleUpdate = (values: any) => {
    // TODO: Connect to your API to update the item
    console.log('Updating item:', values);
    
    // For now, just show a success message and close the modal
    message.success('Item updated successfully');
    setIsEditModalVisible(false);
    
    // TODO: Update the items list after successful API call
    // setItems(items.map(item => item.key === values.key ? { ...item, ...values } : item));
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingItem(null);
  };

  // -------------------------------
  // Gerry (Backend Dev 👨‍💻)
  // 👉 Connect to DELETE /api/items/:id
  // -------------------------------
  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    
    try {
      setIsLoading(true);
      // TODO: Connect to your API to delete the item
      // await api.deleteItem(deletingKey);
      
      // Update local state
      setItems(items.filter(item => item.key !== deletingKey));
      message.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      message.error('Failed to delete item');
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24}>
            <div>
              <Title level={4} className="m-0 text-gray-800 text-lg sm:text-xl">Item Management</Title>
              <p className="text-gray-500 m-0 text-sm sm:text-base">
                Manage your inventory items efficiently
              </p>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6" justify="end">
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            <Button 
              type="default"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
            >
              Add Item
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} className="mb-4 sm:mb-6" align="middle">
        <Col xs={24} sm={16} md={16} lg={12} xl={8}>
          <Input
            size="middle"
            placeholder="Search items..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={handleSearch}
            allowClear
            className="w-full"
          />
        </Col>
        <Col xs={16} sm={8} md={8} lg={6} xl={4}>
          <Select
            size="middle"
            className="w-full"
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={handleCategoryChange}
            options={categories}
            suffixIcon={<FilterOutlined className="text-gray-400" />}
          />
        </Col>
      </Row>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="key"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            className: 'px-1 sm:px-4 py-2',
            size: 'small',
            showLessItems: true,
            responsive: true,
          }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div className="py-8 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">No items found</p>
              </div>
            ),
          }}
          className="rounded-lg"
          size="middle"
        />
      </div>

      {/* Add Item Modal */}
      <AddForm
        visible={isAddModalVisible}
        onCreate={handleAddSubmit}
        onCancel={handleAddCancel}
        categories={categories}
      />
      
      {/* Edit Item Modal */}
      {editingItem && (
        <EditForm
          visible={isEditModalVisible}
          onUpdate={handleUpdate}
          onCancel={handleEditCancel}
          categories={categories}
          initialValues={editingItem}
        />
      )}

      {/* Delete Confirmation Modal */}
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
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ItemList;
