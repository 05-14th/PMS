import React, { useState, useEffect, useMemo } from "react";
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

interface SaleProduct {
  HarvestProductID: number;
  ProductType: string;
  QuantityRemaining: number;
  WeightRemainingKg: number;
}

interface SaleItem {
  key: string;
  HarvestProductID: number;
  CustomerID: number;
  ProductName: string;
  CustomerName: string;
  QuantitySold: number;
  TotalWeightKg: number;
  PricePerKg: number;
  PaymentMethod: string;
  SaleDate: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const NewSale: React.FC = () => {
  const [form] = Form.useForm();
  const { modal } = App.useApp();
  const screens = useBreakpoint();

  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SaleProduct | null>(
    null
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  const fetchCustomers = async () => {
    try {
      const customersRes = await api.get("/api/customers");
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchSaleProducts = async () => {
    try {
      const productsRes = await api.get("/api/sale-products");
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch sale products:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const paymentsRes = await api.get("/api/payment-methods");
        setPaymentMethods(paymentsRes.data || []);
      } catch (error) {
        message.error("Failed to load required data for the sales form.");
      }
    };
    fetchInitialData();
    fetchCustomers();
    fetchSaleProducts();
    form.setFieldsValue({ SaleDate: dayjs() });
  }, [form]);

  const productOptions = useMemo(() => {
    return products.map((p) => {
      const quantityInCart = salesItems
        .filter((item) => item.HarvestProductID === p.HarvestProductID)
        .reduce((sum, item) => sum + item.QuantitySold, 0);
      const weightInCart = salesItems
        .filter((item) => item.HarvestProductID === p.HarvestProductID)
        .reduce((sum, item) => sum + item.TotalWeightKg, 0);

      const availableQty = p.QuantityRemaining - quantityInCart;
      const availableWeight = p.WeightRemainingKg - weightInCart;

      const isSoldByWeightOnly =
        p.QuantityRemaining === 0 && p.WeightRemainingKg > 0;

      return {
        value: p.HarvestProductID,
        label: isSoldByWeightOnly
          ? `${p.ProductType} (${availableWeight.toFixed(2)} kg)`
          : `${p.ProductType} (${availableQty.toFixed(0)} pcs)`,
        disabled: availableQty <= 0 && availableWeight <= 0,
      };
    });
  }, [products, salesItems]);

  const onFinish = (values: any) => {
    const product = products.find(
      (p) => p.HarvestProductID === values.HarvestProductID
    );
    const customer = customers.find((c) => c.CustomerID === values.CustomerID);

    if (!product || !customer) {
      message.error("Invalid product or customer selected.");
      return;
    }

    const quantityInCart = salesItems
      .filter((item) => item.HarvestProductID === product.HarvestProductID)
      .reduce((sum, item) => sum + item.QuantitySold, 0);
    const weightInCart = salesItems
      .filter((item) => item.HarvestProductID === product.HarvestProductID)
      .reduce((sum, item) => sum + item.TotalWeightKg, 0);

    const availableQty = product.QuantityRemaining - quantityInCart;
    const availableWeight = product.WeightRemainingKg - weightInCart;
    const isWeightOnlyProduct =
      product.QuantityRemaining === 0 && product.WeightRemainingKg > 0;

    if (!isWeightOnlyProduct && values.QuantitySold > availableQty) {
      message.error(
        `Only ${availableQty} pcs of ${product.ProductType} are available.`
      );
      return;
    }

    const addItemToOrder = () => {
      const newSaleItem: SaleItem = {
        key: Date.now().toString(),
        HarvestProductID: product.HarvestProductID,
        CustomerID: customer.CustomerID,
        ProductName: product.ProductType,
        CustomerName: customer.Name,
        QuantitySold: values.QuantitySold,
        TotalWeightKg: values.TotalWeightKg,
        PricePerKg: values.PricePerKg,
        SaleDate: values.SaleDate.format("YYYY-MM-DD"),
        PaymentMethod: values.PaymentMethod,
      };
      setSalesItems((prev) => [...prev, newSaleItem]);
      form.resetFields([
        "HarvestProductID",
        "QuantitySold",
        "TotalWeightKg",
        "PricePerKg",
      ]);
      setSelectedProduct(null);
    };

    const isOversellingWeight = values.TotalWeightKg > availableWeight;
    const isFinalSaleOfBatch =
      product.QuantityRemaining > 0 && values.QuantitySold === availableQty;
    const isDiscrepantOnFinalSale =
      isFinalSaleOfBatch &&
      Math.abs(values.TotalWeightKg - availableWeight) > 0.01;

    if (isOversellingWeight) {
      modal.confirm({
        title: "Inventory Variance Alert",
        content: `The weight you entered (${values.TotalWeightKg} kg) is MORE than the available stock (${availableWeight.toFixed(2)} kg). This suggests an inventory error. Do you want to proceed with this sale?`,
        onOk() {
          addItemToOrder();
        },
      });
    } else if (isDiscrepantOnFinalSale) {
      modal.confirm({
        title: "Weight Discrepancy Alert",
        content: `The weight you entered (${values.TotalWeightKg} kg) is different from the expected remaining weight (${availableWeight.toFixed(2)} kg). This will zero out the stock. Do you want to proceed?`,
        onOk() {
          addItemToOrder();
        },
      });
    } else {
      addItemToOrder();
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Validation Failed:", errorInfo);
    message.error("Please check the form for errors before submitting.");
  };

  const handleSaveSale = async () => {
    if (salesItems.length === 0) return;

    setIsSaving(true);
    const firstItem = salesItems[0];
    const payload = {
      CustomerID: firstItem.CustomerID,
      SaleDate: firstItem.SaleDate,
      PaymentMethod: firstItem.PaymentMethod,
      Notes: "",
      items: salesItems.map((item) => ({
        HarvestProductID: item.HarvestProductID,
        QuantitySold: item.QuantitySold,
        TotalWeightKg: item.TotalWeightKg,
        PricePerKg: item.PricePerKg,
      })),
    };

    try {
      await api.post("/api/sales", payload);
      message.success("Sale saved successfully!");
      setSalesItems([]);
      form.resetFields();
      await fetchSaleProducts();
    } catch (error: any) {
      console.error("Error saving sale:", error);

      const errorMsg =
        error.response?.data?.error ||
        "An error occurred while saving the sale.";
      message.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomer = async (values: any) => {
    try {
      const response = await api.post("/api/customers", values);
      setIsCustomerModalVisible(false);
      message.success("Customer added successfully! You can now select them.");

      const newCustomerId = response.data.insertedId;
      await fetchCustomers();
      form.setFieldsValue({ CustomerID: newCustomerId });
    } catch (error) {
      message.error("Failed to add customer.");
      console.error("Error adding customer:", error);
      throw error;
    }
  };

  const weightValidator = (_: any, value: number) => {
    if (!selectedProduct || !value) return Promise.resolve();
    const weightInCart = salesItems
      .filter(
        (item) => item.HarvestProductID === selectedProduct.HarvestProductID
      )
      .reduce((sum, item) => sum + item.TotalWeightKg, 0);
    const availableWeight = selectedProduct.WeightRemainingKg - weightInCart;
    if (value > availableWeight)
      return Promise.reject(
        new Error(`Max available is ${availableWeight.toFixed(2)} kg`)
      );
    return Promise.resolve();
  };

  const quantityValidator = (_: any, value: number) => {
    if (!selectedProduct || !value) return Promise.resolve();

    if (
      selectedProduct.QuantityRemaining === 0 &&
      selectedProduct.WeightRemainingKg > 0
    ) {
      return Promise.resolve();
    }

    const quantityInCart = salesItems
      .filter(
        (item) => item.HarvestProductID === selectedProduct.HarvestProductID
      )
      .reduce((sum, item) => sum + item.QuantitySold, 0);
    const availableNow = selectedProduct.QuantityRemaining - quantityInCart;
    if (value > availableNow)
      return Promise.reject(
        new Error(`Max available is ${availableNow.toFixed(0)}`)
      );
    return Promise.resolve();
  };
  const handleProductChange = (value: number) => {
    const product = products.find((p) => p.HarvestProductID === value);
    setSelectedProduct(product || null);

    if (
      product &&
      product.QuantityRemaining === 0 &&
      product.WeightRemainingKg > 0
    ) {
      form.setFieldsValue({ QuantitySold: 1 });
    }

    if (form.getFieldValue("QuantitySold"))
      form.validateFields(["QuantitySold"]);
    if (form.getFieldValue("TotalWeightKg"))
      form.validateFields(["TotalWeightKg"]);
  };

  const orderItemColumns = [
    { title: "Product", dataIndex: "ProductName", key: "ProductName" },
    { title: "Quantity", dataIndex: "QuantitySold", key: "QuantitySold" },
    { title: "Weight (kg)", dataIndex: "TotalWeightKg", key: "TotalWeightKg" },
    { title: "Price/Kg (₱)", dataIndex: "PricePerKg", key: "PricePerKg" },
    {
      title: "Subtotal (₱)",
      key: "subtotal",
      render: (_: any, record: SaleItem) =>
        `₱${(record.TotalWeightKg * record.PricePerKg).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SaleItem) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            setSalesItems((prev) =>
              prev.filter((item) => item.key !== record.key)
            )
          }
        />
      ),
    },
  ];

  const calculateTotal = () =>
    salesItems.reduce(
      (sum, item) => sum + item.TotalWeightKg * item.PricePerKg,
      0
    );

  const isWeightOnly =
    selectedProduct &&
    selectedProduct.QuantityRemaining === 0 &&
    selectedProduct.WeightRemainingKg > 0;

  return (
    <div className="p-2 sm:p-4">
<Card
  title={
    <Title level={4} style={{ margin: 0 }}>
      Order Information
    </Title>
  }
  style={{ marginBottom: 24 }}
  styles={{ body: { padding: screens.xs ? "8px" : "16px" } }} // ✅ updated
>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        ></Form>

        <Form form={form} layout="vertical" onFinish={onFinish}>
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
  disabled={salesItems.length > 0}
  options={customers.map((c) => ({
    value: c.CustomerID,
    label: c.Name,
  }))}
  popupRender={(menu) => (   // ✅ use popupRender instead of dropdownRender
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
                  disabled={salesItems.length > 0}
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
                  disabled={salesItems.length > 0}
                >
                  {paymentMethods.map((m) => (
                    <Option key={m} value={m}>
                      {m}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* --- THIS IS THE CORRECTED PRODUCT DETAILS SECTION --- */}
          <Text strong>Product Details</Text>
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} md={8}>
              <Form.Item
                label="Product"
                name="HarvestProductID"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select product"
                  onChange={handleProductChange}
                  showSearch
                  optionFilterProp="label"
                  options={productOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="Quantity"
                name="QuantitySold"
                rules={[
                  { required: !isWeightOnly, message: "Quantity is required." },
                  { validator: quantityValidator },
                ]}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  disabled={isWeightOnly}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Weight (kg)"
                name="TotalWeightKg"
                rules={[{ required: true, message: "Weight is required." }]}
              >
                <InputNumber min={0.01} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Price per Kg (₱)"
                name="PricePerKg"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
  title={<Title level={5}>Order Items</Title>}
  style={{ marginBottom: 16 }}
  styles={{ body: { padding: screens.xs ? "8px" : "16px" } }} // ✅ updated
>

        <Table
          size={screens.xs ? "small" : "middle"}
          columns={orderItemColumns}
          dataSource={salesItems}
          rowKey="key"
          pagination={false}
          scroll={screens.xs ? { x: true } : undefined}
          footer={() => (
            <div className="text-right pr-4 font-semibold">
              Total: ₱{calculateTotal().toFixed(2)}
            </div>
          )}
        />
      </Card>

      <div
        style={{
          display: "flex",
          flexDirection: screens.xs ? "column" : "row",
          justifyContent: screens.xs ? "stretch" : "flex-end",
          gap: "8px",
          marginTop: "16px",
        }}
      >
        <Button
          type="default"
          onClick={() => form.submit()}
          icon={<PlusOutlined />}
          block={screens.xs}
          style={{
            backgroundColor: "white",
            color: "#333",
            border: "1px solid #d9d9d9",
            boxShadow: "none",
          }}
          className="hover:bg-gray-50"
        >
          Add to Order
        </Button>
        <Button
          type="primary"
          size={screens.xs ? "middle" : "large"}
          onClick={handleSaveSale}
          disabled={salesItems.length === 0}
          loading={isSaving}
          block={screens.xs}
        >
          Save Sale
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
