import React, { useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Input,
  Button,
  message,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

interface MortalityFormProps {
  visible: boolean;
  batchID: number;
  onCancel: () => void;
  onSubmit: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const MortalityForm: React.FC<MortalityFormProps> = ({
  visible,
  batchID,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ Date: dayjs() });
    } else {
      // This line resets the form when the modal is closed
      form.resetFields();
    }
  }, [visible, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        const payload = {
          BatchID: batchID,
          Date: values.Date.format("YYYY-MM-DD"),
          BirdsLoss: values.BirdsLoss,
          Notes: values.Notes || "",
        };
        try {
          await api.post("/api/mortality", payload);
          message.success("Mortality recorded successfully!");
          onSubmit();
        } catch (error) {
          message.error("Failed to record mortality.");
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => console.log("Validate Failed:", info));
  };

  return (
    <Modal
      title="Record Mortality"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="BirdsLoss"
          label="Number of Birds"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Notes" label="Notes / Cause">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MortalityForm;
