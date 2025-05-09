import { useState } from 'react'
import Developing from '../components/Developing'
import MainBody from '../components/MainBody'
import Section from '../components/Section'

function HomePage() {
  return (
   <MainBody>
      {/* First Section with Two Graph Boxes */}
      <section className="flex flex-wrap justify-center items-center min-h-[100dvh] gap-4 p-4">
        <div className="border border-gray-300 rounded-lg bg-white shadow-md w-full sm:w-1/3 h-64 flex items-center justify-center text-gray-600 text-xl">
          Graph 1
        </div>
        <div className="border border-gray-300 rounded-lg bg-white shadow-md w-full sm:w-1/3 h-64 flex items-center justify-center text-gray-600 text-xl">
          Graph 2
        </div>
      </section>

      {/* Placeholder for Second Section */}
      <Section>
        <Developing/>
      </Section>
   </MainBody>
  )
}

export default HomePage;
