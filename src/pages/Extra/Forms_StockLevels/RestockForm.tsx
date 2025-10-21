import React, { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Modal,
  Button,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;

interface Supplier {
  SupplierID: number;
  SupplierName: string;
}

interface RestockFormProps {
  visible: boolean;
  onCancel: () => void;
  onRestock: (values: any) => void;
  loading: boolean;
  selectedItem: any;
  suppliers: Supplier[];
}

const RestockForm: React.FC<RestockFormProps> = ({
  visible,
  onCancel,
  onRestock,
  loading,
  selectedItem,
  suppliers,
}) => {
  const [form] = Form.useForm();

  // Reset fields when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  // FIX: Add calculation logic
  const handleValuesChange = (changedValues: any, allValues: any) => {
    const { QuantityPurchased, UnitCost } = allValues;
    if (typeof QuantityPurchased === "number" && typeof UnitCost === "number") {
      const totalCost = QuantityPurchased * UnitCost;
      form.setFieldsValue({ TotalCost: totalCost });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onRestock(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={`Restock: ${selectedItem?.ItemName}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
        >
          Save
        </Button>,
      ]}
      width={600}
    >
      {/* FIX: Add onValuesChange handler */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          PurchaseDate: dayjs(), // Fixed field name to match other forms
        }}
      >
        <Form.Item name="ReceiptInfo" label="Receipt Info / Ref # (Optional)">
          <Input placeholder="e.g., OR# 12345, or a note" />
        </Form.Item>

        <Form.Item
          name="PurchaseDate"
          label="Purchase Date"
          rules={[
            {
              required: true,
              message: "Please select purchase date",
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="QuantityPurchased"
          label="Quantity Purchased"
          rules={[{ required: true, message: "Please enter quantity" }]}
        >
          <InputNumber min={0.01} style={{ width: "100%" }} />
        </Form.Item>

        {/* FIX: Add UnitCost field and update TotalCost to be calculated */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="UnitCost"
              label="Cost per Unit"
              rules={[
                { required: true, message: "Cost per unit is required." },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} prefix="₱" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="TotalCost"
              label="Total Amount Paid"
              rules={[
                {
                  required: true,
                  message: "Total cost is required",
                },
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: "100%" }}
                prefix="₱"
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="SupplierID"
          label="Supplier"
          rules={[{ required: true, message: "Please select a supplier" }]}
        >
          <Select
            placeholder="Select supplier"
            showSearch
            optionFilterProp="label"
          >
            {suppliers.map((s) => (
              <Option
                key={s.SupplierID}
                value={s.SupplierID}
                label={s.SupplierName}
              >
                {s.SupplierName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RestockForm;
