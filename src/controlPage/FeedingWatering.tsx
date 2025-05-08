import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from '../components/Developing'
import ControlBody from '../components/ControlBody'

function FeedingWatering() {
  return (
    <div className="min-h-screen bg-black">
        <ControlBody>
            <div>
                <h1 className="bg-white">Feeding and Watering page is under development</h1>
                <Developing />
            </div>
        </ControlBody>
    </div>
  )
}

export default FeedingWatering;
