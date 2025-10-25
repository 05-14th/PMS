import { ReactNode } from 'react'

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
