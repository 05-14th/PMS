import React, { useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

interface HarvestedProduct {
  harvestProductID: number;
  harvestDate: string;
  productType: string;
  quantityHarvested: number;
  quantityRemaining: number;
  weightRemainingKg: number;
  weightHarvestedKg: number;
}

interface EditHarvestFormProps {
  visible: boolean;
  initialValues: HarvestedProduct | null;
  productTypes: string[]; // Pass the dynamic list from the parent
  onCancel: () => void;
  onSubmit: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const EditHarvestForm: React.FC<EditHarvestFormProps> = ({
  visible,
  initialValues,
  productTypes,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        HarvestDate: dayjs(initialValues.HarvestDate),
      });
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!initialValues) return;
      setLoading(true);

      const payload = {
        HarvestDate: values.HarvestDate.format("YYYY-MM-DD"),
        ProductType: values.ProductType,
        QuantityHarvested: values.QuantityHarvested,
        // The backend requires TotalWeightKg, but we don't store it.
        // We'll add this field in a future step if needed. For now, send 0.
        TotalWeightKg: values.TotalWeightKg || 0,
      };

      try {
        await api.put(
          `/api/harvest-products/${initialValues.HarvestProductID}`,
          payload
        );
        message.success("Harvest record updated successfully!");
        onSubmit();
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.error || "Failed to update harvest.";
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal
      title="Edit Harvest Record"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="HarvestDate"
          label="Harvest Date"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="ProductType"
          label="Product Type"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select product type">
            {productTypes.map((pt) => (
              <Option key={pt} value={pt}>
                {pt}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="QuantityHarvested"
          label="Quantity Harvested"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item
          name="TotalWeightKg"
          label="Total Weight (kg)"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} min={0.01} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditHarvestForm;
