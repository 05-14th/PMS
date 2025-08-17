import { useState, useEffect } from 'react'
import axios from 'axios';
import Developing from '../components/Developing'
import MainBody from '../components/MainBody'
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


function Sales() {
  const [itemData, setItemData] = useState<any[]>([]);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  const fetchSimpleSales = async (
    serverHost: string,
    setItemData: (data: any[]) => void,
    isIsoDateString: (value: any) => boolean,
    formatDate: (value: string) => string
  ): Promise<void> => {
    try {
      const res = await axios.get(`${serverHost}/getHarvests`);
      const formatted = res.data.map((item: Record<string, any>) => {
        const newItem: Record<string, any> = {};
        for (const key in item) {
          const value = item[key];
          newItem[key] = isIsoDateString(value) ? formatDate(value) : value;
        }
        return newItem;
      });
      setItemData(formatted);
    } catch (err) {
      console.error('Error fetching simple sales:', err);
    }
  };

  useEffect(() => {
    fetchSimpleSales(serverHost, setItemData, isIsoDateString, formatDate);
  }, []);

  return (
    <MainBody>
      <section className="w-full">
        <div className="overflow-x-auto">
          <Table data={itemData} actionable={true} name="getHarvests" paramName="HarvestID" viewable={true} excluded_index={[0,1,3,4,5]}/>
        </div>
      </section>
      <Section>
        <Developing />
      </Section>
    </MainBody>
  )
}

export default Sales;
