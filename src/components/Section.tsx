import { ReactNode } from 'react'
import Navbar from './Navbar';
import { section } from 'framer-motion/client';

interface SectionBodyProps {
    children: ReactNode;
}

function Section({ children }: SectionBodyProps) {
  return (
    <section className="flex justify-center items-center min-h-[100dvh] bg-white p-4">
        {children}
    </section>
  )
}

export default Section;
