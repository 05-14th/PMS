import React, { useEffect } from 'react';
import { Form, Input, Select, Modal, Button } from 'antd';

const { Option } = Select;

interface EditFormProps {
    visible: boolean;
    onUpdate: (values: any) => void;
    onCancel: () => void;
    categories: Array<{ value: string; label: string }>;
    units: Array<{ value: string; label: string }>;
    initialValues?: {
        ItemID: string;
        ItemName: string;
        Category: string;
        Unit: string;
        key: string;
    };
}

const EditForm: React.FC<EditFormProps> = ({
    visible,
    onUpdate,
    onCancel,
    categories,
    initialValues,
    units,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    return (
        <Modal
            title='Edit Item'
            open={visible}
            onCancel={onCancel}
            closable={false}
            footer={[
                <Button
                    key='cancel'
                    onClick={onCancel}
                    style={{
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        transition: 'all 0.3s',
                    }}
                    className='hover:bg-gray-100'
                >
                    Cancel
                </Button>,

                <Button
                    key='submit'
                    type='default'
                    style={{
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        transition: 'all 0.3s',
                    }}
                    className='hover:bg-green-500 hover:text-white hover:border-green-500'
                    onClick={() => {
                        form.validateFields()
                            .then((values) => {
                                form.resetFields();
                                onUpdate({ ...initialValues, ...values });
                            })
                            .catch((info) => {
                                console.log('Validate Failed:', info);
                            });
                    }}
                >
                    Save Changes
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout='vertical'
                name='edit_item_form'
                initialValues={initialValues}
            >
                <Form.Item
                    name='ItemName'
                    label='Item Name'
                    rules={[
                        {
                            required: true,
                            message: 'Please input the item name!',
                        },
                    ]}
                >
                    <Input placeholder='Enter item name' />
                </Form.Item>

                <Form.Item
                    name='Category'
                    label='Category'
                    rules={[
                        {
                            required: true,
                            message: 'Please select a category!',
                        },
                    ]}
                >
                    <Select placeholder='Select a category'>
                        {categories
                            .filter((cat) => cat.value !== 'all')
                            .map((category) => (
                                <Option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </Option>
                            ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name='Unit'
                    label='Unit'
                    rules={[
                        { required: true, message: 'Please select the unit!' },
                    ]}
                >
                    <Select placeholder='Select a unit'>
                        {units.map((unit) => (
                            <Option
                                key={unit.value}
                                value={unit.value}
                            >
                                {unit.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditForm;
