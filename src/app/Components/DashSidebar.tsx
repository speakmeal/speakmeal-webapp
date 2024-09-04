"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaCoins, FaHome, FaList, FaStar, FaUser } from "react-icons/fa";
import { createClient } from "../Utils/supabase/client";
import { getMonthlyAICredits, getUserSubscription } from "./utils";

interface Props {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  location: string;
}

function DashSidebar({ isSidebarOpen, toggleSidebar, location }: Props) {
  const supabase = createClient();
  const [monthlyCredits, setMonthlyCredits] = useState<string>("-");
  const [planName, setPlanName] = useState<string>("Free Plan");

  const onPageLoad = async () => {
    const credits = await getMonthlyAICredits(supabase);
    const plan = await getUserSubscription(supabase);
    setMonthlyCredits("" + credits);
    setPlanName(plan);
  };

  useEffect(() => {
    onPageLoad();
  });

  return (
    <div
      className={`md:w-64 md:block mr-2 bg-gray-600 bg-opacity-30 text-white mt-5 mb-5 pb-5 h-screen rounded-md ${
        isSidebarOpen ? "block" : "hidden"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-row items-center space-x-10 justify-center px-5 flex-grow">
          <div className="flex flex-col items-center justify-center py-4 w-full">
            <Image
              src="/assets/logo.png"
              alt="Speak Meal Logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold">Speak Meal</span>
          </div>

          {isSidebarOpen && (
            <div>
              <button onClick={toggleSidebar}>
                <Bars3Icon className="h-6 w-6 text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between h-full py-10">
          <div>
            <a
              className={`block py-2.5 px-4 ${
                location === "/dashboard" && "bg-gray-600 bg-opacity-45"
              } hover:text-gray-300 hover:bg-gray-600 hover:bg-opacity-45 rounded-lg mx-5`}
              href="/dashboard"
            >
              <div className="flex flex-row space-x-5 items-center">
                <FaHome />
                <p>Dashboard</p>
              </div>
            </a>

            <a
              className={`block py-2.5 px-4 ${
                location === "/logs" && "bg-gray-600 bg-opacity-45"
              } hover:text-gray-300 hover:bg-gray-600 hover:bg-opacity-45 rounded-lg mx-5`}
              href="/logs"
            >
              <div className="flex flex-row space-x-5 items-center">
                <FaList />
                <p>My Logs</p>
              </div>
            </a>

            <a
              className={`block py-2.5 px-4 ${
                location === "/goals" && "bg-gray-600 bg-opacity-45"
              } hover:text-gray-300 hover:bg-gray-600 hover:bg-opacity-45 rounded-lg mx-5`}
              href="/goals"
            >
              <div className="flex flex-row space-x-5 items-center">
                <FaStar />
                <p>Progress & Goals</p>
              </div>
            </a>
          </div>

          <div>
            {/* Only show monthly credits if user has a free plan */}
            {planName === "Free Plan" && (
              <a
                className={`block py-2.5 px-4 hover:text-gray-300 hover:bg-gray-600 hover:bg-opacity-45 rounded-lg mx-5 bg-[#4F19D6]`}
              >
                <div className="flex flex-row space-x-5 items-center">
                  <FaCoins />
                  <p>AI Credits: {monthlyCredits}</p>
                </div>
              </a>
            )}
          </div>

          <div>
            <a
              className={`block py-2.5 px-4 ${
                location === "/account" && "bg-gray-600 bg-opacity-45"
              } hover:text-gray-300 hover:bg-gray-600 hover:bg-opacity-45 rounded-lg mx-5`}
              href="/account"
            >
              <div className="flex flex-row space-x-5 items-center">
                <FaUser />
                <p>Account</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashSidebar;
