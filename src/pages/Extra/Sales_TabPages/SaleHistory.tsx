// src/pages/Extra/Sales_TabPages/SaleHistory.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  DatePicker,
  Card,
  Typography,
  message,
  Space,
  Modal,
  Grid,
  Tag,
  Popconfirm,
} from "antd";
import { SearchOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import axios from "axios";
import DetailsSaleHistory from "../Forms_Sales/DetailsSaleHistory";
import FulfillmentModal from "../Forms_Sales/FulfillmentModal";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// UPDATED: Interface now includes status, batchName, and discount
interface SaleHistoryRecord {
  saleID: number;
  saleDate: string;
  customerName: string;
  totalAmount: number;
  status: "Pending" | "Fulfilled" | "Cancelled";
  batchName: string;
  discount: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const SaleHistory: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SaleHistoryRecord[]>([]);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [viewingSaleId, setViewingSaleId] = useState<number | null>(null);

  // State for the fulfillment modal
  const [isFulfillModalVisible, setIsFulfillModalVisible] = useState(false);
  const [fulfillingSale, setFulfillingSale] =
    useState<SaleHistoryRecord | null>(null);

  const screens = useBreakpoint();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/sales");
      setData(response.data || []);
    } catch (error) {
      message.error("Failed to load sales history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearFilters = () => {
    setSearchText("");
    setDates([null, null]);
  };

  const handleViewDetails = (record: SaleHistoryRecord) => {
    setViewingSaleId(record.saleID);
    setIsDetailsModalVisible(true);
  };

  // Handlers for the fulfillment flow
  const handleOpenFulfillModal = (record: SaleHistoryRecord) => {
    setFulfillingSale(record);
    setIsFulfillModalVisible(true);
  };

  const handleFulfillmentSuccess = () => {
    setIsFulfillModalVisible(false);
    setFulfillingSale(null);
    message.success("Order has been successfully fulfilled!");
    fetchData(); // Refresh the list to show the updated status
  };

  // NEW: Handler for voiding sales
  const handleVoidSale = async (saleId: number) => {
    try {
      await api.delete(`/api/sales/${saleId}`);
      message.success(
        "Sale voided successfully and products returned to inventory"
      );
      fetchData(); // Refresh the data
    } catch (error: any) {
      console.error("Error voiding sale:", error);
      message.error(error.response?.data?.error || "Failed to void sale.");
    }
  };

  const filteredData = data.filter((item) => {
    // --- FIX: Added a check for item.customerName to prevent crash ---
    const matchesSearch = (item.customerName || "")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesDateRange =
      !dates[0] ||
      !dates[1] ||
      (dayjs(item.saleDate).isAfter(dates[0].startOf("day")) &&
        dayjs(item.saleDate).isBefore(dates[1].endOf("day")));

    return matchesSearch && matchesDateRange;
  });

  const columns: ColumnsType<SaleHistoryRecord> = [
    {
      title: "Receipt #",
      dataIndex: "saleID",
      key: "saleID",
      render: (id: number) => `RCPT-${String(id).padStart(5, "0")}`,
    },
    {
      title: "Date Ordered",
      dataIndex: "saleDate",
      key: "saleDate",
      render: (dateTime: string) => dayjs(dateTime).format("MMM D, YYYY"),
      sorter: (a, b) => dayjs(a.saleDate).unix() - dayjs(b.saleDate).unix(),
    },
    // --- NEW: Status Column ---
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "geekblue";
        if (status === "Fulfilled") color = "green";
        if (status === "Cancelled") color = "volcano";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: "Pending", value: "Pending" },
        { text: "Fulfilled", value: "Fulfilled" },
        { text: "Cancelled", value: "Cancelled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    { title: "Customer Name", dataIndex: "customerName", key: "customerName" },
    { title: "Batch", dataIndex: "batchName", key: "batchName" },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (total: number) => `₱${total.toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: SaleHistoryRecord) => (
        <Space size={screens.xs ? 4 : 8}>
          {/* --- UPDATED: Conditional Actions based on status --- */}
          {record.status === "Pending" && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleOpenFulfillModal(record)}
              >
                Fulfill
              </Button>
              <Popconfirm
                title="Are you sure to void this sale?"
                description="This will cancel the pending order and cannot be undone."
                onConfirm={() => handleVoidSale(record.saleID)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  Void
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === "Fulfilled" && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              >
                Details
              </Button>
              <Popconfirm
                title="Are you sure to void this sale?"
                description="This will return products to inventory and cannot be undone."
                onConfirm={() => handleVoidSale(record.saleID)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  Void
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === "Cancelled" && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              Details
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4">
      <Card>
        <Title level={4} className="m-0 mb-6">
          Sales History
        </Title>

        <div
          className={`flex ${screens.xs ? "flex-col gap-2" : "flex-row gap-4"} mb-6`}
        >
          <Input
            placeholder="Search by customer name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={screens.xs ? "w-full" : "w-96"}
          />
          <div
            className={`flex ${screens.xs ? "flex-col gap-2" : "flex-row gap-2"}`}
          >
            <RangePicker
              onChange={setDates}
              value={dates}
              style={{ width: screens.xs ? "100%" : undefined }}
            />
            <Button onClick={handleClearFilters} block={screens.xs}>
              Clear
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="saleID"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size={screens.xs ? "small" : "middle"}
          scroll={screens.xs ? { x: true } : undefined}
        />
      </Card>

      <DetailsSaleHistory
        visible={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        saleId={viewingSaleId}
        onSaleVoided={fetchData} // Refresh the table when a sale is voided from details
      />

      {/* --- NEW: Render the Fulfillment Modal when needed --- */}
      {fulfillingSale && (
        <FulfillmentModal
          visible={isFulfillModalVisible}
          onCancel={() => setIsFulfillModalVisible(false)}
          saleOrder={fulfillingSale}
          onSuccess={handleFulfillmentSuccess}
        />
      )}
    </div>
  );
};

export default SaleHistory;
