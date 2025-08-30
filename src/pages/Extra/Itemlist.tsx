import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Table, Space, Button, Typography, Row, Col, message } from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';

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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // ✅ Categories for filtering
  const [categories] = useState<Array<{ value: string; label: string; text: string }>>([
    { value: 'all', label: 'All Categories', text: 'All Categories' },
    { value: 'feed', label: 'Feed', text: 'Feed' },
    { value: 'vitamins', label: 'Vitamins', text: 'Vitamins' },
    { value: 'medicine', label: 'Medicine', text: 'Medicine' },
    { value: 'equipment', label: 'Equipment', text: 'Equipment' },
  ]);

  // ✅ Fetch items from backend API
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8080/api/items'); // adjust API URL
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        // Add a "key" field for antd table
        const formatted = data.map((item: any) => ({
          ...item,
          key: item.ItemID.toString(),
        }));
        setItems(formatted);
      } catch (err) {
        console.error(err);
        message.error('Error fetching items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // ✅ Table columns
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

  const handleAdd = () => {
    console.log('Add new item');
  };

  const handleEdit = (item: Item) => {
    console.log('Edit item:', item);
  };

  const handleDelete = (key: string) => {
    setItems(items.filter(item => item.key !== key));
    message.success('Item deleted successfully');
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-sm border-0">
        <div className="mb-4 sm:mb-6">
          <Row gutter={[16, 16]} className="mb-4 sm:mb-6">
            <Col xs={24}>
              <Title level={4} className="m-0 text-gray-800 text-lg sm:text-xl">
                Item Management
              </Title>
              <p className="text-gray-500 m-0 text-sm sm:text-base">
                Manage your inventory items efficiently
              </p>
            </Col>
          </Row>

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
            <Col xs={8} sm={24} md={24} lg={6} xl={4} className="flex justify-end">
              <Button
                type="text"
                icon={<PlusOutlined className="text-green-600" />}
                onClick={handleAdd}
                className="w-full sm:w-auto flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
              >
                <span className="hidden sm:inline">Add New Item</span>
              </Button>
            </Col>
          </Row>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredItems}
            loading={loading}
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
      </Card>
    </div>
  );
};

export default ItemList;
