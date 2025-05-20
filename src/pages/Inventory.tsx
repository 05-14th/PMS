import { useState, useEffect } from 'react';
import Developing from '../components/Developing';
import MainBody from '../components/MainBody';
import axios from 'axios';
import Table from '../components/Table';
import Section from '../components/Section';

// Utility to detect YYYY-MM-DD strings
const isIsoDateString = (value: any): boolean =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

// Utility to format date to MM/DD/YYYY
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

function Inventory() {
  const [inventoryData, setItemData] = useState<any[]>([]);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  useEffect(() => {
    axios
      .get(`${serverHost}/getItems`)
      .then((res) => {
        console.log("API response:", res.data);

        // Attempt to extract an array safely
        const dataArray = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.items)
          ? res.data.items
          : [];

        const formatted = dataArray.map((item: Record<string, any>) => {
          const newItem: Record<string, any> = {};
          for (const key in item) {
            const value = item[key];
            newItem[key] = isIsoDateString(value) ? formatDate(value) : value;
          }
          return newItem;
        });

        setItemData(formatted);
      })
      .catch((err) => console.error("Error fetching items:", err));
  }, []);

  return (
    <MainBody>
      <section className="w-full">
        <div className="overflow-x-auto">
          <Table data={inventoryData} actionable={true} />
        </div>
      </section>
      <Section>
        <Developing/>
      </Section>
    </MainBody>
  );
}

export default Inventory;
