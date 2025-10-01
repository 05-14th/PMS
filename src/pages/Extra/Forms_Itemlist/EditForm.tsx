// src/pages/Extra/Inventory/EditForm.tsx

import React, { useEffect, useState } from "react";
import { Form, Input, Select, Modal, Button } from "antd";

const { Option } = Select;

interface EditFormProps {
  visible: boolean;
  onUpdate: (values: any) => void;
  onCancel: () => void;
  categories: Array<{ value: string; label: string }>;
  units: Array<{ value: string; label: string }>;
  subCategories: Array<{ value: string; label: string }>;
  initialValues?: any;
}

const EditForm: React.FC<EditFormProps> = ({
  visible,
  onUpdate,
  onCancel,
  categories,
  initialValues,
  units,
  subCategories,
}) => {
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setSelectedCategory(initialValues.Category);
    }
  }, [initialValues, form]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value !== "Feed") {
      form.setFieldsValue({ SubCategory: null });
    }
  };

  return (
    <Modal
      title="Edit Item"
      open={visible}
      onCancel={onCancel}
      afterClose={() => setSelectedCategory("")}
      closable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() =>
            form
              .validateFields()
              .then((values) => onUpdate({ ...initialValues, ...values }))
          }
        >
          Save Changes
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="edit_item_form"
        initialValues={initialValues}
      >
        <Form.Item
          name="ItemName"
          label="Item Name"
          rules={[{ required: true, message: "Please input the item name!" }]}
        >
          <Input placeholder="Enter item name" />
        </Form.Item>

        <Form.Item
          name="Category"
          label="Category"
          rules={[{ required: true, message: "Please select a category!" }]}
        >
          <Select
            placeholder="Select a category"
            onChange={handleCategoryChange}
          >
            {/* FIX: Use (categories || []) to prevent crash */}
            {(categories || [])
              .filter((cat) => cat.value !== "all")
              .map((category) => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
          </Select>
        </Form.Item>

        {selectedCategory === "Feed" && (
          <Form.Item
            name="SubCategory"
            label="Feed Type (SubCategory)"
            rules={[
              { required: true, message: "Please select the feed type!" },
            ]}
          >
            <Select placeholder="Select a feed type">
              {/* FIX: Use (subCategories || []) to prevent crash */}
              {(subCategories || []).map((sub) => (
                <Option key={sub.value} value={sub.value}>
                  {sub.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="Unit"
          label="Unit"
          rules={[{ required: true, message: "Please select the unit!" }]}
        >
          <Select placeholder="Select a unit">
            {/* FIX: Use (units || []) to prevent crash */}
            {(units || []).map((unit) => (
              <Option key={unit.value} value={unit.value}>
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
