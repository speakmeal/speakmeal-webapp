"use client";
import React from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaHome, FaList, FaStar, FaUser } from "react-icons/fa";

interface Props {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  location: string
}

function DashSidebar({ isSidebarOpen, toggleSidebar, location }: Props) {
  return (
    <div
      className={`md:w-64 mr-2 bg-gradient-to-b from-black to-purple-500 text-white rounded-r-md ${
        isSidebarOpen ? "block" : "hidden"
      } md:block`}
    >
      <div className="flex flex-row items-center space-x-10 justify-between px-5">
        <div className="flex items-center justify-center space-x-3 py-4 ">
          <Image
            src="/assets/logo.png"
            alt="Speak Meal Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">Speak Meal</span>
        </div>

        <div>
          {isSidebarOpen && (
            <button onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      </div>
      <nav className="mt-10">
        <a
          className={`block py-2.5 px-4 ${location === '/dashboard' ? 'text-blue-400' : 'text-gray-300'} hover:bg-purple-700 hover:text-white rounded-lg`}
          href="/dashboard"
        >
          <div className="flex flex-row space-x-5 items-center">
            <FaHome />
            <p>Dashboard</p>
          </div>
        </a>

        <a
          className={`block py-2.5 px-4 ${location === '/logs' ? 'text-blue-400' : 'text-gray-300'} hover:bg-purple-700 hover:text-white rounded-lg`}
          href="/logs"
        >
          <div className="flex flex-row space-x-5 items-center">
            <FaList />
            <p>My Logs</p>
          </div>
        </a>

        <a
          className={`block py-2.5 px-4 ${location === '/goals' ? 'text-blue-400' : 'text-gray-300'} hover:bg-purple-700 hover:text-white rounded-lg`}
          href="/goals"
        >
          <div className="flex flex-row space-x-5 items-center">
            <FaStar />
            <p>Progress & Goals</p>
          </div>
        </a>

        <div className="mt-[55vh]">
          <img src="/assets/background.png" />
        </div>

        <a
          className={`mt-10 block py-2.5 px-4 ${location === '/account' ? 'text-blue-400' : 'text-white'} hover:bg-purple-700 hover:text-white rounded-lg`}
          href="/account"
        >
          <div className="flex flex-row space-x-5 items-center">
            <FaUser />
            <p>Account</p>
          </div>
        </a>
      </nav>
    </div>
  );
}

export default DashSidebar;
