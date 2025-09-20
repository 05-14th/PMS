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

interface Supplier {
    SupplierID: number;
    SupplierName: string;
}

interface EditPurchaseFormProps {
    visible: boolean;
    onCancel: () => void;
    onUpdate: (values: any) => void;
    loading: boolean;
    initialValues: any;
    suppliers: Supplier[];
}

const EditPurchaseForm: React.FC<EditPurchaseFormProps> = ({
    visible,
    onCancel,
    onUpdate,
    loading,
    initialValues,
    suppliers,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && initialValues) {
            form.setFieldsValue({
                ...initialValues,
                PurchaseDate: dayjs(initialValues.PurchaseDate),
                TotalCost: initialValues.UnitCost,
                // MODIFICATION: pre-fill the receipt info
                ReceiptInfo: initialValues.ReceiptInfo,
            });
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onUpdate(values);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title='Edit Purchase Record'
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
                    Save Changes
                </Button>,
            ]}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout='vertical'
            >
                <Form.Item
                    name='PurchaseDate'
                    label='Purchase Date'
                    rules={[{ required: true }]}
                >
                    <DatePicker
                        format='YYYY-MM-DD'
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item
                    name='QuantityPurchased'
                    label='Quantity Purchased'
                    rules={[{ required: true }]}
                >
                    <InputNumber
                        min={0.01}
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item
                    name='TotalCost'
                    label='Total Cost'
                    rules={[{ required: true }]}
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
                    rules={[{ required: true }]}
                >
                    <Select placeholder='Select supplier'>
                        {suppliers.map((s) => (
                            <Option
                                key={s.SupplierID}
                                value={s.SupplierID}
                            >
                                {s.SupplierName}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* MODIFICATION: Added optional Receipt Info field */}
                <Form.Item
                    name='ReceiptInfo'
                    label='Receipt Info / Ref # (Optional)'
                >
                    <Input placeholder='e.g., OR# 12345, or a note' />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditPurchaseForm;
