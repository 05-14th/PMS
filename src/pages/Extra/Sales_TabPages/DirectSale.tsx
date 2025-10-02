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
}

interface OrderItem {
  key: string;
  harvestProductID: number;
  productType: string;
  quantitySold: number;
  totalWeightKg: number;
  pricePerKg: number;
  batchName: string;
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [harvestedProducts, setHarvestedProducts] = useState<
    HarvestedProduct[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<HarvestedProduct | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [customersRes, productsRes, paymentsRes] = await Promise.all([
          api.get("/api/customers"),
          api.get("/api/harvested-products"),
          api.get("/api/payment-methods"),
        ]);

        console.log("🔍 Raw customers data:", customersRes.data);

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

        // Map customers data - handle all possible cases
        const rawCustomers = customersRes.data || [];
        const mappedCustomers = rawCustomers
          .map((customer: any) => {
            // Try different possible property names
            const customerID =
              customer.customerID ||
              customer.CustomerID ||
              customer.customerId ||
              customer.id;
            const name =
              customer.name || customer.Name || customer.customerName;

            console.log(`🔍 Mapping customer:`, customer);
            console.log(`🔍 Found ID: ${customerID}, Name: ${name}`);

            return {
              customerID: customerID,
              name: name,
              email: customer.email || customer.Email,
              phone: customer.phone || customer.Phone,
              address: customer.address || customer.Address,
            };
          })
          .filter((customer: Customer) => customer.customerID && customer.name); // Filter out invalid customers

        console.log("✅ Final mapped customers:", mappedCustomers);

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
    form.setFieldsValue({ SaleDate: dayjs() });
  }, [form]);

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
      totalWeightKg: 0, // Will be calculated during sale completion
      pricePerKg: 0, // Will be set during sale completion
      batchName: selectedProduct.batchName,
    };

    setOrderItems((prev) => [...prev, newItem]);
    form.resetFields(["productType", "quantitySold"]);
    setSelectedProduct(null);
  };

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
      ]);

      setIsSaving(true);

      const payload = {
        customerID: orderInfo.CustomerID,
        saleDate: dayjs(orderInfo.SaleDate).format("YYYY-MM-DD HH:mm:ss"),
        paymentMethod: orderInfo.PaymentMethod,
        notes: orderInfo.Notes || "",
        status: "Fulfilled",
        items: orderItems.map((item) => ({
          harvestProductID: item.harvestProductID,
          productType: item.productType,
          quantitySold: item.quantitySold,
          totalWeightKg: item.totalWeightKg,
          pricePerKg: item.pricePerKg,
        })),
      };

      await api.post("/api/direct-sales", payload);
      message.success("Direct sale completed successfully!");

      // Reset form
      setOrderItems([]);
      form.resetFields();
      form.setFieldsValue({ SaleDate: dayjs() });
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
        >
          Remove
        </Button>
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
          </Row>
        </Form>

        <Divider />

        {availableProducts.length === 0 ? (
          <Alert
            message="No products available for direct sale"
            description="Products will appear here after harvesting or when voided sales return products to inventory."
            type="info"
            showIcon
          />
        ) : (
          <>
            <Form form={form} layout="vertical" onFinish={handleAddItem}>
              <Space align="end" wrap>
                <Form.Item
                  label="Product from Inventory"
                  name="harvestProductID"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select product"
                    style={{ width: 300 }}
                    onChange={(value) => {
                      const product = harvestedProducts.find(
                        (p) => p.harvestProductID === value
                      );
                      setSelectedProduct(product || null);
                      form.setFieldsValue({
                        productType: product?.productType,
                      });
                    }}
                  >
                    {availableProducts.map((p) => (
                      <Option
                        key={p.harvestProductID}
                        value={p.harvestProductID}
                      >
                        {p.productType} - {p.batchName} (Available:{" "}
                        {p.quantityRemaining})
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
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={1}
                    max={availableForSale}
                    placeholder="e.g., 5"
                    style={{ width: 150 }}
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
                  <Tag color="blue">Available: {availableForSale}</Tag>
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

      {orderItems.length > 0 && (
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
            loading={isSaving}
          >
            Complete Direct Sale
          </Button>
        </div>
      )}
    </div>
  );
};

export default DirectSale;
