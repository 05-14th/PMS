import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Modal,
  Button,
  Checkbox,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;

interface Supplier {
  SupplierID: number;
  SupplierName: string;
}

interface AddStockFormProps {
  visible: boolean;
  onCancel: () => void;
  onAdd: (values: any) => void;
  loading: boolean;
  suppliers: Supplier[];
  categories: Array<{ value: string; label: string }>;
  units: Array<{ value: string; label: string }>;
}

const AddStockForm: React.FC<AddStockFormProps> = ({
  visible,
  onCancel,
  onAdd,
  loading,
  suppliers,
  categories,
  units,
}) => {
  const [form] = Form.useForm();
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setIsNewSupplier(false);
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, isNewSupplier };
      onAdd(payload);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title="Add New Item to Inventory"
      open={visible}
      onCancel={onCancel}
      width={700}
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
          Add Item
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="ItemName"
          label="Item Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="Category"
              label="Category"
              rules={[{ required: true }]}
            >
              <Select>
                {categories.map((c) => (
                  <Option key={c.value} value={c.value}>
                    {c.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="Unit" label="Unit" rules={[{ required: true }]}>
              <Select>
                {units.map((u) => (
                  <Option key={u.value} value={u.value}>
                    {u.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="PurchaseDate"
              label="Purchase Date"
              rules={[{ required: true }]}
              initialValue={dayjs()}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="QuantityPurchased"
              label="Quantity Purchased"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="AmountPaid"
          label="Amount Paid"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} prefix="₱" />
        </Form.Item>

        {/* MODIFICATION: Added optional Receipt Info field */}
        <Form.Item name="ReceiptInfo" label="Receipt Info / Ref # (Optional)">
          <Input placeholder="e.g., OR# 12345, or a note" />
        </Form.Item>

        <Checkbox
          checked={isNewSupplier}
          onChange={(e) => setIsNewSupplier(e.target.checked)}
        >
          Add a new supplier
        </Checkbox>

        {!isNewSupplier ? (
          <Form.Item
            name="ExistingSupplierID"
            label="Select Supplier"
            rules={[{ required: true, message: "Please select a supplier." }]}
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
        ) : (
          <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <Form.Item
              name="NewSupplierName"
              label="New Supplier Name"
              rules={[
                { required: true, message: "New supplier name is required." },
              ]}
            >
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ContactPerson"
                  label="Contact Person (Optional)"
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="PhoneNumber" label="Phone Number (Optional)">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="Email" label="Email (Optional)">
              <Input type="email" />
            </Form.Item>
            <Form.Item name="Address" label="Address (Optional)">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default AddStockForm;
