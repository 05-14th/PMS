// File: src/pages/Extra/Batches/ProcurementListModal.tsx
import React from "react";
import { Modal, Button, Table, Typography, Card } from "antd";

const { Title, Text, Paragraph } = Typography;

interface Item {
  itemName: string;
  quantity: number;
}
interface Phase {
  phase: string;
  items: Item[];
}
interface ProcurementData {
  plan: Phase[];
  batchName: string;
  averageDuration: number;
}

const ProcurementListModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  data: ProcurementData | null;
}> = ({ visible, onClose, data }) => {
  if (!data) return null;

  const columns = [
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    {
      title: "Recommended Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number) => `${qty.toFixed(2)} kg`,
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
        <Title level={4}>Procurement Plan for "{data.batchName}"</Title>
        <Paragraph type="secondary">
          This plan is based on a historical average lifecycle of{" "}
          <strong>{data.averageDuration.toFixed(0)} days</strong> from your
          completed batches.
        </Paragraph>

        <div className="space-y-4">
          {data.plan.map(
            (phase) =>
              phase.items &&
              phase.items.length > 0 && (
                <Card key={phase.phase} type="inner" title={phase.phase}>
                  <Table
                    columns={columns}
                    dataSource={phase.items}
                    rowKey="itemName"
                    pagination={false}
                    size="small"
                  />
                </Card>
              )
          )}
        </div>
        <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .printable-content, .printable-content * { visibility: visible; }
                        .printable-content { position: absolute; left: 0; top: 0; width: 100%; }
                        .ant-modal-footer { display: none; }
                    }
                `}</style>
      </div>
    </Modal>
  );
};

export default ProcurementListModal;
