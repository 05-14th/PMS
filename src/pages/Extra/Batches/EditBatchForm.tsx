import React, { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface Batch {
  batchID: number;
  batchName: string;
  startDate: string;
  expectedHarvestDate: string;
  totalChicken: number;
  status: string;
  notes?: { String: string; Valid: boolean };
}

interface EditBatchFormProps {
  visible: boolean;
  onUpdate: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
  initialValues: Batch | null;
}

const EditBatchForm: React.FC<EditBatchFormProps> = ({
  visible,
  onUpdate,
  onCancel,
  loading,
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        expectedHarvestDate: dayjs(initialValues.expectedHarvestDate),
        notes: initialValues.notes?.String || "",
      });
    }
  }, [initialValues, form]);

  return (
    <Modal
      open={visible}
      title="Edit Batch"
      okText="Save Changes"
      cancelText="Cancel"
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onUpdate(values);
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
    >
      <Form form={form} layout="vertical" name="edit_batch_form">
        <Form.Item
          name="batchName"
          label="Batch Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="expectedHarvestDate"
          label="Expected Harvest Date"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Sold">Sold</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="notes" label="Notes (Optional)">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Text type="secondary">
          Note: Start Date and Initial Chicken Count cannot be edited.
        </Text>
      </Form>
    </Modal>
  );
};

export default EditBatchForm;
