import { ReactNode } from 'react'
import Navbar from './Navbar';

interface MainBodyProps {
    children: ReactNode;
}

function MainBody({ children }: MainBodyProps) {
  return (
    <div className="min-h-screen min-w-screen bg-black">
        <Navbar isControl={false}/>
        {children}
    </div>
  )
}

export default MainBody;
