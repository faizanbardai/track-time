import React, { FC, ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

const Container: FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`${className} w-full max-w-[1200px] mx-auto sm:p-4 p-2`}>
    {children}
  </div>
)

export default Container
