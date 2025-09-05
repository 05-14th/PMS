import React, { useState, useEffect } from 'react';
import { Modal, Table, message, Spin } from 'antd';
import axios from 'axios';

// CHANGED: The interface now expects ItemName
interface SaleDetailItem {
    SaleDetailID: number;
    ItemName: string;
    QuantitySold: number;
    TotalWeightKg: number;
    PricePerKg: number;
}

interface DetailsProps {
    visible: boolean;
    onCancel: () => void;
    saleId: number | null;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
});

const DetailsSaleHistory: React.FC<DetailsProps> = ({
    visible,
    onCancel,
    saleId,
}) => {
    const [details, setDetails] = useState<SaleDetailItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && saleId) {
            // Ensure modal is visible and there's an ID
            setLoading(true);
            setDetails([]); // Clear previous details
            api.get(`/api/sales/${saleId}`)
                .then((response) => {
                    setDetails(response.data || []);
                })
                .catch(() => message.error('Failed to load sale details.'))
                .finally(() => setLoading(false));
        }
    }, [visible, saleId]); // Rerun effect when visibility or saleId changes

    // CHANGED: The columns now display ItemName
    const columns = [
        { title: 'Item Name', dataIndex: 'ItemName', key: 'ItemName' },
        {
            title: 'Quantity Sold',
            dataIndex: 'QuantitySold',
            key: 'QuantitySold',
        },
        {
            title: 'Total Weight (kg)',
            dataIndex: 'TotalWeightKg',
            key: 'TotalWeightKg',
        },
        {
            title: 'Price Per Kg',
            dataIndex: 'PricePerKg',
            key: 'PricePerKg',
            render: (price: number) => `₱${price.toFixed(2)}`,
        },
    ];

    return (
        <Modal
            title={`Details for Sale RCPT-${String(saleId).padStart(5, '0')}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={details}
                    rowKey='SaleDetailID'
                    pagination={false}
                />
            </Spin>
        </Modal>
    );
};

export default DetailsSaleHistory;
