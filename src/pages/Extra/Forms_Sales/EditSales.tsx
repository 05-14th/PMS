import React, { useState, useEffect } from 'react';
import { Modal, InputNumber, Form, Typography } from 'antd';

const { Text } = Typography;

// Define the shape of the item we expect to edit
interface SaleItem {
    key: string;
    ProductName: string;
    subtotal: number;
}

// Define the props for our modal component
interface EditSalesProps {
    visible: boolean;
    onCancel: () => void;
    onSave: (newSubtotal: number) => void;
    item: SaleItem | null;
}

const EditSales: React.FC<EditSalesProps> = ({
    visible,
    onCancel,
    onSave,
    item,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (item) {
            form.setFieldsValue({ subtotal: item.subtotal });
        }
    }, [item, form]);

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                onSave(values.subtotal);
                form.resetFields();
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            open={visible}
            title='Edit Item Subtotal'
            okText='Save'
            cancelText='Cancel'
            onCancel={onCancel}
            onOk={handleOk}
            centered
        >
            {item && (
                <Form
                    form={form}
                    layout='vertical'
                    name='edit_sale_item_form'
                >
                    <p>
                        Editing subtotal for:{' '}
                        <Text strong>{item.ProductName}</Text>
                    </p>
                    <Form.Item
                        name='subtotal'
                        label='New Subtotal (₱)'
                        rules={[
                            {
                                required: true,
                                message: 'Please input the new subtotal!',
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            formatter={(value) =>
                                `₱ ${value}`.replace(
                                    /\B(?=(\d{3})+(?!\d))/g,
                                    ','
                                )
                            }
                            parser={(value) =>
                                parseFloat(
                                    value?.replace(/₱\s?|(,*)/g, '') || '0'
                                )
                            }
                            autoFocus
                        />
                    </Form.Item>
                </Form>
            )}
        </Modal>
    );
};

export default EditSales;
