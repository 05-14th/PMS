import React from 'react';
import { Form, Input, Modal, Button } from 'antd';

interface EditCustomerFormProps {
    visible: boolean;
    onUpdate: (values: any) => void;
    onCancel: () => void;
    initialValues?: {
        CustomerID: number;
        Name: string;
        BusinessName: string;
        ContactNumber: string;
        Email: string;
        Address: string;
    };
}

const EditCustomerForm: React.FC<EditCustomerFormProps> = ({
    visible,
    onUpdate,
    onCancel,
    initialValues,
}) => {
    const [form] = Form.useForm();

    return (
        <Modal
            title='Edit Customer'
            open={visible}
            onCancel={onCancel}
            onOk={() => {
                form.validateFields()
                    .then((values) => {
                        onUpdate(values);
                    })
                    .catch((info) => {
                        console.log('Validate Failed:', info);
                    });
            }}
            okText='Save Changes'
        >
            <Form
                form={form}
                layout='vertical'
                name='edit_customer_form'
                initialValues={initialValues}
                preserve={false}
            >
                <Form.Item
                    name='Name'
                    label='Customer Name'
                    rules={[
                        {
                            required: true,
                            message: 'Please input the customer name!',
                        },
                    ]}
                >
                    <Input placeholder='Enter customer name' />
                </Form.Item>

                <Form.Item
                    name='BusinessName'
                    label='Business Name'
                >
                    <Input placeholder='Enter business name' />
                </Form.Item>

                <Form.Item
                    name='ContactNumber'
                    label='Contact Number'
                >
                    <Input placeholder='e.g., 09123456789' />
                </Form.Item>

                <Form.Item
                    name='Email'
                    label='Email'
                    rules={[
                        {
                            type: 'email',
                            message: 'Please enter a valid email address',
                        },
                    ]}
                >
                    <Input placeholder='Enter email address' />
                </Form.Item>

                <Form.Item
                    name='Address'
                    label='Address'
                >
                    <Input.TextArea
                        rows={3}
                        placeholder='Enter complete address'
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditCustomerForm;
