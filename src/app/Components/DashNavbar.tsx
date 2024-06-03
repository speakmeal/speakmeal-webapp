import React from 'react'
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';

interface Props {
    redirectPath: string;
}

function DashNavbar({redirectPath}: Props) {
  return (
    <nav className="p-4 flex justify-between items-center shadow-md bg-white">
    <div className="flex items-center">
      <Image
        src="/assets/logo.png"
        alt="Speak Meal Logo"
        width={40}
        height={40}
      />
      <span className="text-xl font-bold text-black ml-2">Speak Meal</span>
    </div>
    <a
      className="btn btn-outline btn-light"
      href={redirectPath}
    >
      <FaArrowLeft />
    </a>
  </nav>
  )
}

export default DashNavbar