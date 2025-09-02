import React, { useState } from 'react';
import { Table, Input, Button, Space, DatePicker, Card, Typography } from 'antd';
import { SearchOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface SaleRecord {
  key: string;
  receiptNumber: string;
  dateTime: string;
  customerName: string;
  total: number;
}

const SaleHistory: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Sample data - replace with actual API call
  const [data, setData] = useState<SaleRecord[]>([
    {
      key: '1',
      receiptNumber: 'RCPT-2023-001',
      dateTime: '2023-10-15 14:30:00',
      customerName: 'John Doe',
      total: 1250.75,
    },
    {
      key: '2',
      receiptNumber: 'RCPT-2023-002',
      dateTime: '2023-10-16 10:15:00',
      customerName: 'Jane Smith',
      total: 875.50,
    },
    // Add more sample data as needed
  ]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    setDates(dates);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setDates([null, null]);
  };

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      item.receiptNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDateRange = !dates[0] || !dates[1] || 
      (dayjs(item.dateTime).isAfter(dates[0].startOf('day')) && 
       dayjs(item.dateTime).isBefore(dates[1].endOf('day')));
    
    return matchesSearch && matchesDateRange;
  });

  const columns: ColumnsType<SaleRecord> = [
    {
      title: 'Receipt Number',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      sorter: (a, b) => a.receiptNumber.localeCompare(b.receiptNumber),
    },
    {
      title: 'Date and Time',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (dateTime: string) => dayjs(dateTime).format('MMM D, YYYY hh:mm A'),
      sorter: (a, b) => dayjs(a.dateTime).unix() - dayjs(b.dateTime).unix(),
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `₱${total.toFixed(2)}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => handleViewDetails(record)}
          className="text-blue-500 hover:text-blue-700"
        >
          Details
        </Button>
      ),
    },
  ];

  const handleViewDetails = (record: SaleRecord) => {
    // Handle view details action
    console.log('View details:', record);
  };

  return (
    <div className="p-4">
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0">Sales History</Title>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by receipt number or customer name"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full md:w-96"
            />
          </div>
          
          <div className="flex gap-2">
            <RangePicker
              format="YYYY-MM-DD"
              onChange={handleDateChange}
              value={dates}
              className="w-full md:w-64"
              suffixIcon={<CalendarOutlined className="text-gray-400" />}
              placeholder={['Start Date', 'End Date']}
            />
            <Button 
              icon={<FilterOutlined />} 
              onClick={handleClearFilters}
              className="flex items-center"
            >
              Clear
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          className="bg-white rounded-lg shadow"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>
    </div>
  );
};

export default SaleHistory;
