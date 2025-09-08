import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  Table,
  Space,
  Button,
  Typography,
  Row,
  Col,
  message,
  Modal,
  Tooltip,
} from "antd";
import type { TableProps } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import AddForm from "../Forms_Itemlist/AddForm";
import EditForm from "../Forms_Itemlist/EditForm";
import axios from "axios";

interface Item {
  key: string;
  ItemID: string;
  ItemName: string;
  Category: string;
  Unit: string;
  SupplierID?: string | null;
  TotalQuantityRemaining: number;
}

const { Title } = Typography;

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [units, setUnits] = useState<{ value: string; label: string }[]>([]);

  const api = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVERHOST,
    timeout: 10000,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/items");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      message.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const fetchDropdownData = async () => {
      try {
        const [categoriesRes, unitsRes] = await Promise.all([
          api.get("/api/categories"),
          api.get("/api/units"),
        ]);

        const categoryOptions = (categoriesRes.data || []).map(
          (cat: string) => ({ value: cat, label: cat })
        );
        setCategories(categoryOptions);

        const unitOptions = (unitsRes.data || []).map((unit: string) => ({
          value: unit,
          label: unit,
        }));
        setUnits(unitOptions);
      } catch (error) {
        message.error("Failed to load data for the form.");
      }
    };

    fetchDropdownData();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => {
        if (!item) return false;

        const matchesSearch =
          item.ItemName?.toLowerCase().includes(searchText.toLowerCase()) ??
          false;
        const matchesCategory =
          categoryFilter === "all" ||
          item.Category?.toLowerCase() === categoryFilter.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .map((item, idx) => ({
        ...item,
        key: item.ItemID || item.key || `item-${idx}`,
      }));
  }, [items, searchText, categoryFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleAddSuccess = async () => {
    setIsAddModalVisible(false);
    message.success("Item added successfully");
    await fetchData();
  };

  const handleEdit = async (updatedItem: Item) => {
    const payload = {
      ItemName: updatedItem.ItemName,
      Category: updatedItem.Category,
      Unit: updatedItem.Unit,
    };

    try {
      await api.put(`/api/items/${updatedItem.ItemID}`, payload);
      message.success("Item updated successfully");
      setIsEditModalVisible(false);
      setEditingItem(null);
      await fetchData();
    } catch (error) {
      console.error("Error updating item:", error);
      message.error("Failed to update item");
    }
  };

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    try {
      setIsLoading(true);
      await api.delete(`/api/items/${deletingKey}`);
      message.success("Item archived successfully");
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting item:", error);

      const errorMsg = error.response?.data?.error || "Failed to archive item.";
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
      setIsDeleteModalVisible(false);
      setDeletingKey(null);
    }
  };

  const columns: TableProps<Item>["columns"] = [
    {
      title: "Item Name",
      dataIndex: "ItemName",
      key: "ItemName",
      sorter: (a, b) => a.ItemName.localeCompare(b.ItemName),
    },
    {
      title: "Category",
      dataIndex: "Category",
      key: "Category",
      filters: categories.map((cat) => ({
        text: cat.label,
        value: cat.value,
      })),
      onFilter: (value, record) => record.Category === value,
    },
    {
      title: "Unit",
      dataIndex: "Unit",
      key: "Unit",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() => {
              setEditingItem(record);
              setIsEditModalVisible(true);
            }}
            icon={<EditOutlined />}
          />
          <Tooltip
            title={
              record.TotalQuantityRemaining > 0
                ? "Cannot delete item with remaining stock"
                : "Delete Item"
            }
          >
            <Button
              danger
              disabled={record.TotalQuantityRemaining > 0}
              onClick={() => handleDelete(record.key)}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* Header Section */}
      <Row
        justify="space-between"
        align="middle"
        className="mb-6"
        gutter={[16, 16]}
      >
        <Col xs={24} sm={12}>
          <Title level={4} className="mb-0 text-gray-800">
            Item Management
          </Title>
        </Col>
        <Col xs={24} sm="auto">
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
            block
            style={{
              backgroundColor: "white",
              color: "#333",
              border: "1px solid #d9d9d9",
              boxShadow: "none",
            }}
            className="hover:bg-gray-50"
          >
            Add New Item
          </Button>
        </Col>
      </Row>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search items..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              className="w-full"
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={handleCategoryChange}
              options={[
                { value: "all", label: "All Categories" },
                ...categories,
              ]}
              suffixIcon={<FilterOutlined className="text-gray-400" />}
            />
          </Col>
        </Row>
      </div>

      {/* Table Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={isLoading}
          scroll={{ x: "max-content" }} // Makes table scrollable on small screens
        />
      </div>

      {/* Add Form Modal */}
      <AddForm
        visible={isAddModalVisible}
        onSuccess={handleAddSuccess}
        onCancel={() => setIsAddModalVisible(false)}
        categories={categories}
        units={units}
      />

      {/* Edit Form Modal */}
      {editingItem && (
        <EditForm
          visible={isEditModalVisible}
          onUpdate={handleEdit}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingItem(null);
          }}
          initialValues={editingItem}
          categories={categories}
          units={units}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmLoading={isLoading}
      >
        <p>
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default ItemList;
