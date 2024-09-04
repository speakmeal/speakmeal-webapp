import React from 'react'
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

function DashNavbar() {
  const router = useRouter();

  return (
    <nav className="p-4 flex justify-between items-center shadow-md bg-gray-600 bg-opacity-30 rounded-md mx-5">
    <div className="flex items-center">
      <Image
        src="/assets/logo.png"
        alt="Speak Meal Logo"
        width={40}
        height={40}
      />
      <span className="text-xl font-bold text-white ml-2">Speak Meal</span>
    </div>
    <button
      className="btn btn-outline btn-light text-white"
      onClick={() => router.back()}
    >
      <FaArrowLeft />
    </button>
  </nav>
  )
}

export default DashNavbar