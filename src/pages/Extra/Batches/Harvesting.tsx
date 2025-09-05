import React, { useState } from 'react';

interface Batch {
  id: string;
  name: string;
  expectedHarvestDate?: string;
}

interface HarvestingProps {
  batch: Batch;
}

const productTypes = [
  'Whole Chicken',
  'Dressed Chicken',
  'Chicken Parts',
  'Processed Meat',
  'Eggs',
  'Other'
];

const customers = [
  'Retail Customer',
  'Local Market',
  'Restaurant Chain',
  'Supermarket',
  'Wholesale Buyer'
];

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Bank Transfer',
  'Check',
  'Mobile Payment'
];

const Harvesting: React.FC<HarvestingProps> = ({ batch }) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [pricePerKg, setPricePerKg] = useState<number>(180);
  const [inventoryData, setInventoryData] = useState<Array<{
    id: number;
    date: Date;
    productType: string;
    qtyHarvested: number;
    qtyRemaining: number;
  }>>([]);
  
  const totalWeight = quantity * 2;
  const totalAmount = totalWeight * pricePerKg;

  const handleCreateSale = () => {
    if (!selectedProduct || !quantity || !selectedCustomer || !selectedPayment) return;
    
    const newInventoryItem = {
      id: Date.now(),
      date: new Date(),
      productType: selectedProduct,
      qtyHarvested: quantity,
      qtyRemaining: quantity // Initially, all harvested quantity is remaining
    };
    
    setInventoryData([...inventoryData, newInventoryItem]);
    
    // Reset form
    setQuantity(0);
    setSelectedProduct('');
    setSelectedCustomer('');
    setSelectedPayment('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Create Sellable Inventory from Harvest</h2>
      
      {/* Harvest Details Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Harvest Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Type Dropdown */}
          <div>
            <label htmlFor="product-type" className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              id="product-type"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Select product type</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Harvest Date */}
          <div>
            <label htmlFor="harvest-date" className="block text-sm font-medium text-gray-700 mb-1">
              Harvest Date
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="harvest-date"
                readOnly
                value={new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit'
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Quantity Harvested */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Harvested
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Total Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Weight (kg)
            </label>
            <div className="mt-1">
              <input
                type="text"
                readOnly
                value={totalWeight.toFixed(2)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instant Sale Details Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Instant Sale Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Dropdown */}
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              id="customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>

          {/* Price per Kg */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price per Kg (₱)
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="price"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="payment-method"
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount (₱)
            </label>
            <div className="mt-1">
              <input
                type="text"
                readOnly
                value={totalAmount.toFixed(2)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-gray-50 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleCreateSale}
            disabled={!selectedProduct || !quantity || !selectedCustomer || !selectedPayment}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              selectedProduct && quantity && selectedCustomer && selectedPayment
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Add Harvest & Create Sale
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Inventory</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harvest Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Harvested
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryData.length > 0 ? (
                inventoryData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.date.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.qtyHarvested}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.qtyRemaining}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No inventory records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

     
    </div>
  );
};

export default Harvesting;