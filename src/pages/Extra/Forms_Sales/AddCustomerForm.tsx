import React from 'react';
import { Form, Input, Modal, Button } from 'antd';

interface AddCustomerFormProps {
    visible: boolean;
    onCreate: (values: any) => void;
    onCancel: () => void;
}

const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
    visible,
    onCreate,
    onCancel,
}) => {
    const [form] = Form.useForm();

    return (
        <Modal
            title='Add New Customer'
            open={visible}
            onCancel={onCancel}
            onOk={() => {
                form.validateFields()
                    .then((values) => {
                        form.resetFields();
                        onCreate(values);
                    })
                    .catch((info) => {
                        console.log('Validate Failed:', info);
                    });
            }}
            okText='Add Customer'
        >
            <Form
                form={form}
                layout='vertical'
                name='add_customer_form'
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

export default AddCustomerForm;
