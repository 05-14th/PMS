import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Button,
  message,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

interface Item {
  ItemID: number;
  ItemName: string;
  TotalQuantityRemaining: number;
  Unit: string;
}

interface ConsumptionFormProps {
  visible: boolean;
  batchID: number;
  eventType: string;
  onCancel: () => void;
  onSubmit: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const ConsumptionForm: React.FC<ConsumptionFormProps> = ({
  visible,
  batchID,
  eventType,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      const fetchItems = async () => {
        const category = eventType;

        try {
          const response = await api.get(`/api/items?category=${category}`);
          setItems(response.data || []);
        } catch (error) {
          message.error(`Failed to load ${category.toLowerCase()} items.`);
        }
      };
      fetchItems();
      form.setFieldsValue({ Date: dayjs() });
    } else {
      form.resetFields();
    }
  }, [visible, eventType, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        const payload = {
          BatchID: batchID,
          ItemID: values.ItemID,
          QuantityUsed: values.QuantityUsed,
          Date: values.Date.format("YYYY-MM-DD"),
        };
        try {
          await api.post("/api/usage", payload);
          message.success("Consumption recorded successfully!");
          onSubmit();
          form.resetFields();
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.error || "Failed to record consumption.";
          message.error(errorMsg);
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      title={`Record ${eventType}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Record"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="ItemID"
          label="Item"
          rules={[{ required: true, message: "Please select an item" }]}
        >
          <Select
            placeholder="Select an item"
            showSearch
            optionFilterProp="children"
          >
            {items.map((item) => (
              <Option key={item.ItemID} value={item.ItemID}>
                {`${item.ItemName} (${item.TotalQuantityRemaining.toFixed(
                  2
                )}${item.Unit})`}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="QuantityUsed"
          label="Quantity Used"
          rules={[{ required: true, message: "Please enter quantity used" }]}
        >
          <InputNumber min={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Date" label="Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConsumptionForm;
