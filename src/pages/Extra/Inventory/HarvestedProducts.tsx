import React, { useState, useEffect } from "react";
import { Table, Select, Card, Row, Col, Typography, message, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Interfaces ---
interface HarvestedInventoryItem {
  HarvestProductID: number;
  HarvestDate: string;
  ProductType: string;
  BatchOrigin: string;
  QuantityHarvested: number;
  WeightHarvestedKg: number;
  QuantityRemaining: number;
  WeightRemainingKg: number;
}
interface SummaryData {
  totalDressed: number;
  totalLive: number;
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
    batchId: "All",
  });
  const [loading, setLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [batches, setBatches] = useState<BatchFilterItem[]>([]);

  useEffect(() => {
    // Fetch data for filter dropdowns on initial load
    const fetchFilterData = async () => {
      try {
        const [typesRes, batchesRes] = await Promise.all([
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
        console.log("DEBUG: Fetching data with filters:", filters);

        const [inventoryRes, summaryRes] = await Promise.all([
          api.get("/api/harvested-products", { params: filters }),
          api.get("/api/harvested-products/summary", { params: filters }),
        ]);

        console.log("DEBUG: Raw inventory response:", inventoryRes);
        console.log("DEBUG: Inventory data:", inventoryRes.data);
        console.log("DEBUG: Raw summary response:", summaryRes);
        console.log("DEBUG: Summary data:", summaryRes.data);

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
  }, [filters]);

  // FIX: Safe number formatting function
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "0.00";
    return typeof value === "number" ? value.toFixed(2) : "0.00";
  };

  const columns = [
    {
      title: "Harvest Date",
      dataIndex: "HarvestDate",
      key: "HarvestDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a: any, b: any) =>
        dayjs(a.HarvestDate).unix() - dayjs(b.HarvestDate).unix(),
    },
    {
      title: "Product Type",
      dataIndex: "ProductType",
      key: "ProductType",
      sorter: (a: any, b: any) => a.ProductType.localeCompare(b.ProductType),
    },
    {
      title: "Batch Origin",
      dataIndex: "BatchOrigin",
      key: "BatchOrigin",
      sorter: (a: any, b: any) => a.BatchOrigin.localeCompare(b.BatchOrigin),
    },
    {
      title: "Qty Harvested",
      dataIndex: "QuantityHarvested",
      key: "QuantityHarvested",
      // FIX: Safe rendering for numbers
      render: (val: number) => val ?? 0,
    },
    {
      title: "Weight Harvested (kg)",
      dataIndex: "WeightHarvestedKg",
      key: "WeightHarvestedKg",
      // FIX: Use safe formatting function
      render: (val: number) => formatNumber(val),
    },
    {
      title: "Qty Remaining",
      dataIndex: "QuantityRemaining",
      key: "QuantityRemaining",
      render: (val: number) => val ?? 0,
    },
    {
      title: "Weight Remaining (kg)",
      dataIndex: "WeightRemainingKg",
      key: "WeightRemainingKg",
      // FIX: Use safe formatting function
      render: (val: number) => formatNumber(val),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: HarvestedInventoryItem) => {
        const isSoldOut =
          (record.QuantityRemaining ?? 0) <= 0 &&
          (record.WeightRemainingKg ?? 0) <= 0;
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
                  onChange={(value) => handleFilterChange("batchId", value)}
                  style={{ width: "100%" }}
                >
                  <Option value="All">All Batches</Option>
                  {batches.map((b) => (
                    <Option key={b.BatchID} value={b.BatchID}>
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
          rowKey="HarvestProductID"
          scroll={{ x: "max-content" }}
          // FIX: Add empty state for when no data
          locale={{ emptyText: "No harvested products found" }}
        />
      </Card>
    </div>
  );
};

export default HarvestedProducts;
