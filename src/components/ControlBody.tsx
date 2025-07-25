import { ReactNode } from 'react'
import Navbar from './Navbar';

interface ControlBodyProps {
    children: ReactNode;
}

function ControlBody({ children }: ControlBodyProps) {
  return (
    <div className="min-h-screen min-w-screen bg-white">
        <Navbar isControl={true}/>
        {children}
    </div>
  )
}

export default ControlBody;
