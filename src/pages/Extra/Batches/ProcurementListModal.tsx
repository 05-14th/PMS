// File: src/pages/Extra/Batches/ProcurementListModal.tsx
import React from "react";
import { Modal, Button, Table, Typography } from "antd";
import dayjs from "dayjs"; // Import dayjs for date calculations

const { Title, Paragraph } = Typography;

interface Item {
  itemName: string;
  quantity: number;
  unit: string;
}
interface CategoryPlan {
  category: string;
  items: Item[];
}

// MODIFICATION: The data interface now expects a startDate
interface ProcurementData {
  plan: CategoryPlan[];
  batchName: string;
  batchDuration?: number;
  chickenCount: number;
  startDate: string; // <-- New field
}

const ProcurementListModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data: ProcurementData | null;
}> = ({ visible, onClose, data }) => {
  if (!data) return null;

  const duration = data.batchDuration || 0;

  const handlePrint = () => window.print();

  // Helper function to format date ranges
  const formatDateRange = (startDay: number, endDay: number) => {
    if (!data.startDate) return `Days ${startDay} - ${endDay}`;
    const baseDate = dayjs(data.startDate);
    // Subtract 1 day because dayjs.add() is 0-indexed for the first day
    const phaseStart = baseDate.add(startDay - 1, "day");
    const phaseEnd = baseDate.add(endDay - 1, "day");

    // Check if the dates are in the same year to avoid redundancy
    if (phaseStart.year() === phaseEnd.year()) {
      return `${phaseStart.format("MMM D")} - ${phaseEnd.format("MMM D, YYYY")}`;
    }
    return `${phaseStart.format("MMM D, YYYY")} - ${phaseEnd.format("MMM D, YYYY")}`;
  };

  const baseColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Recommended Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number, record: Item) => `${qty.toFixed(2)} ${record.unit}`,
    },
  ];

  const feedsColumns = [
    ...baseColumns,
    {
      // MODIFICATION: Changed column title
      title: "Intake Period",
      key: "intakePeriod",
      // MODIFICATION: Updated render logic to calculate and format dates
      render: (_: any, record: Item) => {
        const name = record.itemName.toLowerCase();
        if (name.includes("starter")) return formatDateRange(1, 14);
        if (name.includes("grower")) return formatDateRange(15, 21);
        if (name.includes("finisher")) {
          const endDate = Math.round(duration);
          return formatDateRange(22, endDate);
        }
        return "N/A";
      },
    },
    {
      title: "In Sacks (50kg)",
      key: "sacks",
      render: (_: any, record: Item) => {
        if (record.unit === "kg") {
          const sacks = Math.round(record.quantity / 50.0);
          return `${sacks} sacks`;
        }
        return null;
      },
    },
  ];

  return (
    <Modal
      title="Procurement Suggestion"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="print" type="primary" onClick={handlePrint}>
          Print List
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div className="printable-content">
        <Title level={4}>
          Procurement Plan for "{data.batchName}" ({data.chickenCount} chickens)
        </Title>
        <Paragraph type="secondary">
          This plan is based on industry standards for a lifecycle of{" "}
          <strong>{duration.toFixed(0)} days</strong>.
        </Paragraph>

        <div className="space-y-4">
          {data.plan && data.plan.length > 0 ? (
            data.plan.map((categoryPlan) => {
              const columns =
                categoryPlan.category === "Feeds" ? feedsColumns : baseColumns;

              return (
                <div key={categoryPlan.category}>
                  <Title
                    level={5}
                    style={{ marginTop: "16px", marginBottom: "8px" }}
                  >
                    {categoryPlan.category}
                  </Title>
                  <Table
                    columns={columns}
                    dataSource={categoryPlan.items}
                    rowKey="itemName"
                    pagination={false}
                    size="small"
                  />
                </div>
              );
            })
          ) : (
            <Empty description="No procurement suggestions could be generated." />
          )}
        </div>

        <style>{`
            @media print {
                body * { visibility: hidden; }
                .printable-content, .printable-content * { visibility: visible; }
                .printable-content { position: absolute; left: 0; top: 0; width: 100%; }
                .ant-modal-footer, .ant-modal-close { display: none; }
            }
        `}</style>
      </div>
    </Modal>
  );
};

export default ProcurementListModal;
