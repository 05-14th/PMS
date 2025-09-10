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

  // MODIFICATION: This function handles the automatic date calculation
  const handleFormChange = (changedValues: any) => {
    if (changedValues.StartDate) {
      const startDate = dayjs(changedValues.StartDate);
      if (startDate.isValid()) {
        const expectedHarvestDate = startDate.add(28, "day");
        form.setFieldsValue({ ExpectedHarvestDate: expectedHarvestDate });
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
        {/* MODIFICATION: New Chick Cost field */}
        <Form.Item
          name="ChickCost"
          label="Chick Cost (Total Amount ₱)"
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: "Please input a valid cost!",
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
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
