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
  Tag,
} from "antd";
import type { TableProps } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import AddForm from "../Forms_Itemlist/AddForm";
import EditForm from "../Forms_Itemlist/EditForm";
import axios from "axios";

// Define the structure for an item
interface Item {
  key: string;
  ItemID: string;
  ItemName: string;
  Category: string;
  SubCategory?: string;
  Unit: string;
  TotalQuantityRemaining: number;
}

// Define the structure for dropdown options
interface SelectOption {
  value: string;
  label: string;
}

const { Title } = Typography;

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for all dropdown data
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [units, setUnits] = useState<SelectOption[]>([]);
  const [subCategories, setSubCategories] = useState<SelectOption[]>([]);

  // Effect to load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch all required data in parallel for efficiency
        const [itemsRes, categoriesRes, unitsRes, subCategoriesRes] =
          await Promise.all([
            api.get("/api/items"),
            api.get("/api/categories"),
            api.get("/api/units"),
            api.get("/api/subcategories"),
          ]);

        setItems(
          itemsRes.data.map((item: any) => ({ ...item, key: item.ItemID }))
        );

        // Map the string arrays from the API to the { value, label } structure
        setCategories(
          (categoriesRes.data || []).map((cat: string) => ({
            value: cat,
            label: cat,
          }))
        );
        setUnits(
          (unitsRes.data || []).map((unit: string) => ({
            value: unit,
            label: unit,
          }))
        );
        setSubCategories(
          (subCategoriesRes.data || []).map((sc: string) => ({
            value: sc,
            label: sc,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load necessary data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  const handleSuccess = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setEditingItem(null);
    message.success("Operation successful!");
    // Re-fetch data to show the latest changes
    const loadItems = async () => {
      const itemsRes = await api.get("/api/items");
      setItems(
        itemsRes.data.map((item: any) => ({ ...item, key: item.ItemID }))
      );
    };
    loadItems();
  };

  const handleEdit = async (updatedItem: Item) => {
    // --- FIX: Create a new payload object without the 'key' property ---
    const { key, ...payload } = updatedItem;

    try {
      // Send the cleaned payload to the API
      await api.put(`/api/items/${payload.ItemID}`, payload);
      handleSuccess();
    } catch (error: any) {
      console.error("Error updating item:", error);
      const errorMsg = error.response?.data?.error || "Failed to update item.";
      message.error(errorMsg);
    }
  };

  const handleDelete = (item: Item) => {
    Modal.confirm({
      title: "Confirm Archive",
      content: `Are you sure you want to archive "${item.ItemName}"? This can only be done if there is no remaining stock.`,
      okText: "Yes, Archive",
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(`/api/items/${item.ItemID}`);
          message.success("Item archived successfully.");
          // Re-fetch data to show the latest changes
          const loadItems = async () => {
            const itemsRes = await api.get("/api/items");
            setItems(itemsRes.data.map((i: any) => ({ ...i, key: i.ItemID })));
          };
          loadItems();
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.error || "Failed to archive item.";
          message.error(errorMsg);
        }
      },
    });
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.ItemName.toLowerCase().includes(
        searchText.toLowerCase()
      );
      const matchesCategory =
        categoryFilter === "all" || item.Category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchText, categoryFilter]);

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
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "SubCategory",
      dataIndex: "SubCategory",
      key: "SubCategory",
      render: (sub?: string) =>
        sub ? (
          <Tag>{sub}</Tag>
        ) : (
          <Typography.Text type="secondary">N/A</Typography.Text>
        ),
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
                ? "Cannot archive item with stock"
                : "Archive Item"
            }
          >
            <Button
              danger
              disabled={record.TotalQuantityRemaining > 0}
              onClick={() => handleDelete(record)}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <Title level={4} className="mb-0">
            Item Management
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            Add New Item
          </Button>
        </Col>
      </Row>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search items..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              className="w-full"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "All Categories" },
                ...categories,
              ]}
            />
          </Col>
        </Row>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={isLoading}
        />
      </div>

      <AddForm
        visible={isAddModalVisible}
        onSuccess={handleSuccess}
        onCancel={() => setIsAddModalVisible(false)}
        categories={categories}
        units={units}
        subCategories={subCategories}
      />

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
          subCategories={subCategories}
        />
      )}
    </div>
  );
};

export default ItemList;
