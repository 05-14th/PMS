// File: src/pages/Extra/Batches/ProcurementListModal.tsx
import React from "react";
import { Modal, Button, Table, Typography, Card, Empty } from "antd";

const { Title, Text, Paragraph } = Typography;

interface Item {
  itemName: string;
  quantity: number;
  unit: string;
}
interface CategoryPlan {
  category: string;
  items: Item[];
}
interface ProcurementData {
  plan: CategoryPlan[];
  batchName: string;
  averageDuration: number;
  chickenCount: number;
}

const ProcurementListModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data: ProcurementData | null;
}> = ({ visible, onClose, data }) => {
  if (!data) return null;

  const columns = [
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

  const handlePrint = () => window.print();

  return (
    <Modal
      title="Procurement Suggestion"
      open={visible}
      onCancel={onClose}
      width={700}
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
        {/* --- MODIFIED TITLE: Now correctly displays the chicken count --- */}
        <Title level={4}>
          Procurement Plan for "{data.batchName}" ({data.chickenCount} chickens)
        </Title>
        <Paragraph type="secondary">
          This plan is based on industry standards and a historical average
          lifecycle of <strong>{data.averageDuration.toFixed(0)} days</strong>{" "}
          from your completed batches.
        </Paragraph>

        <div className="space-y-4">
          {data.plan && data.plan.length > 0 ? (
            data.plan.map((categoryPlan) => (
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
            ))
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
