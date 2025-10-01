// src/pages/Extra/Inventory/AddForm.tsx

import React, { useState } from "react";
import { Form, Input, Select, Modal, Button, message } from "antd";
import axios from "axios";

const { Option } = Select;

interface AddFormProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  categories: Array<{ value: string; label: string }>;
  units: Array<{ value: string; label: string }>;
  subCategories: Array<{ value: string; label: string }>;
}

const AddForm: React.FC<AddFormProps> = ({
  visible,
  onSuccess,
  onCancel,
  categories,
  units,
  subCategories,
}) => {
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleAddItem = async (values: any) => {
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_APP_SERVERHOST,
        timeout: 10000,
      });
      const response = await api.post("/api/items", {
        ItemName: values.ItemName,
        Category: values.Category,
        Unit: values.Unit,
        SubCategory: values.SubCategory,
      });

      if (response.data.success) {
        onSuccess();
      } else {
        message.error("An unknown error occurred.");
      }
    } catch (err) {
      message.error("Failed to add item. Please try again.");
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value !== "Feed") {
      form.setFieldsValue({ SubCategory: null });
    }
  };

  return (
    <Modal
      title="Add New Item"
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
          onClick={() => form.validateFields().then(handleAddItem)}
        >
          Add Item
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" name="add_item_form">
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

export default AddForm;
