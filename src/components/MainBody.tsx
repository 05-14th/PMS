import { ReactNode } from 'react'
import Navbar from './Navbar';

interface MainBodyProps {
    children: ReactNode;
}

function MainBody({ children }: MainBodyProps) {
  return (
    <div className="min-h-screen min-w-screen bg-white">
      <Navbar isControl={false}/>
      <div className="min-w-screen bg-white">
        {children}
      </div>
    </div>
  )
}

export default MainBody;
