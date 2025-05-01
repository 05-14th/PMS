import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Developing from './Developing'
import MainBody from '../components/MainBody'

function Control() {
  return (
    <div className="min-h-screen bg-black">
        <MainBody>
            <div>
                <h1 className="bg-white">Control page is under development</h1>
                <Developing />
            </div>
        </MainBody>
    </div>
  )
}

export default Control;
