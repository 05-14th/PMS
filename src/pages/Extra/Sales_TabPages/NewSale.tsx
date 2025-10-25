// src/pages/Extra/Sales_TabPages/NewSale.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  message,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Typography,
  Card,
  App,
  Grid,
  Divider,
  Space,
  Radio,
  Input,
  Tag,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import AddCustomerForm from "../Forms_Sales/AddCustomerForm";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// --- Interfaces ---
interface Customer {
  CustomerID: number;
  Name: string;
}

interface BatchForSale {
  batchID: number;
  batchName: string;
  expectedHarvestDate: string;
  totalChicken: number;
  currentChicken: number; // <-- ADDED
  preOrderedChicken: number;
}

interface OrderItem {
  key: string;
  productType: string;
  quantitySold: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const NewSale: React.FC = () => {
  const [form] = Form.useForm();
  const { modal } = App.useApp();
  const screens = useBreakpoint();

  // Form state
  const [saleType, setSaleType] = useState<"pre-order" | "direct-sale">(
    "pre-order"
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchForSale | null>(null);

  // Data from API
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<BatchForSale[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Fetch initial data for dropdowns
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [customersRes, batchesRes, paymentsRes] = await Promise.all([
          api.get("/api/customers"),
          api.get("/api/batches-for-sale"),
          api.get("/api/payment-methods"),
        ]);
        setCustomers(customersRes.data || []);
        setBatches(batchesRes.data || []);
        setPaymentMethods(paymentsRes.data || []);
      } catch (error) {
        message.error("Failed to load required data for the sales form.");
      }
    };
    fetchInitialData();
    form.setFieldsValue({ SaleDate: dayjs() });
  }, [form]);

  // Adds a pre-order item to the cart
  const handleAddItem = (values: any) => {
    if (!selectedBatch) {
      message.error("Please select a batch first.");
      return;
    }

    // --- FIX: Use currentChicken for validation ---
    const availableQty =
      selectedBatch.currentChicken - selectedBatch.preOrderedChicken;
    const qtyInCart = orderItems.reduce(
      (sum, item) => sum + item.quantitySold,
      0
    );

    if (values.quantitySold > availableQty - qtyInCart) {
      message.error(
        `Only ${availableQty - qtyInCart} chickens are available for pre-order in this batch.`
      );
      return;
    }

    const newItem: OrderItem = {
      key: `${values.productType}-${Date.now()}`,
      productType: values.productType,
      quantitySold: values.quantitySold,
    };

    setOrderItems((prev) => [...prev, newItem]);
    form.resetFields(["productType", "quantitySold"]);
  };

  // Saves the final pre-order
  const handleSaveSale = async () => {
    if (orderItems.length === 0) {
      message.warn("Please add at least one item to the order.");
      return;
    }

    try {
      // MODIFIED: Removed Discount from this validation step
      const orderInfo = await form.validateFields([
        "CustomerID",
        "BatchID",
        "SaleDate",
        "PaymentMethod",
        "Notes",
      ]);
      setIsSaving(true);
      const payload = {
        customerID: orderInfo.CustomerID,
        batchID: orderInfo.BatchID,
        saleDate: dayjs(orderInfo.SaleDate).format("YYYY-MM-DD HH:mm:ss"),
        paymentMethod: orderInfo.PaymentMethod,
        notes: orderInfo.Notes || "",
        // MODIFIED: Discount is no longer part of the pre-order payload
        items: orderItems.map((item) => ({
          productType: item.productType,
          quantitySold: item.quantitySold,
        })),
      };

      await api.post("/api/sales", payload);
      message.success("Pre-order saved successfully!");
      setOrderItems([]);
      form.resetFields();
      form.setFieldsValue({ SaleDate: dayjs() });
      // Refresh batch availability
      const batchesRes = await api.get("/api/batches-for-sale");
      setBatches(batchesRes.data || []);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        "An error occurred while saving the pre-order.";
      message.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for adding a new customer from the modal
  const handleAddCustomer = async (values: any) => {
    try {
      const response = await api.post("/api/customers", values);
      setIsCustomerModalVisible(false);
      message.success("Customer added successfully! You can now select them.");

      const newCustomerId = response.data.insertedId;
      const customersRes = await api.get("/api/customers");
      setCustomers(customersRes.data || []);
      form.setFieldsValue({ CustomerID: newCustomerId });
    } catch (error) {
      message.error("Failed to add customer.");
      throw error;
    }
  };

  const orderItemColumns = [
    { title: "Product Type", dataIndex: "productType", key: "productType" },
    {
      title: "Quantity Ordered",
      dataIndex: "quantitySold",
      key: "quantitySold",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: OrderItem) => (
        <Button
          danger
          type="link"
          icon={<DeleteOutlined />}
          onClick={() =>
            setOrderItems((prev) =>
              prev.filter((item) => item.key !== record.key)
            )
          }
        />
      ),
    },
  ];

  const availableForPreOrder = selectedBatch
    ? selectedBatch.currentChicken -
      selectedBatch.preOrderedChicken -
      orderItems.reduce((sum, item) => sum + item.quantitySold, 0)
    : 0;

  return (
    <div className="p-2 sm:p-4">
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Pre-Order
          </Title>
        }
        style={{ marginBottom: 24 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Customer"
                name="CustomerID"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select customer"
                  showSearch
                  optionFilterProp="label"
                  disabled={orderItems.length > 0}
                  options={customers.map((c) => ({
                    value: c.CustomerID,
                    label: c.Name,
                  }))}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCustomerModalVisible(true)}
                        style={{ width: "100%" }}
                      >
                        Add New Customer
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Sale Date"
                name="SaleDate"
                rules={[{ required: true }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  disabled={orderItems.length > 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Payment Method"
                name="PaymentMethod"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select method"
                  disabled={orderItems.length > 0}
                >
                  {paymentMethods.map((m) => (
                    <Option key={m} value={m}>
                      {m}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Batch for Pre-Order"
                name="BatchID"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select a batch"
                  disabled={orderItems.length > 0}
                  onChange={(value) =>
                    setSelectedBatch(
                      batches.find((b) => b.batchID === value) || null
                    )
                  }
                >
                  {batches.map((b) => (
                    <Option
                      key={b.batchID}
                      value={b.batchID}
                      disabled={b.currentChicken - b.preOrderedChicken <= 0}
                    >
                      {b.batchName} (Available:{" "}
                      {b.currentChicken - b.preOrderedChicken}) - Harvest:{" "}
                      {dayjs(b.expectedHarvestDate).format("MMM D")}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="Notes" label="Notes (Optional)">
                <Input.TextArea rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        <Form form={form} layout="vertical" onFinish={handleAddItem}>
          <Space align="bottom">
            <Form.Item
              label="Product Type"
              name="productType"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select type"
                style={{ width: 200 }}
                disabled={!selectedBatch}
              >
                <Option value="Dressed">Dressed</Option>
                <Option value="Live">Live</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Quantity to Order"
              name="quantitySold"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                placeholder="e.g., 50"
                style={{ width: 150 }}
                disabled={!selectedBatch}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="default"
                htmlType="submit"
                icon={<PlusOutlined />}
                disabled={!selectedBatch}
              >
                Add to Order
              </Button>
            </Form.Item>
            {selectedBatch && (
              <Tag color="blue">
                Available for Pre-Order: {availableForPreOrder}
              </Tag>
            )}
          </Space>
        </Form>
      </Card>

      <Card
        title={<Title level={5}>Order Items</Title>}
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={orderItemColumns}
          dataSource={orderItems}
          rowKey="key"
          pagination={false}
          locale={{ emptyText: "No items added to this order yet." }}
        />
      </Card>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
        }}
      >
        <Button
          type="primary"
          size="large"
          onClick={handleSaveSale}
          disabled={orderItems.length === 0}
          loading={isSaving}
        >
          Save Pre-Order
        </Button>
      </div>

      <AddCustomerForm
        visible={isCustomerModalVisible}
        onCreate={handleAddCustomer}
        onCancel={() => setIsCustomerModalVisible(false)}
      />
    </div>
  );
};

export default NewSale;
