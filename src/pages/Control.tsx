import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import ControlBody from '../components/ControlBody'
import Developing from '../components/Developing'

function Control() {
  return (
    <div className="min-h-screen bg-black">
        <ControlBody>
            <div>
                <h1 className="bg-white">Control page is under development</h1>
                <Developing />
            </div>
        </ControlBody>
    </div>
  )
}

export default Control;
