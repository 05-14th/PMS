import React, { useEffect, useState } from "react";
import { Modal, List, Button, message, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

interface ManageProductTypesModalProps {
  visible: boolean;
  productTypes: string[];
  onClose: () => void;
  onUpdate: () => void; // Function to refresh the list in the parent
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const ManageProductTypesModal: React.FC<ManageProductTypesModalProps> = ({
  visible,
  productTypes,
  onClose,
  onUpdate,
  zIndex,
}) => {
  const [usedTypes, setUsedTypes] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      const fetchUsage = async () => {
        try {
          const res = await api.get("/api/product-types/usage");
          setUsedTypes(res.data || []);
        } catch (error) {
          console.error("Failed to fetch product type usage", error);
        }
      };
      fetchUsage();
    }
  }, [visible]);

  const handleDelete = async (typeToDelete: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the type "${typeToDelete}"?`
      )
    ) {
      return;
    }
    try {
      // The body for a DELETE request is passed in the `data` property
      await api.delete("/api/product-types", { data: { typeToDelete } });
      message.success(`"${typeToDelete}" was deleted.`);
      onUpdate(); // Refresh the list in the parent component
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || "Failed to delete product type.";
      message.error(errorMsg);
    }
  };

  // Filter out the core types so they can't be deleted
  const customTypes = productTypes.filter(
    (pt) => pt.toLowerCase() !== "live" && pt.toLowerCase() !== "dressed"
  );

  return (
    <Modal
      title="Manage Product Types"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      zIndex={zIndex} // Apply the zIndex to the modal
    >
      <p className="text-sm text-gray-500 mb-4">
        You can delete custom product types that are not currently in use.
      </p>
      <List
        bordered
        dataSource={customTypes}
        renderItem={(item) => {
          const isInUse = usedTypes.includes(item);
          return (
            <List.Item
              actions={[
                <Tooltip
                  title={
                    isInUse ? "Cannot delete a type that is in use" : "Delete"
                  }
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item)}
                    disabled={isInUse}
                  />
                </Tooltip>,
              ]}
            >
              {item}
            </List.Item>
          );
        }}
      />
    </Modal>
  );
};
export default ManageProductTypesModal;
