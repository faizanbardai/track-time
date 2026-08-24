import React, { FC, ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

const Container: FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`${className} mx-auto w-full max-w-[1200px] px-2 py-2`}>
    {children}
  </div>
)

export default Container
