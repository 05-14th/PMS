import { useState, useEffect } from 'react'
import Developing from '../components/Developing'
import MainBody from '../components/MainBody'
import axios from 'axios'
import Table from '../components/Table'
import Section from '../components/Section'

function UserPage() {
  const [userData, setUserData] = useState<any[]>([]);
  const serverHost = import.meta.env.VITE_APP_SERVERHOST;

  useEffect(() => {
    axios
      .get(`${serverHost}/getUsers`)
      .then((res) => setUserData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-black">
        <MainBody>
          <section className="w-full">
            <div className="overflow-x-auto">
              <Table data={userData} actionable={true} name="getUsers" paramName="material_id" viewable={false}/>
            </div>
          </section>
          <Section>
            <Developing/>
          </Section>
        </MainBody>
    </div>
  )
}

export default UserPage;
