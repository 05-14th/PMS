import { useState , useEffect } from 'react'
import Developing from './Developing'
import MainBody from '../components/MainBody'
import axios from 'axios'
import Table from '../components/Table'

function Inventory() {
  return (
    <MainBody>
        <div>
           
            <h1 className="bg-white">Inventory page is under development</h1>
            <Developing />
        </div>
    </MainBody>
  )
}

export default Inventory;
