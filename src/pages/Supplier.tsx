import { useState, useEffect } from 'react'
import Developing from '../components/Developing'
import MainBody from '../components/MainBody'
import axios from 'axios'
import Table from '../components/Table'
import Section from '../components/Section'

function Supplier() {
  const [supplierData, setSupplierData] = useState<any[]>([]);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  useEffect(() => {
    axios
      .get(`${serverHost}/getSupplier`)
      .then((res) => setSupplierData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-black">
        <MainBody>
          <section className="w-full">
            <div className="overflow-x-auto">
              <Table data={supplierData} actionable={true} name="getSupplier" paramName="SupplierID" viewable={false} excluded_index={[0]} addMethod='addSupplier'/>
            </div>
          </section>
          <Section>
            <Developing/>
          </Section>
        </MainBody>
    </div>
  )
}

export default Supplier;
