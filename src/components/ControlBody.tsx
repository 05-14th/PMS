import { ReactNode } from 'react'
import Navbar from './Navbar';

interface ControlBodyProps {
    children: ReactNode;
    className?: string;
}

function ControlBody({ children, className = '' }: ControlBodyProps) {
  return (
    <div className={`min-h-screen bg-white flex flex-col sm:flex-row ${className}`}>
      <Navbar isControl={true} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto min-h-screen sm:min-h-0 pt-14 pb-16 sm:pt-0 sm:pb-0 sm:pl-64">
        <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default ControlBody;
