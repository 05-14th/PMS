import { ReactNode } from 'react'
import Navbar from './Navbar';

interface MainBodyProps {
    children: ReactNode;
}

function MainBody({ children }: MainBodyProps) {
  return (
    <div className="min-h-screen min-w-screen">
      <Navbar isControl={false}/>
      <div className="bg-white min-w-screen">
        {children}
      </div>
    </div>
  )
}

export default MainBody;
