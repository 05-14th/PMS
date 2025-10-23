import React, { useState, useEffect } from "react";
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Checkbox,
  Button,
  message,
  Table,
  Divider,
  Space,
  Input,
  Tooltip,
  Card,
  Modal,
  Row,
  Col,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { FaEdit, FaTrash, FaMinusCircle } from "react-icons/fa";
import { PlusOutlined, SettingOutlined } from "@ant-design/icons";
import ManageProductTypesModal from "./ManageProductTypesModal";
import EditHarvestForm from "./EditHarvestForm";
import AddCustomerForm from "../Forms_Sales/AddCustomerForm";

const { Option } = Select;

// --- INTERFACES ---
interface Batch {
  batchID: number;
  batchName: string;
}
interface Customer {
  CustomerID: number;
  Name: string;
}
interface HarvestedProduct {
  HarvestProductID: number;
  HarvestDate: string;
  ProductType: string;
  QuantityHarvested: number;
  QuantityRemaining: number;
  WeightHarvestedKg: number;
  WeightRemainingKg: number;
}
interface DressedProduct {
  HarvestProductID: number;
  HarvestDate: string;
  QuantityRemaining: number;
  WeightRemainingKg: number;
}
interface HarvestingProps {
  batch: Batch;
  onDataChange: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const Harvesting: React.FC<HarvestingProps> = ({ batch, onDataChange }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<string | null>(null);
  const [createInstantSale, setCreateInstantSale] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [harvestedProducts, setHarvestedProducts] = useState<
    HarvestedProduct[]
  >([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<HarvestedProduct | null>(
    null
  );
  const [isManageTypesModalVisible, setIsManageTypesModalVisible] =
    useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] =
    useState(false);
  const [dressedInventory, setDressedInventory] = useState<DressedProduct[]>(
    []
  );
  const [selectedDressedProduct, setSelectedDressedProduct] =
    useState<DressedProduct | null>(null);
  const [harvestForm] = Form.useForm();
  const [byproductForm] = Form.useForm();
  const [isProcessingModalVisible, setIsProcessingModalVisible] =
    useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [vitals, setVitals] = useState<BatchVitals | null>(null);

  const fetchHarvestedProducts = async () => {
    try {
      const harvestedRes = await api.get(
        `/api/batches/${batch.batchID}/harvest-products`
      );
      setHarvestedProducts(harvestedRes.data || []);
    } catch (error) {
      console.error("Failed to refresh harvested products list:", error);
    }
  };

  const handleDeleteHarvest = async (harvestProductID: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this harvest record? This will return the chickens to the batch count."
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/harvest-products/${harvestProductID}`);
      message.success("Harvest record deleted successfully.");
      fetchHarvestedProducts(); // Refresh the table
      onDataChange();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || "Failed to delete harvest record.";
      message.error(errorMsg);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const productTypesRes = await api.get("/api/product-types");
      setProductTypes(productTypesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch product types", error);
      message.error("Could not load product types.");
    }
  };

  const fetchCustomers = async () => {
    try {
      const customersRes = await api.get("/api/customers");
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      message.error("Could not load customer list.");
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          customersRes,
          paymentsRes,
          productTypesRes,
          dressedRes,
          vitalsRes,
        ] = await Promise.all([
          api.get("/api/customers"),
          api.get("/api/payment-methods"),
          api.get("/api/product-types"),
          api.get("/api/sales/products?type=Dressed"),
          api.get(`/api/batches/${batch.batchID}/vitals`),
        ]);
        setCustomers(customersRes.data || []);
        setPaymentMethods(paymentsRes.data || []);
        setProductTypes(productTypesRes.data || []);
        setDressedInventory(dressedRes.data || []);
        setVitals(vitalsRes.data || null);
      } catch (error) {
        message.error("Failed to load necessary form data.");
      }
    };
    fetchInitialData();
    fetchHarvestedProducts();
  }, [batch.batchID]);

  const handlePrimaryHarvestFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      BatchID: batch.batchID,
      HarvestDate: values.HarvestDate.format("YYYY-MM-DD"),
      ProductType: values.ProductType,
      QuantityHarvested: values.QuantityHarvested,
      TotalWeightKg: values.TotalWeightKg,
      SaleDetails: createInstantSale
        ? {
            CustomerID: values.CustomerID,
            PricePerKg: values.PricePerKg,
            PaymentMethod: values.PaymentMethod,
          }
        : null,
    };
    try {
      await api.post("/api/harvests", payload);
      message.success("Harvest recorded successfully!");
      harvestForm.resetFields();
      harvestForm.setFieldsValue({ HarvestDate: dayjs() });
      setProductType(null);
      setCreateInstantSale(false);
      fetchHarvestedProducts();
      fetchDressedInventory();
      onDataChange();
    } catch (error) {
      message.error("Failed to record harvest.");
    } finally {
      setLoading(false);
    }
  };

  /*const handleByproductFinish = async (values: any) => {
        setLoading(true);
        const payload = {
            SourceHarvestProductID: values.SourceHarvestProductID,
            QuantityToProcess: values.QuantityToProcess,
            ByproductType: values.ByproductType,
            ByproductWeightKg: values.ByproductWeightKg,
            BatchID: batch.batchID,
            HarvestDate: values.HarvestDate.format('YYYY-MM-DD'),
        };
        try {
            await api.post('/api/byproducts', payload);
            message.success('Byproduct created successfully!');
            byproductForm.resetFields();
            fetchHarvestedProducts();
            fetchDressedInventory();
        } catch (error: any) {
            message.error(
                error.response?.data?.error || 'Failed to create byproduct.'
            );
        } finally {
            setLoading(false);
        }
    };*/

  const handleCreateCustomer = async (values: any) => {
    try {
      const response = await api.post("/api/customers", values);
      const newCustomerId = response.data.insertedId;

      message.success("Customer added successfully!");
      setIsAddCustomerModalVisible(false); // Close the modal

      await fetchCustomers(); // Refresh the customer list

      // Automatically select the new customer in the form
      form.setFieldsValue({ CustomerID: newCustomerId });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to add customer.";
      message.error(errorMsg);
      // Re-throw error to keep the modal open on failure
      throw new Error(errorMsg);
    }
  };

  const handleAddNewType = async () => {
    if (newTypeName.trim() === "") {
      message.warning("Please enter a name for the new product type.");
      return;
    }
    try {
      await api.post("/api/product-types", { newType: newTypeName });
      message.success(`Product type "${newTypeName}" added successfully.`);
      setNewTypeName("");
      await fetchProductTypes(); // Refresh the list
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to add new type.";
      message.error(errorMsg);
    }
  };

  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    if (value !== "Live") {
      setCreateInstantSale(false);
      harvestForm.setFieldsValue({ createSale: false });
    }
  };
  const fetchDressedInventory = async () => {
    try {
      const dressedRes = await api.get("/api/sales/products?type=Dressed");
      setDressedInventory(dressedRes.data || []);
    } catch (error) {
      message.error("Could not load Dressed chicken inventory.");
    }
  };

  const handleProcessFinish = async (values: any) => {
    if (!values.yields || values.yields.length === 0) {
      message.error("Please add at least one byproduct yield.");
      return;
    }
    setProcessingLoading(true);
    const payload = {
      SourceHarvestProductID: values.SourceHarvestProductID,
      QuantityToProcess: values.QuantityToProcess,
      BatchID: batch.batchID,
      ProcessingDate: values.ProcessingDate.format("YYYY-MM-DD"),
      Yields: values.yields,
    };
    try {
      await api.post("/api/byproducts", payload);
      message.success("Byproducts created successfully!");
      setIsProcessingModalVisible(false);
      byproductForm.resetFields();
      fetchHarvestedProducts();
      fetchDressedInventory();
      onDataChange();
    } catch (error: any) {
      message.error(
        error.response?.data?.error || "Failed to create byproducts."
      );
    } finally {
      setProcessingLoading(false);
    }
  };

  const columns = [
    {
      title: "Harvest Date",
      dataIndex: "harvestDate",
      key: "HarvestDate",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
    },
    { title: "Product Type", dataIndex: "ProductType", key: "ProductType" },
    {
      title: "Qty Harvested",
      dataIndex: "quantityHarvested",
      key: "QuantityHarvested",
    },
    {
      title: "Weight Harvested (kg)",
      dataIndex: "weightHarvestedKg",
      key: "WeightHarvestedKg",
      render: (weight: number) =>
        typeof weight === "number" ? weight.toFixed(2) : "0.00",
    },
    {
      title: "Qty Remaining",
      dataIndex: "quantityRemaining",
      key: "QuantityRemaining",
    },
    {
      title: "Weight Remaining (kg)",
      dataIndex: "weightRemainingKg",
      key: "WeightRemainingKg",
      render: (weight: number) =>
        typeof weight === "number" ? weight.toFixed(2) : "0.00",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: HarvestedProduct) => {
        const isSold =
          record.QuantityRemaining < record.QuantityHarvested ||
          record.WeightRemainingKg < record.WeightHarvestedKg;

        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (!isSold) {
                  setEditingHarvest(record);
                  setIsEditModalVisible(true);
                }
              }}
              className={
                isSold
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-900"
              }
              title={isSold ? "Cannot edit a sold product" : "Edit Harvest"}
              disabled={isSold}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => {
                if (!isSold) {
                  handleDeleteHarvest(record.HarvestProductID);
                }
              }}
              className={
                isSold
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-600 hover:text-red-900"
              }
              title={isSold ? "Cannot delete a sold product" : "Delete Harvest"}
              disabled={isSold}
            >
              <FaTrash />
            </button>
          </div>
        );
      },
    },
  ];

  const byproductTypeOptions = productTypes.filter(
    (pt) => pt !== "Live" && pt !== "Dressed"
  );

  return (
    <div className="space-y-8">
      <Card
        title={
          <h2 className="text-xl font-semibold m-0">
            1. Primary Harvest (from Live Batch)
          </h2>
        }
      >
        <Form
          form={harvestForm}
          layout="vertical"
          onFinish={handlePrimaryHarvestFinish}
          initialValues={{ HarvestDate: dayjs() }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="ProductType"
              label="Product Type"
              rules={[
                {
                  required: true,
                  message: "Please select a product type!",
                },
              ]}
            >
              <Select
                placeholder="Select product type"
                onChange={handleProductTypeChange}
              >
                <Option value="Live">Live</Option>
                <Option value="Dressed">Dressed</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="HarvestDate"
              label="Harvest Date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="QuantityHarvested"
              label="Quantity Harvested"
              rules={[
                {
                  required: true,
                  message: "Please input a quantity.",
                },
                {
                  type: "integer",
                  message: "Quantity must be a whole number.",
                },
                () => ({
                  validator(_, value) {
                    if (
                      !value ||
                      !vitals ||
                      value <= vitals.currentPopulation
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        `Cannot harvest more than the current population of ${vitals.currentPopulation}`
                      )
                    );
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="0"
                min={1}
                precision={0}
              />
            </Form.Item>
            <Form.Item
              name="TotalWeightKg"
              label="Total Weight (kg)"
              rules={[
                {
                  required: true,
                  message: "Please enter the total weight!",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="0.00"
                min={0.01}
              />
            </Form.Item>
          </div>
          {productType === "Live" && (
            <Form.Item
              name="createSale"
              valuePropName="checked"
              className="mt-4"
            >
              {" "}
              <Checkbox
                onChange={(e) => setCreateInstantSale(e.target.checked)}
              >
                {" "}
                Create a sale for this live harvest?{" "}
              </Checkbox>{" "}
            </Form.Item>
          )}
          {createInstantSale && (
            <>
              {" "}
              <Divider>Instant Sale Details</Divider>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {" "}
                <Form.Item
                  name="CustomerID"
                  label="Customer"
                  rules={[{ required: true }]}
                >
                  {" "}
                  <Select
                    placeholder="Select customer"
                    showSearch
                    optionFilterProp="children"
                    dropdownRender={(menu) => (
                      <>
                        {" "}
                        {menu} <Divider style={{ margin: "8px 0" }} />{" "}
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddCustomerModalVisible(true)}
                          style={{ width: "100%" }}
                        >
                          {" "}
                          Add New Customer{" "}
                        </Button>{" "}
                      </>
                    )}
                  >
                    {" "}
                    {customers.map((c) => (
                      <Option key={c.CustomerID} value={c.CustomerID}>
                        {" "}
                        {c.Name}{" "}
                      </Option>
                    ))}{" "}
                  </Select>{" "}
                </Form.Item>{" "}
                <Form.Item
                  name="PricePerKg"
                  label="Price Per Kg (₱)"
                  rules={[
                    {
                      required: true,
                      type: "number",
                      min: 0,
                    },
                  ]}
                >
                  {" "}
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="180"
                  />{" "}
                </Form.Item>{" "}
                <Form.Item
                  name="PaymentMethod"
                  label="Payment Method"
                  rules={[{ required: true }]}
                >
                  {" "}
                  <Select placeholder="Select payment method">
                    {" "}
                    {paymentMethods.map((pm) => (
                      <Option key={pm} value={pm}>
                        {" "}
                        {pm}{" "}
                      </Option>
                    ))}{" "}
                  </Select>{" "}
                </Form.Item>{" "}
              </div>{" "}
            </>
          )}
          <Form.Item className="mt-6">
            {" "}
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              {" "}
              {createInstantSale
                ? "Add Harvest & Create Sale"
                : "Add Harvest to Inventory"}{" "}
            </Button>{" "}
          </Form.Item>
        </Form>
      </Card>

      <div className="text-center">
        <Button onClick={() => setIsProcessingModalVisible(true)} size="large">
          + Process Dressed Inventory to Create Byproducts
        </Button>
      </div>

      {/* --- BYPRODUCTS MODAL --- */}
      <Modal
        title="Create Byproducts from Dressed Inventory"
        open={isProcessingModalVisible}
        onCancel={() => setIsProcessingModalVisible(false)}
        width={800}
        destroyOnClose
        footer={[
          <Button key="back" onClick={() => setIsProcessingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={processingLoading}
            onClick={() => byproductForm.submit()}
          >
            Confirm Processing
          </Button>,
        ]}
      >
        <Form
          form={byproductForm}
          layout="vertical"
          onFinish={handleProcessFinish}
          initialValues={{ ProcessingDate: dayjs(), yields: [{}] }}
        >
          <Card title="Source" type="inner" className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="SourceHarvestProductID"
                  label="Source Dressed Chicken"
                  rules={[
                    { required: true, message: "Please select a source!" },
                  ]}
                >
                  <Select
                    placeholder="Select a batch of Dressed chicken"
                    onChange={() =>
                      byproductForm.validateFields(["QuantityToProcess"])
                    }
                  >
                    {dressedInventory.map((p) => (
                      <Option
                        key={p.HarvestProductID}
                        value={p.HarvestProductID}
                      >
                        Harvested on {dayjs(p.HarvestDate).format("MMM D")} (
                        {p.QuantityRemaining} pcs remaining)
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="QuantityToProcess"
                  label="Quantity to Process"
                  dependencies={["SourceHarvestProductID"]}
                  rules={[
                    { required: true, message: "Please enter a quantity!" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const sourceId = getFieldValue(
                          "SourceHarvestProductID"
                        );
                        if (!sourceId || !value) return Promise.resolve();
                        const selectedProduct = dressedInventory.find(
                          (p) => p.HarvestProductID === sourceId
                        );
                        if (
                          selectedProduct &&
                          value > selectedProduct.QuantityRemaining
                        ) {
                          return Promise.reject(
                            new Error(
                              `Max available is ${selectedProduct.QuantityRemaining} pcs`
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="0"
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="ProcessingDate"
              label="Processing Date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Card>

          <Card
            title="Yield (Resulting Byproducts)"
            type="inner"
            extra={
              <Button
                type="link"
                icon={<SettingOutlined />}
                onClick={() => setIsManageTypesModalVisible(true)}
              >
                Manage Types
              </Button>
            }
          >
            <Form.List name="yields">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space
                      key={field.key}
                      style={{ display: "flex", marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "ByproductType"]}
                        rules={[
                          { required: true, message: "Type is required" },
                        ]}
                      >
                        <Select
                          placeholder="Byproduct Type"
                          style={{ width: 250 }}
                        >
                          {productTypes
                            .filter((pt) => pt !== "Live" && pt !== "Dressed")
                            .map((pt) => (
                              <Option key={pt} value={pt}>
                                {pt}
                              </Option>
                            ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "ByproductWeightKg"]}
                        rules={[
                          { required: true, message: "Weight is required" },
                        ]}
                      >
                        <InputNumber placeholder="Weight (kg)" min={0.01} />
                      </Form.Item>

                      <FaMinusCircle
                        className="cursor-pointer text-red-500"
                        onClick={() => remove(field.name)}
                      />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Byproduct Yield
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>

      <Divider />
      <h2 className="text-xl font-semibold">
        Harvested Products (From This Batch)
      </h2>
      <Table
        columns={columns}
        dataSource={harvestedProducts}
        rowKey="HarvestProductID"
        pagination={false}
      />

      <EditHarvestForm
        visible={isEditModalVisible}
        initialValues={editingHarvest}
        productTypes={productTypes}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingHarvest(null);
        }}
        onSubmit={() => {
          setIsEditModalVisible(false);
          setEditingHarvest(null);
          fetchHarvestedProducts();
          onDataChange();
        }}
      />

      <ManageProductTypesModal
        visible={isManageTypesModalVisible}
        productTypes={productTypes}
        onClose={() => setIsManageTypesModalVisible(false)}
        onUpdate={fetchProductTypes}
        zIndex={1010}
      />

      <AddCustomerForm
        visible={isAddCustomerModalVisible}
        onCreate={handleCreateCustomer}
        onCancel={() => setIsAddCustomerModalVisible(false)}
      />
    </div>
  );
};

export default Harvesting;
