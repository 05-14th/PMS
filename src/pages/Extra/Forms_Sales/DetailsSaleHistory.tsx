// src/pages/Extra/Forms_Sales/DetailsSaleHistory.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  message,
  Spin,
  Tag,
  Button,
  Popconfirm,
  Descriptions,
} from "antd";
import { DeleteOutlined, PrinterOutlined } from "@ant-design/icons";
import axios from "axios";

// Updated interface to match backend response
interface SaleDetailItem {
  saleDetailID: number;
  productType: string;
  quantitySold: number;
  totalWeightKg: number;
  pricePerKg: number;
  harvestDate?: string;
  batchName?: string;
}

interface SaleOrderInfo {
  saleID: number;
  saleDate: string;
  customerName: string;
  totalAmount: number;
  discount: number;
  status: string;
  batchName: string;
  paymentMethod: string;
  notes: string;
}

interface DetailsProps {
  visible: boolean;
  onCancel: () => void;
  saleId: number | null;
  onSaleVoided?: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const DetailsSaleHistory: React.FC<DetailsProps> = ({
  visible,
  onCancel,
  saleId,
  onSaleVoided,
}) => {
  const [details, setDetails] = useState<SaleDetailItem[]>([]);
  const [saleInfo, setSaleInfo] = useState<SaleOrderInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && saleId) {
      fetchSaleDetails();
      fetchSaleInfo();
    }
  }, [visible, saleId]);

  const fetchSaleDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/sales/${saleId}`);
      setDetails(response.data || []);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      message.error("Failed to load sale details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleInfo = async () => {
    try {
      const response = await api.get("/api/sales");
      const allSales = response.data || [];
      const currentSale = allSales.find(
        (sale: SaleOrderInfo) => sale.saleID === saleId
      );
      setSaleInfo(currentSale || null);
    } catch (error) {
      console.error("Error fetching sale info:", error);
    }
  };

  const handleVoidSale = async () => {
    if (!saleId) return;

    try {
      await api.delete(`/api/sales/${saleId}`);
      message.success(
        "Sale voided successfully and products returned to inventory"
      );
      onCancel();
      if (onSaleVoided) {
        onSaleVoided();
      }
    } catch (error: any) {
      console.error("Error voiding sale:", error);
      message.error(error.response?.data?.error || "Failed to void sale.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Format receipt number
  const formatReceiptNumber = (id: number) => {
    return `RCPT-${String(id).padStart(5, "0")}`;
  };

  // Updated columns to show actual product details from DB
  const columns = [
    {
      title: "Product Type",
      dataIndex: "productType",
      key: "productType",
      render: (type: string) => (
        <Tag color={type === "Live" ? "green" : "blue"}>{type}</Tag>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantitySold",
      key: "quantitySold",
      render: (quantity: number) => `${quantity} pcs`,
      align: "center" as const,
    },
    {
      title: "Total Weight (kg)",
      dataIndex: "totalWeightKg",
      key: "totalWeightKg",
      render: (weight: number) => weight?.toFixed(2) || "0.00",
      align: "right" as const,
    },
    {
      title: "Price per Kg (₱)",
      dataIndex: "pricePerKg",
      key: "pricePerKg",
      render: (price: number) => price?.toFixed(2) || "0.00",
      align: "right" as const,
    },
    {
      title: "Line Total (₱)",
      key: "lineTotal",
      render: (record: SaleDetailItem) => {
        const lineTotal =
          (record.totalWeightKg || 0) * (record.pricePerKg || 0);
        return lineTotal.toFixed(2);
      },
      align: "right" as const,
    },
  ];

  // Calculate totals
  const totalAmount = details.reduce((sum, item) => {
    return sum + (item.totalWeightKg || 0) * (item.pricePerKg || 0);
  }, 0);

  const totalWeight = details.reduce((sum, item) => {
    return sum + (item.totalWeightKg || 0);
  }, 0);

  const totalQuantity = details.reduce((sum, item) => {
    return sum + (item.quantitySold || 0);
  }, 0);

  const finalAmount = totalAmount - (saleInfo?.discount || 0);

  return (
    <Modal
      title={
        <div className="flex justify-between items-center">
          <span>
            Sale Receipt - {saleId ? formatReceiptNumber(saleId) : "Loading..."}
          </span>
          <Button icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
            Print
          </Button>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Popconfirm
          key="void"
          title="Are you sure to void this sale?"
          description="This will return all products to inventory and cannot be undone."
          onConfirm={handleVoidSale}
          okText="Yes"
          cancelText="No"
          disabled={saleInfo?.status === "Cancelled"}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={saleInfo?.status === "Cancelled"}
          >
            Void Sale
          </Button>
        </Popconfirm>,
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
      width={900}
      className="receipt-modal"
    >
      <Spin spinning={loading}>
        {/* Sale Information Header */}
        {saleInfo && (
          <Descriptions
            bordered
            size="small"
            column={2}
            className="mb-4 receipt-header"
          >
            <Descriptions.Item label="Receipt Number" span={1}>
              <strong>{formatReceiptNumber(saleInfo.saleID)}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Date" span={1}>
              {new Date(saleInfo.saleDate).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Customer" span={1}>
              {saleInfo.customerName}
            </Descriptions.Item>
            <Descriptions.Item label="Batch" span={1}>
              {saleInfo.batchName}
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag
                color={
                  saleInfo.status === "Fulfilled"
                    ? "green"
                    : saleInfo.status === "Pending"
                      ? "orange"
                      : "red"
                }
              >
                {saleInfo.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method" span={1}>
              {saleInfo.paymentMethod}
            </Descriptions.Item>
            {saleInfo.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {saleInfo.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        {/* Sale Items Table */}
        <Table
          columns={columns}
          dataSource={details}
          rowKey="saleDetailID"
          pagination={false}
          size="middle"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <strong>Totals</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong>{totalWeight.toFixed(2)} kg</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong>{totalQuantity} pcs</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong>₱{totalAmount.toFixed(2)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              {saleInfo && saleInfo.discount > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <strong>Discount</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong style={{ color: "#ff4d4f" }}>
                      -₱{saleInfo.discount.toFixed(2)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>Grand Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong style={{ fontSize: "16px" }}>
                    ₱{finalAmount.toFixed(2)}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        {/* Print Styles */}
        <style>
          {`
            @media print {
              .ant-modal-footer,
              .ant-btn {
                display: none !important;
              }
              .ant-modal {
                top: 0 !important;
                padding: 0 !important;
              }
              .ant-modal-content {
                box-shadow: none !important;
              }
              .receipt-modal .ant-modal-body {
                padding: 10px !important;
              }
              .receipt-header {
                margin-bottom: 10px !important;
              }
            }
          `}
        </style>
      </Spin>
    </Modal>
  );
};

export default DetailsSaleHistory;
