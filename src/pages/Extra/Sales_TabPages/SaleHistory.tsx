import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Button,
    DatePicker,
    Card,
    Typography,
    message,
    Space,
    Modal,
    Grid,
} from 'antd';
import {
    SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import DetailsSaleHistory from '../Forms_Sales/DetailsSaleHistory';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { useBreakpoint } = Grid;

interface SaleRecord {
    SaleID: number;
    SaleDate: string;
    CustomerName: string;
    TotalAmount: number;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
});

const SaleHistory: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<SaleRecord[]>([]);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [viewingSaleId, setViewingSaleId] = useState<number | null>(null);

    const screens = useBreakpoint(); // ✅ detect screen size

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/sales');
            setData(response.data || []);
        } catch (error) {
            message.error('Failed to load sales history.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleDateChange = (dates: any) => {
        setDates(dates);
    };

    const handleClearFilters = () => {
        setSearchText('');
        setDates([null, null]);
    };

    const handleDelete = (saleId: number) => {
        setDeletingSaleId(saleId);
        setIsDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!deletingSaleId) return;
        try {
            await api.delete(`/api/sales/${deletingSaleId}`);
            message.success('Sale record archived successfully');
            await fetchData();
        } catch (error) {
            message.error('Failed to archive sale record.');
        } finally {
            setIsDeleteModalVisible(false);
        }
    };

    const handleViewDetails = (record: SaleRecord) => {
        setViewingSaleId(record.SaleID);
        setIsDetailsModalVisible(true);
    };

    const filteredData = data.filter((item) => {
        const matchesSearch = item.CustomerName.toLowerCase().includes(
            searchText.toLowerCase()
        );

        const matchesDateRange =
            !dates[0] ||
            !dates[1] ||
            (dayjs(item.SaleDate).isAfter(dates[0].startOf('day')) &&
                dayjs(item.SaleDate).isBefore(dates[1].endOf('day')));

        return matchesSearch && matchesDateRange;
    });

    const columns: ColumnsType<SaleRecord> = [
        {
            title: 'Receipt Number',
            dataIndex: 'SaleID',
            key: 'SaleID',
            render: (id: number) => `RCPT-${String(id).padStart(5, '0')}`,
            sorter: (a, b) => a.SaleID - b.SaleID,
        },
        {
            title: 'Date and Time',
            dataIndex: 'SaleDate',
            key: 'SaleDate',
            render: (dateTime: string) =>
                dayjs(dateTime).format('MMM D, YYYY hh:mm A'),
            sorter: (a, b) =>
                dayjs(a.SaleDate).unix() - dayjs(b.SaleDate).unix(),
        },
        {
            title: 'Customer Name',
            dataIndex: 'CustomerName',
            key: 'CustomerName',
        },
        {
            title: 'Total',
            dataIndex: 'TotalAmount',
            key: 'TotalAmount',
            render: (total: number) => `₱${total.toFixed(2)}`,
            sorter: (a, b) => a.TotalAmount - b.TotalAmount,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record: SaleRecord) => (
                <Space size={screens.xs ? 4 : 8}>
                    <Button
                        type="link"
                        size={screens.xs ? 'small' : 'middle'}
                        onClick={() => handleViewDetails(record)}
                    >
                        Details
                    </Button>
                    <Button
                        type="link"
                        size={screens.xs ? 'small' : 'middle'}
                        danger
                        onClick={() => handleDelete(record.SaleID)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-2 sm:p-4">
            <Card className="mb-6">
                <div className="flex justify-between items-center mb-6">
                    <Title level={4} className="m-0">
                        Sales History
                    </Title>
                </div>

                {/* Filters - stack on mobile, row on desktop */}
                <div
                    className={`flex ${screens.xs ? 'flex-col gap-2' : 'flex-row gap-4'} mb-6`}
                >
                    <Input
                        placeholder="Search by customer name"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={screens.xs ? 'w-full' : 'w-96'}
                    />
                    <div className={`flex ${screens.xs ? 'flex-col gap-2' : 'flex-row gap-2'}`}>
                        <RangePicker
                            onChange={handleDateChange}
                            value={dates}
                            style={{ width: screens.xs ? '100%' : undefined }}
                        />
                        <Button onClick={handleClearFilters} block={screens.xs}>
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Delete Modal */}
                <Modal
                    title="Confirm Delete Sale"
                    open={isDeleteModalVisible}
                    onOk={confirmDelete}
                    onCancel={() => setIsDeleteModalVisible(false)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                >
                    <p>
                        Are you sure you want to delete this sale record? This
                        action cannot be undone.
                    </p>
                </Modal>

                {/* Details Modal */}
                <DetailsSaleHistory
                    visible={isDetailsModalVisible}
                    onCancel={() => setIsDetailsModalVisible(false)}
                    saleId={viewingSaleId}
                />

                {/* Table - scrollable on mobile */}
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="SaleID"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    size={screens.xs ? 'small' : 'middle'}
                    scroll={screens.xs ? { x: true } : undefined}
                />
            </Card>
        </div>
    );
};

export default SaleHistory;
