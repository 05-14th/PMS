// src/pages/Extra/Sales_TabPages/DirectSale.tsx
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
  Space,
  Input,
  Tag,
  Divider,
  Alert,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  customerID: number;
  name: string;
}

interface HarvestedProduct {
  harvestProductID: number;
  harvestDate: string;
  productType: string;
  quantityHarvested: number;
  quantityRemaining: number;
  weightHarvestedKg: number;
  weightRemainingKg: number;
  batchName: string;
  batchID: number;
}

interface OrderItem {
  key: string;
  harvestProductID: number;
  productType: string;
  quantitySold: number;
  totalWeightKg: number;
  pricePerKg: number;
  batchName: string;
  batchID: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const DirectSale: React.FC = () => {
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subTotal, setSubTotal] = useState(0); // NEW: For total calculation

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [harvestedProducts, setHarvestedProducts] = useState<
    HarvestedProduct[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<HarvestedProduct | null>(null);

  // NEW: Watchers for dynamic form fields
  const discount = Form.useWatch("discount", form) || 0;
  const enteredWeight = Form.useWatch("totalWeightKg", form) || 0;
  const selectedHarvestProductID = Form.useWatch("harvestProductID", form);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [customersRes, productsRes, paymentsRes] = await Promise.all([
          api.get("/api/customers"),
          api.get("/api/harvested-products"),
          api.get("/api/payment-methods"),
        ]);

        // Map products data
        const rawProducts = productsRes.data || [];
        const mappedProducts = rawProducts.map((product: any) => ({
          harvestProductID:
            product.harvestProductID || product.HarvestProductID,
          harvestDate: product.harvestDate || product.HarvestDate,
          productType: product.productType || product.ProductType,
          quantityHarvested:
            product.quantityHarvested || product.QuantityHarvested,
          quantityRemaining:
            product.quantityRemaining || product.QuantityRemaining,
          weightHarvestedKg:
            product.weightHarvestedKg || product.WeightHarvestedKg,
          weightRemainingKg:
            product.weightRemainingKg || product.WeightRemainingKg,
          batchName: product.batchName || product.BatchName,
        }));

        // Map customers data
        const rawCustomers = customersRes.data || [];
        const mappedCustomers = rawCustomers
          .map((customer: any) => {
            const customerID =
              customer.customerID ||
              customer.CustomerID ||
              customer.customerId ||
              customer.id;
            const name =
              customer.name || customer.Name || customer.customerName;

            return {
              customerID: customerID,
              name: name,
            };
          })
          .filter((customer: Customer) => customer.customerID && customer.name);

        setCustomers(mappedCustomers);
        setHarvestedProducts(mappedProducts);
        setPaymentMethods(paymentsRes.data || []);
      } catch (error) {
        console.error("Failed to load data:", error);
        message.error("Failed to load required data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
    form.setFieldsValue({ SaleDate: dayjs(), discount: 0 });
  }, [form]);

  // NEW: Calculate Subtotal
  useEffect(() => {
    const currentSubtotal = orderItems.reduce(
      (total, item) => total + item.totalWeightKg * item.pricePerKg,
      0
    );
    setSubTotal(currentSubtotal);
  }, [orderItems]);

  // UPDATED: Handle adding items
  const handleAddItem = (values: any) => {
    if (!selectedProduct) {
      message.error("Please select a product first.");
      return;
    }

    if (values.quantitySold > selectedProduct.quantityRemaining) {
      message.error(
        `Only ${selectedProduct.quantityRemaining} units available.`
      );
      return;
    }

    const newItem: OrderItem = {
      key: `direct-${Date.now()}`,
      harvestProductID: selectedProduct.harvestProductID,
      productType: selectedProduct.productType,
      quantitySold: values.quantitySold,
      totalWeightKg: values.totalWeightKg, // UPDATED
      pricePerKg: values.pricePerKg, // UPDATED
      batchName: selectedProduct.batchName,
      batchID: selectedProduct.batchID,
    };

    setOrderItems((prev) => [...prev, newItem]);
    // UPDATED: Reset all item-related fields
    form.resetFields([
      "harvestProductID",
      "productType",
      "quantitySold",
      "totalWeightKg",
      "pricePerKg",
    ]);
    setSelectedProduct(null);
  };

  // UPDATED: Handle saving the sale
  const handleSaveSale = async () => {
    if (orderItems.length === 0) {
      message.warn("Please add at least one item to the order.");
      return;
    }

    try {
      const orderInfo = await form.validateFields([
        "CustomerID",
        "SaleDate",
        "PaymentMethod",
        "Notes",
        "discount",
      ]);

      setIsSaving(true);

      const payload = {
        customerID: orderInfo.CustomerID,
        saleDate: dayjs(orderInfo.SaleDate).format("YYYY-MM-DD HH:mm:ss"),
        paymentMethod: orderInfo.PaymentMethod,
        notes: orderInfo.Notes || "",

        batchID: orderItems.length > 0 ? orderItems[0].batchID : null,
        items: orderItems.map((item) => ({
          harvestProductID: item.harvestProductID,
          productType: item.productType,
          quantitySold: item.quantitySold,
          totalWeightKg: item.totalWeightKg,
          pricePerKg: item.pricePerKg,
        })),
      };

      // You can keep this log for final confirmation
      console.log(
        "Sending final payload (camelCase):",
        JSON.stringify(payload, null, 2)
      );

      await api.post("/api/direct-sales", payload);
      message.success("Direct sale completed successfully!");

      // Reset form
      setOrderItems([]);
      form.resetFields();
      form.setFieldsValue({ SaleDate: dayjs(), discount: 0 });
      setSelectedProduct(null);

      // Refresh inventory
      const productsRes = await api.get("/api/harvested-products");
      const mappedProducts = (productsRes.data || []).map((product: any) => ({
        harvestProductID: product.harvestProductID || product.HarvestProductID,
        harvestDate: product.harvestDate || product.HarvestDate,
        productType: product.productType || product.ProductType,
        quantityHarvested:
          product.quantityHarvested || product.QuantityHarvested,
        quantityRemaining:
          product.quantityRemaining || product.QuantityRemaining,
        weightHarvestedKg:
          product.weightHarvestedKg || product.WeightHarvestedKg,
        weightRemainingKg:
          product.weightRemainingKg || product.WeightRemainingKg,
        batchName: product.batchName || product.BatchName,
      }));
      setHarvestedProducts(mappedProducts);
    } catch (error: any) {
      console.error("Sale error:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to complete sale.";
      message.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // UPDATED: Table columns
  const orderItemColumns = [
    {
      title: "Product Type",
      dataIndex: "productType",
      key: "productType",
    },
    {
      title: "Batch",
      dataIndex: "batchName",
      key: "batchName",
    },
    {
      title: "Quantity",
      dataIndex: "quantitySold",
      key: "quantitySold",
    },
    {
      title: "Weight (kg)",
      dataIndex: "totalWeightKg",
      key: "totalWeightKg",
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: "Price / kg",
      dataIndex: "pricePerKg",
      key: "pricePerKg",
      render: (price: number) => `₱${price.toFixed(2)}`,
    },
    {
      title: "Item Total",
      key: "itemTotal",
      render: (_: any, record: OrderItem) =>
        `₱${(record.totalWeightKg * record.pricePerKg).toFixed(2)}`,
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

  const availableProducts = harvestedProducts.filter(
    (p) => p.quantityRemaining > 0
  );

  const availableForSale = selectedProduct
    ? selectedProduct.quantityRemaining -
      orderItems.reduce(
        (sum, item) =>
          item.harvestProductID === selectedProduct.harvestProductID
            ? sum + item.quantitySold
            : sum,
        0
      )
    : 0;

  // NEW: Check for weight discrepancy
  const showWeightWarning =
    selectedProduct && enteredWeight > selectedProduct.weightRemainingKg;

  return (
    <div className="p-2 sm:p-4">
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Direct Sale (From Inventory)
          </Title>
        }
        style={{ marginBottom: 24 }}
      >
        {/* Main sale info form (Customer, Date, etc.) */}
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
                    value: c.customerID,
                    label: c.name,
                  }))}
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
            <Col xs={24}>
              <Form.Item name="Notes" label="Notes (Optional)">
                <Input.TextArea rows={1} />
              </Form.Item>
            </Col>

            {/* NEW: Discount field moved here */}
            <Col xs={24} md={8}>
              <Form.Item name="discount" label="Discount (₱)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  prefix="₱"
                  precision={2}
                  disabled={orderItems.length === 0}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        {/* Add items section */}
        {availableProducts.length === 0 ? (
          <Alert
            message="No products available for direct sale"
            description="Products will appear here after harvesting or when voided sales return products to inventory."
            type="info"
            showIcon
          />
        ) : (
          <>
            {/* NEW: Weight Discrepancy Warning */}
            {showWeightWarning && (
              <Alert
                message={`Note: Entered weight (${enteredWeight}kg) exceeds recorded available weight (${selectedProduct?.weightRemainingKg}kg). The actual measured weight will be used.`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* UPDATED: Add Item Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddItem}
              // We use a different key to force re-render when selected product changes
              // This is a way to clear validation statuses
              key={selectedHarvestProductID || "add-item-form"}
            >
              <Space align="end" wrap>
                <Form.Item
                  label="Product from Inventory"
                  name="harvestProductID"
                  rules={[
                    { required: true, message: "Please select a product." },
                  ]}
                >
                  <Select
                    placeholder="Select product"
                    style={{ width: 250 }}
                    onChange={(value) => {
                      const product = harvestedProducts.find(
                        (p) => p.harvestProductID === value
                      );
                      setSelectedProduct(product || null);
                      form.setFieldsValue({
                        productType: product?.productType,
                        // Clear previous item entries
                        quantitySold: undefined,
                        totalWeightKg: undefined,
                        pricePerKg: undefined,
                      });
                    }}
                  >
                    {availableProducts.map((p) => (
                      <Option
                        key={p.harvestProductID}
                        value={p.harvestProductID}
                      >
                        {p.productType} - {p.batchName} (Qty:{" "}
                        {p.quantityRemaining}, Wt:{" "}
                        {p.weightRemainingKg.toFixed(2)}kg)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Product Type" name="productType">
                  <Input
                    style={{ width: 150 }}
                    disabled
                    placeholder="Auto-filled"
                  />
                </Form.Item>

                <Form.Item
                  label="Quantity to Sell"
                  name="quantitySold"
                  rules={[
                    { required: true, message: "Enter quantity." },
                    {
                      validator: (_, value) => {
                        if (value && value > availableForSale) {
                          return Promise.reject(
                            new Error(`Max ${availableForSale} available`)
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={availableForSale}
                    placeholder="e.g., 5"
                    style={{ width: 120 }}
                    disabled={!selectedProduct}
                  />
                </Form.Item>

                {/* NEW: Actual Weight */}
                <Form.Item
                  label="Actual Weight (kg)"
                  name="totalWeightKg"
                  rules={[
                    { required: true, message: "Enter weight." },
                    {
                      validator: (_, value) => {
                        if (value && value <= 0) {
                          return Promise.reject(
                            new Error("Weight must be > 0")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  validateStatus={showWeightWarning ? "warning" : ""}
                >
                  <InputNumber
                    min={0.01}
                    step={0.01}
                    precision={2}
                    placeholder="e.g., 25.5"
                    style={{ width: 140 }}
                    disabled={!selectedProduct}
                  />
                </Form.Item>

                {/* NEW: Price per Kg */}
                <Form.Item
                  label="Price per Kg (₱)"
                  name="pricePerKg"
                  rules={[
                    { required: true, message: "Enter price." },
                    {
                      validator: (_, value) => {
                        if (value && value <= 0) {
                          return Promise.reject(new Error("Price must be > 0"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0.01}
                    step={0.01}
                    precision={2}
                    prefix="₱"
                    placeholder="e.g., 180"
                    style={{ width: 120 }}
                    disabled={!selectedProduct}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="default"
                    htmlType="submit"
                    icon={<PlusOutlined />}
                    disabled={!selectedProduct}
                  >
                    Add to Sale
                  </Button>
                </Form.Item>

                {selectedProduct && (
                  <Tag color="blue">Available: {availableForSale} pcs</Tag>
                )}
              </Space>
            </Form>
          </>
        )}
      </Card>

      <Card
        title={<Title level={5}>Sale Items</Title>}
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={orderItemColumns}
          dataSource={orderItems}
          rowKey="key"
          pagination={false}
          locale={{ emptyText: "No items added to this sale yet." }}
        />
      </Card>

      {/* NEW: Totals and Save Button */}
      {orderItems.length > 0 && (
        <Card>
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              {/* Discount field is now part of the main form */}
              <Text type="secondary">
                Discount is applied to the final total.
              </Text>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: "right" }}>
              <div>
                <Text>Subtotal:</Text>{" "}
                <Text strong>₱{subTotal.toFixed(2)}</Text>
              </div>
              <div>
                <Text type="danger">Discount:</Text>{" "}
                <Text strong type="danger">
                  - ₱{discount.toFixed(2)}
                </Text>
              </div>
              <Title level={4} style={{ marginTop: 8 }}>
                Final Total: ₱{(subTotal - discount).toFixed(2)}
              </Title>
              <Button
                type="primary"
                size="large"
                onClick={handleSaveSale}
                loading={isSaving}
                style={{ marginTop: 16 }}
              >
                Complete Direct Sale
              </Button>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default DirectSale;
