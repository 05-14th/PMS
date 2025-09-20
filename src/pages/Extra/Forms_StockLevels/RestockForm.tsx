import React, { useEffect } from 'react';
import {
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Modal,
    Button,
} from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

// ADDED: A type for the supplier prop
interface Supplier {
    SupplierID: number;
    SupplierName: string;
}

interface RestockFormProps {
    visible: boolean;
    onCancel: () => void;
    onRestock: (values: any) => void;
    loading: boolean;
    selectedItem: any;
    suppliers: Supplier[]; // ADDED: Prop to receive the list of suppliers
}

const RestockForm: React.FC<RestockFormProps> = ({
    visible,
    onCancel,
    onRestock,
    loading,
    selectedItem,
    suppliers, // ADDED
}) => {
    const [form] = Form.useForm();

    // Reset fields when modal is closed
    useEffect(() => {
        if (!visible) {
            form.resetFields();
        }
    }, [visible, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onRestock(values);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={`Restock: ${selectedItem?.ItemName}`}
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button
                    key='cancel'
                    onClick={onCancel}
                >
                    Cancel
                </Button>,
                <Button
                    key='submit'
                    type='primary'
                    onClick={handleSubmit}
                    loading={loading}
                >
                    Save
                </Button>,
            ]}
            width={600}
        >
            <Form
                form={form}
                layout='vertical'
                initialValues={{
                    purchaseDate: dayjs(), // Default to today
                }}
            >
                <Form.Item
                    name='ReceiptInfo'
                    label='Receipt Info / Ref # (Optional)'
                >
                    <Input placeholder='e.g., OR# 12345, or a note' />
                </Form.Item>

                <Form.Item
                    name='PurchaseDate'
                    label='Purchase Date'
                    rules={[
                        {
                            required: true,
                            message: 'Please select purchase date',
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format='YYYY-MM-DD'
                    />
                </Form.Item>

                <Form.Item
                    name='QuantityPurchased'
                    label='Quantity Purchased'
                    rules={[
                        { required: true, message: 'Please enter quantity' },
                    ]}
                >
                    <InputNumber
                        min={0.01}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    name='TotalCost'
                    label='Total Cost'
                    rules={[
                        {
                            required: true,
                            message: 'Please enter the total cost',
                        },
                    ]}
                >
                    <InputNumber
                        min={0}
                        step={0.01}
                        style={{ width: '100%' }}
                        prefix='₱'
                    />
                </Form.Item>

                <Form.Item
                    name='SupplierID'
                    label='Supplier'
                    rules={[
                        { required: true, message: 'Please select a supplier' },
                    ]}
                >
                    {/* CHANGED: This dropdown is now populated with real data */}
                    <Select
                        placeholder='Select supplier'
                        showSearch
                        optionFilterProp='label'
                    >
                        {suppliers.map((s) => (
                            <Option
                                key={s.SupplierID}
                                value={s.SupplierID}
                                label={s.SupplierName}
                            >
                                {s.SupplierName}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RestockForm;
