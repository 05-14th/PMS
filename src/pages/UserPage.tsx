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
    <MainBody>
      <Table data={userData} actionable={true}/>
      <Section>
        <Developing/>
      </Section>
    </MainBody>
  )
}

export default UserPage;
