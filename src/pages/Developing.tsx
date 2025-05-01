import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from '../components/Navbar'

function Developing() {
  return (
    <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen bg-white">
            <img src="\Extras\underDev.gif" alt="Developing" className=''/>
        </div>
    </div>
  )
}

export default Developing
