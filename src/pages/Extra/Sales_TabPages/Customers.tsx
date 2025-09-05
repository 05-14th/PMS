import React, { useState, useEffect } from 'react';
import {
    Card,
    Input,
    Table,
    Space,
    Button,
    Typography,
    Row,
    Col,
    message,
    Modal,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AddCustomerForm from '../Forms_Sales/AddCustomerForm';
import EditCustomerForm from '../Forms_Sales/EditCustomerForm';

const { Title } = Typography;

interface Customer {
    CustomerID: number;
    Name: string;
    BusinessName: string;
    ContactNumber: string;
    Email: string;
    Address: string;
    DateAdded: string;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
});

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null
    );
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    // CHANGED: The deleting key is now a number to match the ID
    const [deletingKey, setDeletingKey] = useState<number | null>(null);

    // ADDED: Function to fetch live data from the server
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/customers');
            setCustomers(response.data || []);
        } catch (error) {
            message.error('Failed to load customers.');
        } finally {
            setIsLoading(false);
        }
    };

    // ADDED: useEffect hook to call fetchData() when the component loads
    useEffect(() => {
        fetchData();
    }, []);

    // CHANGED: Renamed and updated to call the API
    const handleAddSubmit = async (
        values: Omit<Customer, 'CustomerID' | 'DateAdded'>
    ) => {
        try {
            await api.post('/api/customers', values);
            setIsAddModalVisible(false);
            message.success('Customer added successfully');
            await fetchData(); // Refresh data from server
        } catch (error) {
            message.error('Failed to add customer.');
        }
    };

    const handleEdit = (record: Customer) => {
        setEditingCustomer(record);
        setIsEditModalVisible(true);
    };

    // CHANGED: Renamed and updated to call the API
    const handleEditSubmit = async (values: Partial<Customer>) => {
        if (!editingCustomer) return;
        try {
            const payload = { ...editingCustomer, ...values };
            await api.put(
                `/api/customers/${editingCustomer.CustomerID}`,
                payload
            );
            setIsEditModalVisible(false);
            message.success('Customer updated successfully');
            await fetchData(); // Refresh data from server
        } catch (error) {
            message.error('Failed to update customer.');
        }
    };

    // CHANGED: The key is now a number (the CustomerID)
    const handleDelete = (key: number) => {
        setDeletingKey(key);
        setIsDeleteModalVisible(true);
    };

    // CHANGED: Updated to call the API
    const confirmDelete = async () => {
        if (!deletingKey) return;
        try {
            setIsLoading(true);
            await api.delete(`/api/customers/${deletingKey}`);
            message.success('Customer archived successfully');
            await fetchData(); // Refresh data from server
        } catch (error) {
            console.error('Error deleting customer:', error);
            message.error('Failed to archive customer');
        } finally {
            setIsLoading(false);
            setIsDeleteModalVisible(false);
            setDeletingKey(null);
        }
    };

    const filteredCustomers = customers.filter(
        (customer) =>
            // CHANGED: Uses PascalCase field names
            customer.Name.toLowerCase().includes(searchText.toLowerCase()) ||
            customer.BusinessName.toLowerCase().includes(
                searchText.toLowerCase()
            ) ||
            customer.ContactNumber.includes(searchText) ||
            customer.Email.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        // CHANGED: dataIndex for each column now matches the new interface
        { title: 'CUSTOMER NAME', dataIndex: 'Name', key: 'Name' },
        {
            title: 'BUSINESS NAME',
            dataIndex: 'BusinessName',
            key: 'BusinessName',
        },
        {
            title: 'CONTACT NUMBER',
            dataIndex: 'ContactNumber',
            key: 'ContactNumber',
        },
        { title: 'EMAIL', dataIndex: 'Email', key: 'Email' },
        { title: 'ADDRESS', dataIndex: 'Address', key: 'Address' },
        {
            title: 'DATE ADDED',
            dataIndex: 'DateAdded',
            key: 'DateAdded',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'ACTION',
            key: 'action',
            render: (_: any, record: Customer) => (
                <Space size='middle'>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record.CustomerID)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className='p-4'>
            <Card className='shadow-sm'>
                <Row
                    justify='space-between'
                    align='middle'
                    className='mb-6'
                >
                    <Col>
                        <Title
                            level={4}
                            className='mb-0'
                        >
                            Customers
                        </Title>
                    </Col>
                    <Col>
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() => setIsAddModalVisible(true)}
                        >
                            Add New Customer
                        </Button>
                    </Col>
                </Row>

                <div className='mb-4'>
                    <Input
                        placeholder='Search customer name, business, contact, or email...'
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredCustomers}
                    loading={isLoading}
                    rowKey='CustomerID' // CHANGED: The rowKey now uses the correct ID
                />
            </Card>

            <AddCustomerForm
                visible={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                onCreate={handleAddSubmit}
            />

            {editingCustomer && (
                <EditCustomerForm
                    visible={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    onUpdate={handleEditSubmit}
                    initialValues={editingCustomer}
                />
            )}

            <Modal
                title='Confirm Archive'
                open={isDeleteModalVisible}
                onOk={confirmDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmLoading={isLoading}
            >
                <p>
                    Are you sure you want to archive this customer? This action
                    cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default Customers;
