import React, { useState } from 'react';
import { Table, Input, Button, Card, Typography, Row, Col, Select, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, PlusCircleOutlined } from '@ant-design/icons';
import AddStockForm from '../Forms_StockLevels/AddStock';
import RestockForm from '../Forms_StockLevels/RestockForm';

const { Title } = Typography;

interface InventoryItem {
  key: string;
  itemName: string;
  totalQuantity: number;
  unit: string;
  lowStock: boolean;
}

interface PurchaseRecord {
  key: string;
  purchaseDate: string;
  quantity: number;
  remaining: number;
  cost: number;
  supplier: string;
  unit: string;
}

const StockLevels: React.FC = () => {
  // State for search and filters
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormLoading, setAddFormLoading] = useState(false);

  // Sample data - replace with actual data from your API
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      key: '1',
      itemName: 'Chicken Feed',
      totalQuantity: 120,
      unit: 'kg',
      lowStock: false
    }
  ]);

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([
    {
      key: '1',
      purchaseDate: '2025-08-15',
      quantity: 50,
      remaining: 35,
      cost: 2500,
      supplier: 'ABC Feeds',
      unit: 'kg'
    },
    {
      key: '1',
      purchaseDate: '2025-08-20',
      quantity: 100,
      remaining: 85,
      cost: 5000,
      supplier: 'ABC Feeds',
      unit: 'kg'
    }
  ]);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);

  // Filter inventory items based on search text and selected item
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchText || 
      item.itemName.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = selectedItem === 'all' || 
      (selectedItem === 'low' && item.lowStock) ||
      (selectedItem === 'normal' && !item.lowStock);
    
    return matchesSearch && matchesFilter;
  });

  // Filter purchase history based on selected inventory item
  const filteredPurchaseHistory = selectedInventory
    ? purchaseHistory.filter(record => record.key === selectedInventory)
    : purchaseHistory; // Show all records when no item is selected

  // Actions
  const handleRestock = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setIsRestockModalVisible(true);
  };

  const handleRestockCancel = () => {
    setIsRestockModalVisible(false);
    setSelectedInventoryItem(null);
  };

  const handleRestockSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Here you would typically make an API call to update the inventory
      console.log('Restocking item:', selectedInventoryItem?.key, values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Item restocked successfully!');
      setIsRestockModalVisible(false);
      
      // Refresh inventory data
      // fetchInventoryData();
    } catch (error) {
      console.error('Error restocking item:', error);
      message.error('Failed to restock item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (itemId: string) => {
    console.log("Delete item:", itemId);
    // Confirm delete can be added here (Modal.confirm)
  };

  const handleAddClick = () => {
    setIsAddModalVisible(true);
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  const handleAddSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Here you would typically make an API call to save the new item
      console.log('Adding new item:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Item added successfully!');
      setIsAddModalVisible(false);
      
      // Refresh inventory data
      // fetchInventoryData();
    } catch (error) {
      console.error('Error adding item:', error);
      message.error('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add new item
  const handleAddNewItem = async (values: any) => {
    setAddFormLoading(true);
    try {
      // Here you would typically call your API to add the new item
      console.log('Adding new item:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add the new item to your inventory state
      // This is just a mock implementation - replace with your actual state update logic
      const newItem = {
        key: Date.now().toString(),
        itemName: values.item,
        totalQuantity: values.quantity,
        unit: values.unit,
        lowStock: false,
      };
      
      setInventory(prev => [...prev, newItem]);
      
      // Add to purchase history
      const newPurchase = {
        key: Date.now().toString(),
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        quantity: values.quantity,
        remaining: values.quantity, // Initially remaining is same as quantity
        cost: values.amountPaid,
        supplier: values.supplier,
        unit: values.unit
      };
      
      setPurchaseHistory(prev => [...prev, newPurchase]);
      
      message.success('Item added successfully!');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      message.error('Failed to add item. Please try again.');
    } finally {
      setAddFormLoading(false);
    }
  };

  // Table columns for inventory
  const inventoryColumns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      sorter: (a: InventoryItem, b: InventoryItem) => a.itemName.localeCompare(b.itemName),
    },
    {
      title: 'Total Quantity Remaining',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      sorter: (a: InventoryItem, b: InventoryItem) => a.totalQuantity - b.totalQuantity,
      render: (quantity: number, record: InventoryItem) => (
        <span className={record.lowStock ? 'text-red-500 font-medium' : ''}>
          {quantity} {record.unit}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InventoryItem) => (
        <Space>
          <Button 
            onClick={() => handleRestock(record)}
            className="bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
          >
            Restock
          </Button>
        </Space>
      ),
    },
  ];

  // Table columns for purchase history
  const purchaseHistoryColumns = [
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      sorter: (a: PurchaseRecord, b: PurchaseRecord) => 
        new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (remaining: number, record: PurchaseRecord) => (
        <span className={remaining <= 0 ? 'text-gray-400' : ''}>
          {remaining} {record.unit}
        </span>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `₱${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sorter: (a: PurchaseRecord, b: PurchaseRecord) => a.cost - b.cost,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      sorter: (a: PurchaseRecord, b: PurchaseRecord) => a.supplier.localeCompare(b.supplier),
    },
  ];

  // Add responsive configuration for the table
  const tableProps = {
    scroll: { x: true },
    responsive: true,
    size: 'small' as const,
  };

  return (
    <div className="p-4">
      <div className="relative mb-6">
        <Title level={4} className="text-gray-800 text-lg sm:text-xl">Stock Levels</Title>
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

      <Row gutter={[16, 16]} className="mb-4" align="middle">
        <Col xs={24} sm={16} md={16} lg={12} xl={8}>
          <Input
            size="middle"
            placeholder="Search items..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-full"
          />
        </Col>
        <Col xs={24} sm={8} md={8} lg={6} xl={4}>
          <Select
            size="middle"
            className="w-full"
            value={selectedItem}
            onChange={setSelectedItem}
            options={[
              { value: 'all', label: 'All Items' },
              { value: 'low', label: 'Low Stock' },
              { value: 'normal', label: 'Normal Stock' },
            ]}
            suffixIcon={<FilterOutlined className="text-gray-400" />}
          />
        </Col>
      </Row>

      {/* Main Content Area with Side-by-Side Tables */}
      <Row gutter={[24, 24]} className="mt-6">
        {/* Inventory Table */}
        <Col xs={24} xl={12}>
          <Card 
            title="Inventory Items" 
            className="h-full flex flex-col"
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 overflow-hidden">
              <Table
                {...tableProps}
                columns={inventoryColumns}
                dataSource={filteredInventory}
                rowKey="key"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} items`,
                  className: 'mb-0',
                  responsive: true,
                }}
                className="h-full"
                scroll={{ y: 400 }}
                onRow={(record) => ({
                  onClick: () => setSelectedInventory(record.key === selectedInventory ? null : record.key),
                  className: record.key === selectedInventory ? 'bg-blue-50' : '',
                })}
                rowClassName="cursor-pointer hover:bg-gray-50"
              />
            </div>
          </Card>
        </Col>

        {/* Purchase History Table */}
        <Col xs={24} xl={12}>
          <Card 
            title="Purchase History" 
            className="h-full flex flex-col"
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 overflow-hidden">
              <Table
                {...tableProps}
                columns={purchaseHistoryColumns}
                dataSource={filteredPurchaseHistory}
                rowKey="key"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} records`,
                  className: 'mb-0',
                  responsive: true,
                }}
                className="h-full"
                scroll={{ y: 400 }}
                locale={{
                  emptyText: selectedInventory 
                    ? 'No purchase history for selected item' 
                    : 'Select an item to view purchase history',
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Add Stock Modal */}
      <AddStockForm
        visible={isAddModalVisible}
        onCancel={handleAddCancel}
        onAdd={handleAddSubmit}
        loading={isSubmitting}
      />

      {/* Add Stock Form Modal */}
      <AddStockForm
        visible={showAddForm}
        onCancel={() => setShowAddForm(false)}
        onAdd={handleAddNewItem}
        loading={addFormLoading}
      />

      {/* Restock Form Modal */}
      {selectedInventoryItem && (
        <RestockForm
          visible={isRestockModalVisible}
          onCancel={handleRestockCancel}
          onRestock={handleRestockSubmit}
          loading={isSubmitting}
          selectedItem={selectedInventoryItem}
        />
      )}
    </div>
  );
};

export default StockLevels;
