// src/pages/Extra/Forms_Sales/FulfillmentModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Divider,
  Alert,
  Row,
  Col,
} from "antd";
import axios from "axios";

const { Text, Title } = Typography;
const { Option } = Select;

// Interfaces
interface SaleDetail {
  saleDetailID: number;
  productType: string;
  quantitySold: number;
}

interface SaleHistoryRecord {
  saleID: number;
  batchName: string;
  customerName: string;
  discount: number;
}

interface HarvestedProduct {
  harvestProductID: number;
  harvestDate: string;
  productType: string;
  quantityHarvested: number;
  quantityRemaining: number;
  weightHarvestedKg: number;
  weightRemainingKg: number;
  batchName?: string;
}

interface FulfillmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  saleOrder: SaleHistoryRecord | null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST,
  timeout: 10000,
});

const FulfillmentModal: React.FC<FulfillmentModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  saleOrder,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saleDetails, setSaleDetails] = useState<SaleDetail[]>([]);
  const [harvestedProducts, setHarvestedProducts] = useState<
    HarvestedProduct[]
  >([]);
  const [subTotal, setSubTotal] = useState(0);
  const [discrepancyModalVisible, setDiscrepancyModalVisible] = useState(false);
  const [pendingFulfillment, setPendingFulfillment] = useState<any>(null);

  const discount = Form.useWatch("discount", form) || 0;

  useEffect(() => {
    if (visible && saleOrder) {
      setLoading(true);
      Promise.all([
        api.get(`/api/sales/${saleOrder.saleID}`),
        api.get("/api/harvested-products"),
      ])
        .then(([detailsRes, productsRes]) => {
          setSaleDetails(detailsRes.data || []);
          setHarvestedProducts(productsRes.data || []);

          const initialValues: { [key: string]: any } = (
            detailsRes.data || []
          ).reduce((acc: any, item: SaleDetail) => {
            acc[`weight_${item.saleDetailID}`] = undefined;
            acc[`price_${item.saleDetailID}`] = undefined;
            acc[`harvestProductID_${item.saleDetailID}`] = undefined;
            return acc;
          }, {});

          initialValues.discount = saleOrder.discount || 0;
          form.setFieldsValue(initialValues);
        })
        .catch((error) => {
          console.error("API Error:", error);
          message.error("Failed to load data for fulfillment.");
        })
        .finally(() => setLoading(false));
    }
  }, [visible, saleOrder, form]);

  // Check for weight discrepancies
  const checkWeightDiscrepancies = (values: any) => {
    const discrepancies: Array<{
      saleDetailID: number;
      productType: string;
      enteredWeight: number;
      availableWeight: number;
      harvestProductID: number;
    }> = [];

    saleDetails.forEach((detail) => {
      const harvestProductID =
        values[`harvestProductID_${detail.saleDetailID}`];
      const enteredWeight = values[`weight_${detail.saleDetailID}`] || 0;

      if (harvestProductID && enteredWeight > 0) {
        const selectedProduct = harvestedProducts.find(
          (p) => p.harvestProductID === harvestProductID
        );

        if (
          selectedProduct &&
          enteredWeight > selectedProduct.weightRemainingKg
        ) {
          discrepancies.push({
            saleDetailID: detail.saleDetailID,
            productType: detail.productType,
            enteredWeight,
            availableWeight: selectedProduct.weightRemainingKg,
            harvestProductID,
          });
        }
      }
    });

    return discrepancies;
  };

  const handleFulfill = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Check for weight discrepancies
      const discrepancies = checkWeightDiscrepancies(values);

      if (discrepancies.length > 0) {
        // Show discrepancy confirmation modal
        setPendingFulfillment({ values, discrepancies });
        setDiscrepancyModalVisible(true);
        setLoading(false);
        return;
      }

      // No discrepancies, proceed with fulfillment
      await processFulfillment(values);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Validation failed or an error occurred.";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  // Process fulfillment - NO WEIGHT ADJUSTMENT
  const processFulfillment = async (values: any) => {
    try {
      setLoading(true);

      const fulfillmentItems = saleDetails.map((detail) => {
        const harvestProductID =
          values[`harvestProductID_${detail.saleDetailID}`];
        const actualWeight = values[`weight_${detail.saleDetailID}`] || 0;
        const selectedProduct = harvestedProducts.find(
          (p) => p.harvestProductID === harvestProductID
        );

        if (!selectedProduct) {
          throw new Error(
            `Please select a harvested product for ${detail.productType}.`
          );
        }
        if (selectedProduct.quantityRemaining < detail.quantitySold) {
          throw new Error(
            `Not enough stock for ${detail.productType}. Required: ${detail.quantitySold}, Available: ${selectedProduct.quantityRemaining}`
          );
        }

        return {
          saleDetailID: detail.saleDetailID,
          totalWeightKg: actualWeight, // Use ACTUAL weight
          pricePerKg: values[`price_${detail.saleDetailID}`],
          harvestProductID: harvestProductID,
        };
      });

      const payload = {
        discount: values.discount || 0,
        items: fulfillmentItems,
      };

      await api.post(`/api/sales/${saleOrder!.saleID}/fulfill`, payload);
      message.success("Order fulfilled successfully!");
      onSuccess();
      setDiscrepancyModalVisible(false);
      setPendingFulfillment(null);
    } catch (error: any) {
      console.error("Fulfillment error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to fulfill order";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle discrepancy confirmation - PROCEED WITH ACTUAL WEIGHTS
  const handleProceedWithActualWeights = () => {
    if (pendingFulfillment) {
      processFulfillment(pendingFulfillment.values);
    }
  };

  // Handle cancel discrepancy
  const handleCancelDiscrepancy = () => {
    setDiscrepancyModalVisible(false);
    setPendingFulfillment(null);
    setLoading(false);
  };

  const calculateSubtotal = () => {
    const values = form.getFieldsValue();
    let currentSubtotal = 0;
    saleDetails.forEach((detail) => {
      const weight = values[`weight_${detail.saleDetailID}`] || 0;
      const price = values[`price_${detail.saleDetailID}`] || 0;
      currentSubtotal += weight * price;
    });
    setSubTotal(currentSubtotal);
  };

  // Get weight warning for individual items
  const getWeightWarning = (saleDetailID: number) => {
    const values = form.getFieldsValue();
    const harvestProductID = values[`harvestProductID_${saleDetailID}`];
    const enteredWeight = values[`weight_${saleDetailID}`] || 0;

    if (harvestProductID && enteredWeight > 0) {
      const selectedProduct = harvestedProducts.find(
        (p) => p.harvestProductID === harvestProductID
      );

      if (
        selectedProduct &&
        enteredWeight > selectedProduct.weightRemainingKg
      ) {
        return {
          hasWarning: true,
          message: `Note: Entered weight (${enteredWeight}kg) exceeds recorded available weight (${selectedProduct.weightRemainingKg}kg). The actual measured weight will be used for pricing.`,
        };
      }
    }

    return { hasWarning: false, message: "" };
  };

  // Get available products for dropdown with stock info
  const getAvailableProducts = (productType: string) => {
    return harvestedProducts
      .filter(
        (p) =>
          // ADDED CHECK: Ensure p.ProductType exists before trying to use it
          p.productType &&
          p.productType.trim().toLowerCase() ===
            productType.trim().toLowerCase() &&
          p.quantityRemaining > 0
      )
      .map((p) => ({
        ...p,
        displayText: `${p.batchName || "Batch"} - ${p.quantityRemaining}pcs, ${
          p.weightRemainingKg
        }kg recorded (${p.harvestDate})`,
      }));
  };

  return (
    <>
      <Modal
        title={<Title level={4}>Fulfill Pre-Order</Title>}
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button key="back" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleFulfill}
          >
            Fulfill Order
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          {saleOrder && (
            <Alert
              message={`Fulfilling Order #${saleOrder.saleID} for ${saleOrder.customerName} (from Batch: ${saleOrder.batchName})`}
              type="info"
              style={{ marginBottom: 24 }}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onValuesChange={calculateSubtotal}
          >
            {saleDetails.map((detail) => {
              const weightWarning = getWeightWarning(detail.saleDetailID);
              const availableProducts = getAvailableProducts(
                detail.productType
              );

              return (
                <div
                  key={detail.saleDetailID}
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    ...(weightWarning.hasWarning && {
                      borderColor: "#1890ff",
                      backgroundColor: "#e6f7ff",
                    }),
                  }}
                >
                  <Text strong>
                    {detail.quantitySold} x {detail.productType}
                  </Text>
                  {weightWarning.hasWarning && (
                    <Alert
                      message={weightWarning.message}
                      type="info"
                      showIcon
                      style={{ marginTop: 8, marginBottom: 8 }}
                    />
                  )}
                  <Divider style={{ margin: "12px 0" }} />
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Select Harvested Product"
                        name={`harvestProductID_${detail.saleDetailID}`}
                        rules={[
                          {
                            required: true,
                            message: "Please select a product batch.",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select from available stock"
                          showSearch
                          optionFilterProp="children"
                        >
                          {availableProducts.map((p) => (
                            <Option
                              key={p.harvestProductID}
                              value={p.harvestProductID}
                            >
                              {p.displayText}
                            </Option>
                          ))}
                          {availableProducts.length === 0 && (
                            <Option disabled value="no-stock">
                              No available stock for {detail.productType}
                            </Option>
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Actual Measured Weight (kg)"
                        name={`weight_${detail.saleDetailID}`}
                        rules={[
                          {
                            required: true,
                            message: "Please enter the actual measured weight.",
                          },
                          {
                            validator: (_, value) => {
                              if (value && value <= 0) {
                                return Promise.reject(
                                  new Error("Weight must be greater than 0")
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                        validateStatus={
                          weightWarning.hasWarning ? "warning" : ""
                        }
                      >
                        <InputNumber
                          min={0.01}
                          step={0.01}
                          style={{ width: "100%" }}
                          placeholder="Enter actual weight"
                          precision={2}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Price per Kg (₱)"
                        name={`price_${detail.saleDetailID}`}
                        rules={[
                          {
                            required: true,
                            message: "Please enter the price.",
                          },
                          {
                            validator: (_, value) => {
                              if (value && value <= 0) {
                                return Promise.reject(
                                  new Error("Price must be greater than 0")
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber
                          min={0.01}
                          step={0.01}
                          style={{ width: "100%" }}
                          prefix="₱"
                          precision={2}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              );
            })}
            <Divider />
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Form.Item name="discount" label="Discount (₱)">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    prefix="₱"
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: "right" }}>
                <div>
                  <Text>Subtotal:</Text>{" "}
                  <Text strong>₱{subTotal.toFixed(2)}</Text>
                </div>
                <div>
                  <Text type="danger">Discount:</Text>{" "}
                  <Text strong type="danger">
                    - ₱{discount.toFixed(2)}
                  </Text>
                </div>
                <Title level={4} style={{ marginTop: 8 }}>
                  Final Total: ₱{(subTotal - discount).toFixed(2)}
                </Title>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>

      {/* Updated Discrepancy Confirmation Modal */}
      <Modal
        title="Weight Discrepancy Notice"
        open={discrepancyModalVisible}
        onCancel={handleCancelDiscrepancy}
        footer={[
          <Button key="cancel" onClick={handleCancelDiscrepancy}>
            Cancel
          </Button>,
          <Button
            key="proceed"
            type="primary"
            loading={loading}
            onClick={handleProceedWithActualWeights}
          >
            Proceed with Actual Weights
          </Button>,
        ]}
      >
        <Alert
          message="Weight discrepancies detected"
          description={
            <div>
              <p>
                The following items have entered weights that exceed recorded
                available stock:
              </p>
              <ul>
                {pendingFulfillment?.discrepancies.map((item: any) => (
                  <li key={item.saleDetailID}>
                    <strong>{item.productType}:</strong> Entered{" "}
                    {item.enteredWeight}kg, but only {item.availableWeight}kg
                    recorded available
                  </li>
                ))}
              </ul>
              <p>
                <strong>If you proceed:</strong>
                <br />•{" "}
                <strong>
                  Actual measured weights will be used for pricing
                </strong>
                <br />• Customer will be charged for the actual weights entered
                <br />• Remaining weights in inventory will be set to 0
                <br />• Products will be deactivated if quantity reaches 0
                <br />• All actual weights and prices will be recorded in the
                database
              </p>
              <p style={{ fontStyle: "italic", marginTop: 8 }}>
                This is normal when actual chicken weights differ from recorded
                estimates.
              </p>
            </div>
          }
          type="info"
          showIcon
        />
      </Modal>
    </>
  );
};

export default FulfillmentModal;
