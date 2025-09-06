import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Button,
    Card,
    Typography,
    Row,
    Col,
    Select,
    Space,
    message,
    Tooltip,
    Modal,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AddStockForm from '../Forms_StockLevels/AddStock';
import RestockForm from '../Forms_StockLevels/RestockForm';
import EditPurchaseForm from '../Forms_StockLevels/EditPurchaseForm';

const { Title } = Typography;

interface StockLevelSummary {
    ItemID: number;
    ItemName: string;
    TotalQuantityRemaining: number;
    Unit: string;
    IsActive: boolean;
    Category: string;
}

interface PurchaseHistoryDetail {
    PurchaseID: number;
    PurchaseDate: string;
    QuantityPurchased: number;
    QuantityRemaining: number;
    UnitCost: number;
    SupplierName: string;
}

interface Supplier {
    SupplierID: number;
    SupplierName: string;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
});

const StockLevels: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] =
        useState<StockLevelSummary | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [units, setUnits] = useState<{ value: string; label: string }[]>([]);
    const [inventory, setInventory] = useState<StockLevelSummary[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryDetail[]>([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isEditPurchaseModalVisible, setIsEditPurchaseModalVisible] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<PurchaseHistoryDetail | null>(null);
    const [isDeletePurchaseModalVisible, setIsDeletePurchaseModalVisible] = useState(false);
    const [deletingPurchaseId, setDeletingPurchaseId] = useState<number | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const fetchStockLevels = async () => {
        setIsLoadingInventory(true);
        try {
            const response = await api.get('/api/stock-levels');
            setInventory(response.data || []);
        } catch (error) {
            console.error('Error fetching stock levels:', error);
            message.error('Failed to load inventory items.');
        } finally {
            setIsLoadingInventory(false);
        }
    };

    const fetchPurchaseHistory = async (itemId: number) => {
        if (selectedInventoryId === itemId) {
            setSelectedInventoryId(null);
            setPurchaseHistory([]);
            return;
        }
        setSelectedInventoryId(itemId);
        setIsLoadingHistory(true);
        try {
            const response = await api.get(`/api/purchase-history/${itemId}`);
            setPurchaseHistory(response.data || []);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            message.error('Failed to load purchase history.');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchStockLevels();

        const fetchDropdownData = async () => {
            try {
                const [suppliersRes, categoriesRes, unitsRes] = await Promise.all([
                    api.get('/api/suppliers'),
                    api.get('/api/categories'),
                    api.get('/api/units'),
                ]);

                setSuppliers(suppliersRes.data || []);
                setCategories((categoriesRes.data || []).map((cat: string) => ({ value: cat, label: cat })));
                setUnits((unitsRes.data || []).map((unit: string) => ({ value: unit, label: unit })));
            } catch (error) {
                console.error('Failed to load data for forms', error);
                message.error('Failed to load required data for the forms.');
            }
        };

        fetchDropdownData();
    }, []);

    const filteredInventory = inventory.filter((item) => {
        const matchesSearch = item.ItemName.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.Category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleRestock = (item: StockLevelSummary) => {
        setSelectedInventoryItem(item);
        setIsRestockModalVisible(true);
    };

    const handleAddSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            const { isNewSupplier, ...itemData } = values;
            const payload = {
                ...itemData,
                PurchaseDate: values.PurchaseDate.format('YYYY-MM-DD'),
                AmountPaid: values.AmountPaid,
            };

            if (isNewSupplier) {
                payload.NewSupplierName = values.NewSupplierName || null;
                payload.ContactPerson = values.ContactPerson || null;
                payload.PhoneNumber = values.PhoneNumber || null;
                payload.Email = values.Email || null;
                payload.Address = values.Address || null;
                payload.Notes = values.Notes || null;
            } else {
                payload.ExistingSupplierID = values.ExistingSupplierID;
            }

            await api.post('/api/stock-items', payload);
            message.success('New item and its first stock have been added!');
            setIsAddModalVisible(false);
            await fetchStockLevels();
        } catch (error) {
            console.error('Error adding new stock item:', error);
            message.error('Failed to add new item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRestockSubmit = async (values: any) => {
        if (!selectedInventoryItem) {
            message.error('No item selected for restocking.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                ItemID: selectedInventoryItem.ItemID,
                SupplierID: values.SupplierID,
                PurchaseDate: values.PurchaseDate.format('YYYY-MM-DD'),
                QuantityPurchased: values.QuantityPurchased,
                UnitCost: values.TotalCost,
            };

            await api.post('/api/purchases', payload);

            message.success(`${selectedInventoryItem.ItemName} restocked successfully!`);
            setIsRestockModalVisible(false);

            await fetchStockLevels();
            if (selectedInventoryId) {
                await fetchPurchaseHistory(selectedInventoryId);
            }
        } catch (error) {
            console.error('Error restocking item:', error);
            message.error('Failed to restock item. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPurchase = (record: PurchaseHistoryDetail) => {
        setEditingPurchase(record);
        setIsEditPurchaseModalVisible(true);
    };

    const handleEditPurchaseSubmit = async (values: any) => {
        if (!editingPurchase || !selectedInventoryId) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ItemID: selectedInventoryId,
                SupplierID: values.SupplierID,
                PurchaseDate: values.PurchaseDate.format('YYYY-MM-DD'),
                QuantityPurchased: values.QuantityPurchased,
                UnitCost: values.TotalCost,
            };

            await api.put(`/api/purchases/${editingPurchase.PurchaseID}`, payload);
            message.success('Purchase record updated successfully');
            setIsEditPurchaseModalVisible(false);

            await fetchStockLevels();
            await fetchPurchaseHistory(selectedInventoryId);
        } catch (error: any) {
            console.error('Error updating purchase:', error);
            message.error(error.response?.data || 'Failed to update purchase.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePurchase = (purchaseId: number) => {
        setDeletingPurchaseId(purchaseId);
        setIsDeletePurchaseModalVisible(true);
    };

    const confirmDeletePurchase = async () => {
        if (!deletingPurchaseId) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/api/purchases/${deletingPurchaseId}`);
            message.success('Purchase record deleted successfully');
            await fetchStockLevels();
            await fetchPurchaseHistory(selectedInventoryId!);
        } catch (error: any) {
            console.error('Error deleting purchase:', error);
            message.error(error.response?.data || 'Failed to delete purchase.');
        } finally {
            setIsSubmitting(false);
            setIsDeletePurchaseModalVisible(false);
        }
    };

    const inventoryColumns = [
        {
            title: 'Item Name',
            dataIndex: 'ItemName',
            key: 'ItemName',
        },
        {
            title: 'Total Quantity Remaining',
            dataIndex: 'TotalQuantityRemaining',
            key: 'TotalQuantityRemaining',
            render: (quantity: number, record: StockLevelSummary) => (
                <span>{`${quantity.toFixed(2)} ${record.Unit}`}</span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: StockLevelSummary) => (
                <Button onClick={() => handleRestock(record)}>Restock</Button>
            ),
        },
    ];

    const purchaseHistoryColumns = [
        {
            title: 'Purchase Date',
            dataIndex: 'PurchaseDate',
            key: 'PurchaseDate',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Qty Purchased',
            dataIndex: 'QuantityPurchased',
            key: 'QuantityPurchased',
            render: (qty: number) => `${qty.toFixed(2)}`,
        },
        {
            title: 'Remaining',
            dataIndex: 'QuantityRemaining',
            key: 'QuantityRemaining',
            render: (remaining: number) => `${remaining.toFixed(2)}`,
        },
        {
            title: 'Cost',
            dataIndex: 'UnitCost',
            key: 'Cost',
            render: (cost: number) =>
                `₱${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        {
            title: 'Supplier',
            dataIndex: 'SupplierName',
            key: 'SupplierName',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: PurchaseHistoryDetail) => {
                const isUntouched = record.QuantityRemaining === record.QuantityPurchased;
                return (
                    <Space>
                        <Tooltip title={!isUntouched ? 'Cannot edit a used purchase' : 'Edit Purchase'}>
                            <Button
                                icon={<EditOutlined />}
                                disabled={!isUntouched}
                                onClick={() => handleEditPurchase(record)}
                            />
                        </Tooltip>
                        <Tooltip title={!isUntouched ? 'Cannot delete a used purchase' : 'Delete Purchase'}>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                disabled={!isUntouched}
                                onClick={() => handleDeletePurchase(record.PurchaseID)}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className='p-4'>
            <div className='relative mb-6'>
                <Title level={4} className='text-gray-800 text-lg sm:text-xl'>
                    Stock Levels
                </Title>
                <Button
                    type='default'
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalVisible(true)}
                    className='absolute top-0 right-0'
                >
                    Add New Item
                </Button>
            </div>

            <Row gutter={[16, 16]} className='mb-4' align='middle'>
                <Col xs={24} sm={16} md={16} lg={12} xl={8}>
                    <Input
                        placeholder='Search items...'
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={8} md={8} lg={6} xl={4}>
                    <Select
                        className='w-full'
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                    >
                        <Select.Option value='all'>All Categories</Select.Option>
                        {categories.map((cat) => (
                            <Select.Option key={cat.value} value={cat.value}>
                                {cat.label}
                            </Select.Option>
                        ))}
                    </Select>
                </Col>
            </Row>

            <Row gutter={[24, 24]} className='mt-6'>
                <Col xs={24} xl={12}>
                    <Card title='Inventory Items'>
                        <Table
                            columns={inventoryColumns}
                            dataSource={filteredInventory}
                            rowKey='ItemID'
                            loading={isLoadingInventory}
                            pagination={{ pageSize: 10 }}
                            onRow={(record) => ({
                                onClick: () => fetchPurchaseHistory(record.ItemID),
                                className: `cursor-pointer hover:bg-gray-50 ${
                                    record.ItemID === selectedInventoryId ? 'bg-blue-50' : ''
                                }`,
                            })}
                        />
                    </Card>
                </Col>

                <Col xs={24} xl={12}>
                    <Card title='Purchase History'>
                        <Table
                            columns={purchaseHistoryColumns}
                            dataSource={purchaseHistory}
                            rowKey={(record) =>
                                `${record.PurchaseDate}-${record.SupplierName}`
                            }
                            loading={isLoadingHistory}
                            pagination={{ pageSize: 10 }}
                            locale={{
                                emptyText: selectedInventoryId
                                    ? 'No purchase history for this item.'
                                    : 'Select an item to view its purchase history.',
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            <AddStockForm
                visible={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                onAdd={handleAddSubmit}
                loading={isSubmitting}
                suppliers={suppliers}
                categories={categories}
                units={units}
            />

            {selectedInventoryItem && (
                <RestockForm
                    visible={isRestockModalVisible}
                    onCancel={() => setIsRestockModalVisible(false)}
                    onRestock={handleRestockSubmit}
                    loading={isSubmitting}
                    selectedItem={selectedInventoryItem}
                    suppliers={suppliers}
                />
            )}

            {editingPurchase && (
                <EditPurchaseForm
                    visible={isEditPurchaseModalVisible}
                    onCancel={() => setIsEditPurchaseModalVisible(false)}
                    onUpdate={handleEditPurchaseSubmit}
                    loading={isSubmitting}
                    initialValues={editingPurchase}
                    suppliers={suppliers}
                />
            )}

            <Modal
                title='Confirm Delete Purchase'
                open={isDeletePurchaseModalVisible}
                onOk={confirmDeletePurchase}
                onCancel={() => setIsDeletePurchaseModalVisible(false)}
                confirmLoading={isSubmitting}
                okText='Delete'
                okButtonProps={{ danger: true }}
            >
                <p>Are you sure you want to delete this purchase record? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default StockLevels;
