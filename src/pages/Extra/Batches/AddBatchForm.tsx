import React from "react";
import { Modal, Form, Input, InputNumber, DatePicker } from "antd";
import dayjs from "dayjs";

interface AddBatchFormProps {
  visible: boolean;
  onCreate: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const AddBatchForm: React.FC<AddBatchFormProps> = ({
  visible,
  onCreate,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleFormChange = (changedValues: any, allValues: any) => {
    // Automatically calculate Expected Harvest Date
    if (changedValues.StartDate) {
      const startDate = dayjs(changedValues.StartDate);
      if (startDate.isValid()) {
        const expectedHarvestDate = startDate.add(28, "day");
        form.setFieldsValue({ ExpectedHarvestDate: expectedHarvestDate });
      }
    }

    // Automatically calculate Total Chick Cost
    if (
      changedValues.TotalChicken !== undefined ||
      changedValues.CostPerChick !== undefined
    ) {
      const { TotalChicken, CostPerChick } = allValues;
      if (TotalChicken > 0 && CostPerChick > 0) {
        const totalCost = TotalChicken * CostPerChick;
        form.setFieldsValue({ TotalChickCost: totalCost });
      } else {
        form.setFieldsValue({ TotalChickCost: 0 });
      }
    }
  };

  return (
    <Modal
      open={visible}
      title="Create a New Batch"
      okText="Create Batch"
      cancelText="Cancel"
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onCreate(values);
            form.resetFields();
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
      destroyOnHidden // Ensures form resets state when closed
    >
      <Form
        form={form}
        layout="vertical"
        name="add_batch_form"
        initialValues={{ StartDate: dayjs() }}
        // MODIFICATION: onValuesChange triggers our date calculation function
        onValuesChange={handleFormChange}
      >
        <Form.Item
          name="BatchName"
          label="Batch Name"
          rules={[{ required: true, message: "Please input the batch name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="TotalChicken"
          label="Initial Chicken Count"
          rules={[
            {
              required: true,
              type: "number",
              min: 1,
              message: "Please input a valid count!",
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        {/* This is the updated input field */}
        <Form.Item
          name="CostPerChick"
          label="Cost Per Chick (₱)"
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: "Please input a valid cost per chick!",
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        {/* This is the new, disabled display field */}
        <Form.Item name="TotalChickCost" label="Total Chick Cost (Calculated)">
          <InputNumber
            style={{ width: "100%" }}
            disabled // This makes the field read-only
            prefix="₱"
          />
        </Form.Item>

        <Form.Item
          name="StartDate"
          label="Start Date"
          rules={[{ required: true, message: "Please select a start date!" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="ExpectedHarvestDate"
          label="Expected Harvest Date"
          rules={[
            {
              required: true,
              message: "Please select an expected harvest date!",
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Notes" label="Notes (Optional)">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddBatchForm;
