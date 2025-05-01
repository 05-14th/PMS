import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from './Developing'
import MainBody from '../components/MainBody'

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
