import React, { useEffect } from "react";
import { Modal, Form, DatePicker, Input, Button, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";

interface HealthCheckFormProps {
  visible: boolean;
  batchID: number;
  onCancel: () => void;
  onSubmit: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const HealthCheckForm: React.FC<HealthCheckFormProps> = ({
  visible,
  batchID,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ CheckDate: dayjs() });
    } else {
      form.resetFields();
    }
  }, [visible, form]);

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      const payload = {
        BatchID: batchID,
        CheckDate: values.CheckDate.format("YYYY-MM-DD"),
        Observations: values.Observations || "",
        CheckedBy: values.CheckedBy || "Admin", // Placeholder for user management
      };
      try {
        await api.post("/api/health-checks", payload);
        message.success("Health check recorded successfully!");
        onSubmit();
      } catch (error) {
        message.error("Failed to record health check.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal
      title="Record Health Check"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="CheckDate"
          label="Date of Check"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Observations" label="Observations / Notes">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="CheckedBy" label="Checked By">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HealthCheckForm;
