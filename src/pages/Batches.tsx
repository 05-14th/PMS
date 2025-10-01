import React, { useState, useEffect } from "react";
import MainBody from "../components/MainBody";
import {
  FaEdit,
  FaTrash,
  FaStickyNote,
  FaInfoCircle,
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import ModalNotes from "./Extra/Batches/Modal_Notes";
import Detail from "./Extra/Batches/Detail";
import AddBatchForm from "./Extra/Batches/AddBatchForm";
import EditBatchForm from "./Extra/Batches/EditBatchForm";
import axios from "axios";
import {
  Button,
  Col,
  Input,
  message,
  Modal,
  Row,
  Select,
  Pagination,
} from "antd";
import dayjs from "dayjs";
import useDebounce from "../hooks/useDebounce";

interface Batch {
  batchID: number;
  batchName: string;
  startDate: string;
  expectedHarvestDate: string;
  totalChicken: number;
  currentChicken: number;
  status: string;
  notes?: {
    String: string;
    Valid: boolean;
  };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const Batches: React.FC = () => {
  const [selectedNote, setSelectedNote] = useState<{
    note: string;
    title: string;
  } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]); // store all data
  const [batches, setBatches] = useState<Batch[]>([]); // paginated data
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // --- Filters and modal ---
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const debouncedSearchText = useDebounce(searchText, 500);

  // --- Pagination state ---
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);

  // Fetch all batches once
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/batches");
      const data = response.data?.data || response.data || [];
      setAllBatches(data);
    } catch (error) {
      message.error("Failed to fetch batches.");
    } finally {
      setLoading(false);
    }
  };

  // Apply search + filter + pagination
  useEffect(() => {
    let filtered = [...allBatches];

    // search filter
    if (debouncedSearchText) {
      filtered = filtered.filter((b) =>
        b.batchName.toLowerCase().includes(debouncedSearchText.toLowerCase())
      );
    }

    // status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    setTotal(filtered.length);

    // pagination slice
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);
    setBatches(paginated);
  }, [allBatches, debouncedSearchText, statusFilter, page, pageSize]);

  // Reset to page 1 on search/filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchText, statusFilter]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleAddBatch = async (values: any) => {
    setIsSaving(true);
    const payload = {
      ...values,
      StartDate: dayjs(values.StartDate).format("YYYY-MM-DD"),
      ExpectedHarvestDate: dayjs(values.ExpectedHarvestDate).format(
        "YYYY-MM-DD"
      ),
      Notes: values.Notes || "",
    };
    try {
      await api.post("/api/batches", payload);
      message.success("Batch created successfully!");
      setIsAddModalVisible(false);
      fetchBatches();
    } catch (error) {
      message.error("Failed to create batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBatch = async (values: any) => {
    if (!editingBatch) return;
    setIsSaving(true);
    const payload = {
      ...values,
      ExpectedHarvestDate: dayjs(values.expectedHarvestDate).format(
        "YYYY-MM-DD"
      ),
      Notes: values.notes || "",
    };
    try {
      await api.put(`/api/batches/${editingBatch.batchID}`, payload);
      message.success("Batch updated successfully!");
      setIsEditModalVisible(false);
      setEditingBatch(null);
      fetchBatches();
    } catch (error) {
      message.error("Failed to update batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBatch = (batchId: number) => {
    Modal.confirm({
      title: "Are you sure you want to delete this batch?",
      content:
        "This can only be done if the batch has no recorded activity. This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await api.delete(`/api/batches/${batchId}`);
          message.success("Batch deleted successfully.");
          fetchBatches(); // Refresh list
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.error || "Failed to delete batch.";
          message.error(errorMsg);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("MMM D, YYYY");
  };

  const handleViewDetails = (batch: Batch) => {
    setSelectedBatch(batch);
  };

  if (loading) {
    return (
      <MainBody>
        <div>Loading batches...</div>
      </MainBody>
    );
  }

  return (
    <MainBody>
      <ModalNotes
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        note={selectedNote?.note || ""}
        title={selectedNote?.title || "Note Details"}
      />

      <Detail
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        batch={selectedBatch}
        onDataChange={fetchBatches}
      />

      <AddBatchForm
        visible={isAddModalVisible}
        onCreate={handleAddBatch}
        onCancel={() => setIsAddModalVisible(false)}
        loading={isSaving}
      />

      <EditBatchForm
        visible={isEditModalVisible}
        onUpdate={handleUpdateBatch}
        onCancel={() => setIsEditModalVisible(false)}
        loading={isSaving}
        initialValues={editingBatch}
      />

      <div className="space-y-6">
        {/* --- Filters and Add Button Section --- */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} md={12} lg={8}>
              <Input
                placeholder="Search by batch name..."
                prefix={<FaSearch className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={6} lg={4}>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%" }}
              >
                <Select.Option value="All">All Statuses</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="Sold">Sold</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={6} lg={4}>
              <Button
                type="primary"
                icon={<FaPlus />}
                onClick={() => setIsAddModalVisible(true)}
                className="w-full"
              >
                Add New Batch
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Harvest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch.batchID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.batchName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(batch.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(batch.expectedHarvestDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.totalChicken.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {batch.currentChicken.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          batch.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (batch.notes?.Valid) {
                            setSelectedNote({
                              note: batch.notes.String,
                              title: `Notes for ${batch.batchName} (${batch.batchID})`,
                            });
                          }
                        }}
                        className={`inline-flex items-center text-sm ${
                          batch.notes?.Valid
                            ? "text-blue-600 hover:underline"
                            : "text-gray-400"
                        }`}
                        disabled={!batch.notes?.Valid}
                      >
                        <FaStickyNote className="mr-1.5 h-4 w-4" />
                        {batch.notes?.Valid ? "View Notes" : "No Notes"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => handleViewDetails(batch)}
                        >
                          <FaInfoCircle className="mr-1.5 h-4 w-4" />
                          Monitoring
                        </button>

                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => {
                            setEditingBatch(batch);
                            setIsEditModalVisible(true);
                          }}
                        >
                          <FaEdit className="mr-1.5 h-4 w-4" /> Edit
                        </button>

                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                          onClick={() => handleDeleteBatch(batch.batchID)}
                        >
                          <FaTrash className="mr-1.5 h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination below table --- */}
          <div className="p-4 flex justify-center border-t">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
              showTotal={(t, range) =>
                `${range[0]}-${range[1]} of ${t} batches`
              }
            />
          </div>
        </div>
      </div>
    </MainBody>
  );
};

export default Batches;
