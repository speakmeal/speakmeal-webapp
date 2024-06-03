"use client";
import { useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

const Goals: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    return (
      <div className="flex w-full min-h-screen">
        <DashSidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          location="/goals"
        />
  
        {!isSidebarOpen && (
          <div className="flex flex-1 flex-col">
            <header className="flex justify-between items-center px-6 py-4 rounded-lg m-4">
              <button className="md:hidden mr-5" onClick={toggleSidebar}>
                <Bars3Icon className="h-6 w-6 text-black" />
              </button>
            </header>
          </div>
        )}
      </div>
    );
}

export default Goals
