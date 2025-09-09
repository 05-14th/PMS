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
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { FaEdit, FaTrash } from "react-icons/fa";
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
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const Harvesting: React.FC<HarvestingProps> = ({ batch }) => {
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
        const [customersRes, paymentsRes, productTypesRes, dressedRes] =
          await Promise.all([
            api.get("/api/customers"),
            api.get("/api/payment-methods"),
            api.get("/api/product-types"),
            api.get("/api/sale-products?type=Dressed"),
          ]);
        setCustomers(customersRes.data || []);
        setPaymentMethods(paymentsRes.data || []);
        setProductTypes(productTypesRes.data || []);
        setDressedInventory(dressedRes.data || []);
      } catch (error) {
        message.error("Failed to load necessary form data.");
      }
    };
    fetchInitialData();
    fetchDressedInventory();
    fetchHarvestedProducts();
  }, [batch.batchID]);

  const handlePrimaryHarvestFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      BatchID: batch.batchID,
      HarvestDate: values.HarvestDate.format("YYYY-MM-DD"),
      ProductType: values.ProductType,
      QuantityHarvested: values.QuantityHarvested || 0,
      TotalWeightKg: values.TotalWeightKg,
      SaleDetails: createInstantSale
        ? {
            /* ... */
          }
        : null,
    };
    try {
      await api.post("/api/harvests", payload);
      message.success("Harvest recorded successfully!");
      harvestForm.resetFields();
      setProductType(null);
      setCreateInstantSale(false);
      fetchHarvestedProducts();
    } catch (error) {
      message.error("Failed to record harvest.");
    } finally {
      setLoading(false);
    }
  };

  const handleByproductFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      SourceHarvestProductID: values.SourceHarvestProductID,
      QuantityToProcess: values.QuantityToProcess,
      ByproductType: values.ByproductType,
      ByproductWeightKg: values.ByproductWeightKg,
      BatchID: batch.batchID,
      HarvestDate: values.HarvestDate.format("YYYY-MM-DD"),
    };
    try {
      await api.post("/api/byproducts", payload);
      message.success("Byproduct created successfully!");
      byproductForm.resetFields();
      fetchHarvestedProducts();
      fetchDressedInventory();
    } catch (error: any) {
      message.error(
        error.response?.data?.error || "Failed to create byproduct."
      );
    } finally {
      setLoading(false);
    }
  };
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
      form.setFieldsValue({ createSale: false });
    }
  };

  const fetchDressedInventory = async () => {
    try {
      const dressedRes = await api.get("/api/sale-products?type=Dressed");
      setDressedInventory(dressedRes.data || []);
    } catch (error) {
      message.error("Could not load Dressed chicken inventory.");
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      BatchID: batch.batchID,
      HarvestDate: values.HarvestDate.format("YYYY-MM-DD"),
      ProductType: values.ProductType,
      QuantityHarvested: values.QuantityHarvested || 0,
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
      form.resetFields();
      setProductType(null);
      setCreateInstantSale(false);
      fetchHarvestedProducts();
    } catch (error) {
      message.error("Failed to record harvest.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Harvest Date",
      dataIndex: "HarvestDate",
      key: "HarvestDate",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
    },
    { title: "Product Type", dataIndex: "ProductType", key: "ProductType" },
    {
      title: "Qty Harvested",
      dataIndex: "QuantityHarvested",
      key: "QuantityHarvested",
    },
    // NEW COLUMN
    {
      title: "Weight Harvested (kg)",
      dataIndex: "WeightHarvestedKg",
      key: "WeightHarvestedKg",
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: "Qty Remaining",
      dataIndex: "QuantityRemaining",
      key: "QuantityRemaining",
    },
    // NEW COLUMN
    {
      title: "Weight Remaining (kg)",
      dataIndex: "WeightRemainingKg",
      key: "WeightRemainingKg",
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: HarvestedProduct) => {
        const isSold = record.QuantityRemaining < record.QuantityHarvested;
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
              rules={[{ required: true }]}
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
              rules={[{ required: true, type: "number", min: 1 }]}
            >
              <InputNumber style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item
              name="TotalWeightKg"
              label="Total Weight (kg)"
              rules={[{ required: true, type: "number", min: 0.01 }]}
            >
              <InputNumber style={{ width: "100%" }} placeholder="0.00" />
            </Form.Item>
          </div>

          {/* --- Conditional Checkbox for Live Harvest --- */}
          {productType === "Live" && (
            <Form.Item
              name="createSale"
              valuePropName="checked"
              className="mt-4"
            >
              <Checkbox
                onChange={(e) => setCreateInstantSale(e.target.checked)}
              >
                Create a sale for this live harvest?
              </Checkbox>
            </Form.Item>
          )}

          {/* --- Conditional Section for Instant Sale Details --- */}
          {createInstantSale && (
            <>
              <Divider>Instant Sale Details</Divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item
                  name="CustomerID"
                  label="Customer"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select customer"
                    showSearch
                    optionFilterProp="children"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={() => setIsAddCustomerModalVisible(true)}
                          style={{ width: "100%" }}
                        >
                          Add New Customer
                        </Button>
                      </>
                    )}
                  >
                    {customers.map((c) => (
                      <Option key={c.CustomerID} value={c.CustomerID}>
                        {c.Name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="PricePerKg"
                  label="Price Per Kg (₱)"
                  rules={[{ required: true, type: "number", min: 0 }]}
                >
                  <InputNumber style={{ width: "100%" }} placeholder="180" />
                </Form.Item>
                <Form.Item
                  name="PaymentMethod"
                  label="Payment Method"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select payment method">
                    {paymentMethods.map((pm) => (
                      <Option key={pm} value={pm}>
                        {pm}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </>
          )}

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              {createInstantSale
                ? "Add Harvest & Create Sale"
                : "Add Harvest to Inventory"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <h2 className="text-xl font-semibold m-0">
            2. Create Byproducts (from Dressed Inventory)
          </h2>
        }
      >
        <Form
          form={byproductForm}
          layout="vertical"
          onFinish={handleByproductFinish}
          initialValues={{ HarvestDate: dayjs() }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="SourceHarvestProductID"
              label="Source Dressed Chicken"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select a batch of Dressed chicken"
                onChange={(value) =>
                  setSelectedDressedProduct(
                    dressedInventory.find(
                      (p) => p.HarvestProductID === value
                    ) || null
                  )
                }
              >
                {dressedInventory.map((p) => (
                  <Option key={p.HarvestProductID} value={p.HarvestProductID}>
                    Harvested on {dayjs(p.HarvestDate).format("MMM D")} (
                    {p.QuantityRemaining} pcs remaining)
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="QuantityToProcess"
              label="Quantity to Process"
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      !selectedDressedProduct ||
                      value <= selectedDressedProduct.QuantityRemaining
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        `Max available is ${selectedDressedProduct.QuantityRemaining} pcs`
                      )
                    );
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: "100%" }} placeholder="0" min={1} />
            </Form.Item>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Byproduct Type
                </label>
                <Tooltip title="Manage Product Types">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<SettingOutlined />}
                    onClick={() => setIsManageTypesModalVisible(true)}
                  />
                </Tooltip>
              </div>
              <Form.Item
                name="ByproductType"
                noStyle
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select byproduct type"
                  dropdownRender={(menu) => (
                    <>
                      {" "}
                      {menu} <Divider style={{ margin: "8px 0" }} />{" "}
                      <Space style={{ padding: "0 8px 4px" }}>
                        {" "}
                        <Input
                          placeholder="Add new type"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                        />{" "}
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={handleAddNewType}
                        >
                          Add
                        </Button>{" "}
                      </Space>{" "}
                    </>
                  )}
                >
                  {byproductTypeOptions.map((pt) => (
                    <Option key={pt} value={pt}>
                      {pt}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <Form.Item
              name="ByproductWeightKg"
              label="Byproduct Weight (kg)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="0.00"
                min={0.01}
              />
            </Form.Item>
            <Form.Item
              name="HarvestDate"
              label="Processing Date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Create Byproduct
            </Button>
          </Form.Item>
        </Form>
      </Card>

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
        }}
      />

      <ManageProductTypesModal
        visible={isManageTypesModalVisible}
        productTypes={productTypes}
        onClose={() => setIsManageTypesModalVisible(false)}
        onUpdate={fetchProductTypes}
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
