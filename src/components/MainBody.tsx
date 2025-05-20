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
      <footer className="h-[50px] bg-black text-white text-center py-4">
        <p className="text-sm">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default MainBody;
