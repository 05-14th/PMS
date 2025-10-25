import React, { useEffect } from "react";
import { Modal, Form, DatePicker, Input, InputNumber, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";

// This interface is needed to type the initialValues prop
interface BatchCost {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
}

interface DirectCostFormProps {
  visible: boolean;
  batchID: number;
  initialValues?: BatchCost | null; // <-- Prop to hold existing data for editing
  onCancel: () => void;
  onSubmit: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const DirectCostForm: React.FC<DirectCostFormProps> = ({
  visible,
  batchID,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // If editing, populate the form with existing data
        form.setFieldsValue({
          ...initialValues,
          Date: dayjs(initialValues.date),
          CostType: initialValues.type, // Map 'type' from data to 'CostType' in form
        });
      } else {
        // If adding, set date to today and clear other fields
        form.setFieldsValue({ Date: dayjs() });
      }
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      const payload = {
        BatchID: batchID,
        Date: values.Date.format("YYYY-MM-DD"),
        CostType: values.CostType,
        Description: values.Description || "", // Ensure empty string if null
        Amount: values.Amount,
      };

      try {
        if (initialValues) {
          // If we are editing, call the PUT endpoint
          await api.put(`/api/costs/${initialValues.id}`, payload);
          message.success("Direct cost updated successfully!");
        } else {
          // If we are adding, call the POST endpoint
          await api.post(`/api/batches/${batchID}/costs`, payload);
          message.success("Direct cost recorded successfully!");
        }
        onSubmit();
      } catch (error) {
        message.error("Failed to save direct cost.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal
      // Dynamic title based on add/edit mode
      title={initialValues ? "Edit Direct Cost" : "Record Direct Cost"}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="Date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="CostType"
          label="Cost Type (e.g., Labor, Utilities)"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="Description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="Amount"
          label="Amount (₱)"
          rules={[{ required: true }]}
        >
          <InputNumber min={0.01} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DirectCostForm;
