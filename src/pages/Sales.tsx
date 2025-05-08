import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import MainBody from '../components/MainBody'

function Sales() {
  return (
    <MainBody>
        <div>
            <h1 className="bg-white">Sales page is under development</h1>
            <Developing />
        </div>
    </MainBody>
  )
}

export default Sales;
