import React, { useState, useEffect, useCallback } from "react";
import { Table, Select, Card, Row, Col, Typography, message, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Interfaces ---
interface HarvestedInventoryItem {
  harvestProductID: number;
  harvestDate: string;
  productType: string;
  batchOrigin: string;
  quantityHarvested: number;
  weightHarvestedKg: number;
  quantityRemaining: number;
  weightRemainingKg: number;
}

interface SummaryData {
  totalDressed: number;
  totalLive: number;
  // NOTE: Assuming this covers all non-Dressed/Live products (e.g., Feet, Neck)
  totalByproductWeight: number;
}
interface BatchFilterItem {
  BatchID: number;
  BatchName: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const HarvestedProducts: React.FC = () => {
  const [inventory, setInventory] = useState<HarvestedInventoryItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [filters, setFilters] = useState({
    productType: "All",
    // This MUST be a string to match the Option value="All"
    batchId: "All",
  });
  const [loading, setLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [batches, setBatches] = useState<BatchFilterItem[]>([]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: String(value),
    }));
  };

  useEffect(() => {
    // Fetch data for filter dropdowns on initial load
    const fetchFilterData = async () => {
      try {
        const [typesRes, batchesRes] = await Promise.all([
          // Assuming /api/product-types returns the enum values from cm_harvest_products.ProductType
          api.get("/api/product-types"),
          api.get("/api/batch-list"),
        ]);
        setProductTypes(typesRes.data || []);
        setBatches(batchesRes.data || []);
      } catch (error) {
        message.error("Failed to load filter options.");
      }
    };
    fetchFilterData();
  }, []);

  useEffect(() => {
    // Fetch main table data and summary whenever filters change
    const fetchTableData = async () => {
      setLoading(true);
      try {
        // Construct params: batchId needs to be converted back to string for the API call
        // if it's not "All", or keep "All"
        const apiParams = {
          productType: filters.productType,
          batchId: filters.batchId, // Correctly using 'batchId'
        };
        const [inventoryRes, summaryRes] = await Promise.all([
          api.get("/api/harvested-products", { params: apiParams }),
          api.get("/api/harvested-products/summary", { params: apiParams }),
        ]);

        setInventory(inventoryRes.data || []);
        setSummary(summaryRes.data || null);
      } catch (error) {
        console.error("DEBUG: Error fetching data:", error);
        message.error("Failed to load harvested inventory.");
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [filters]); // Dependency array: re-run when filters change

  // FIX: Safe number formatting function
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "0.00";
    return typeof value === "number" ? value.toFixed(2) : "0.00";
  };

  const columns = [
    {
      title: "Harvest Date",
      dataIndex: "harvestDate", // Correct
      key: "harvestDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a: any, b: any) =>
        dayjs(a.harvestDate).unix() - dayjs(b.harvestDate).unix(),
    },
    {
      title: "Product Type",
      dataIndex: "productType", // Correct
      key: "productType",
      sorter: (a: any, b: any) => a.productType.localeCompare(b.productType),
    },
    {
      title: "Batch Origin",
      dataIndex: "batchOrigin", // Correct
      key: "batchOrigin",
      sorter: (a: any, b: any) => a.batchOrigin.localeCompare(b.batchOrigin),
    },
    {
      title: "Qty Harvested",
      dataIndex: "quantityHarvested", // Correct
      key: "quantityHarvested",
      render: (val: number) => val ?? 0,
    },
    {
      title: "Weight Harvested (kg)",
      dataIndex: "weightHarvestedKg", // Correct
      key: "weightHarvestedKg",
      render: (val: number) => formatNumber(val),
    },
    {
      title: "Qty Remaining",
      dataIndex: "quantityRemaining", // Correct
      key: "quantityRemaining",
      render: (val: number) => val ?? 0,
    },
    {
      title: "Weight Remaining (kg)",
      dataIndex: "weightRemainingKg", // Correct
      key: "weightRemainingKg",
      render: (val: number) => formatNumber(val),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: HarvestedInventoryItem) => {
        const isSoldOut =
          (record.quantityRemaining ?? 0) <= 0 && // Correct
          (record.weightRemainingKg ?? 0) <= 0; // Correct
        return (
          <Tag color={isSoldOut ? "red" : "green"}>
            {isSoldOut ? "Sold Out" : "In Stock"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Filters">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Text>Product Type</Text>
                <Select
                  value={filters.productType}
                  onChange={(value) => handleFilterChange("productType", value)}
                  style={{ width: "100%" }}
                >
                  <Option value="All">All Types</Option>
                  {productTypes.map((pt) => (
                    <Option key={pt} value={pt}>
                      {pt}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <Text>Batch Origin</Text>
                <Select
                  value={filters.batchId}
                  // FIX: Use batchID as string for consistency with filters state and API
                  onChange={(value) => handleFilterChange("batchId", value)}
                  style={{ width: "100%" }}
                >
                  <Option value="All">All Batches</Option>
                  {batches.map((b) => (
                    // FIX: Convert BatchID to string for the Select value
                    <Option key={b.BatchID} value={String(b.BatchID)}>
                      {b.BatchName}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Summary">
            <Row gutter={16}>
              <Col span={8} className="text-center">
                <Text strong>Total Dressed</Text>
                <Title level={3}>
                  {summary?.totalDressed ?? 0}{" "}
                  <span className="text-base font-normal">pcs</span>
                </Title>
              </Col>
              <Col span={8} className="text-center">
                <Text strong>Total Live</Text>
                <Title level={3}>
                  {summary?.totalLive ?? 0}{" "}
                  <span className="text-base font-normal">pcs</span>
                </Title>
              </Col>
              <Col span={8} className="text-center">
                <Text strong>Byproduct Weight</Text>
                <Title level={3}>
                  {/* FIX: Use safe formatting function */}
                  {formatNumber(summary?.totalByproductWeight)}{" "}
                  <span className="text-base font-normal">kg</span>
                </Title>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="Harvested Product Inventory">
        <Table
          columns={columns}
          dataSource={inventory}
          loading={loading}
          rowKey="harvestProductID"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No harvested products found" }}
        />
      </Card>
    </div>
  );
};

export default HarvestedProducts;
