"use client";

import { User } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Subscription } from "../types_db";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import DashSidebar from "../Components/DashSidebar";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

//Note: Checks to see if user is logged in and has valid subscription are done server-side through the supabase middleware script. 

const DashboardPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const router = useRouter();

  const doughnutData = {
    labels: ["Protein", "Carbohydrates", "Fats"],
    datasets: [
      {
        data: [10, 20, 30],
        backgroundColor: ["#32CD32", "#6a0dad", "#000000"],
        hoverBackgroundColor: ["#32CD32", "#6a0dad", "#000000"],
      },
    ],
  };

  const lineData = {
    labels: ["09/27", "09/28", "09/29", "09/30", "10/01", "10/02", "TODAY"],
    datasets: [
      {
        label: "Calories",
        data: [40, 50, 60, 30, 70, 40, 80],
        fill: false,
        backgroundColor: "#6a0dad",
        borderColor: "#6a0dad",
      },
    ],
  };

  return (
    <div className="flex w-full min-h-screen">
      <DashSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        location="/dashboard"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col">
          <header className="flex justify-between items-center py-4 rounded-lg m-4">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-black" />
            </button>
            <h1 className="text-2xl font-bold">
              Hello [name], 👋 
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image
                  src="/assets/user-avatar.png"
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p>[Email]</p>
                </div>
              </div>
            </div>
          </header>

          <main className="p-4">
            <div className="flex flex-row items-center justify-center space-x-5">
                <button className="btn rounded-full bg-purple-500 text-white w-64 shadow-md m-5 hover:bg-lime-500"
                        onClick={() => router.push('/meals/new')}>
                    Log Meal
                </button>

                <button className="btn rounded-full bg-purple-500 text-white w-64 shadow-md m-5 hover:bg-lime-500"
                        onClick={() => router.push('/measurements/new')}>
                    Log Measurement
                </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold">{"Today\'s Intake"}</h2>
                <div className="mt-4">
                  <p className="text-sm">Oct 4</p>
                  <div className="bg-gray-200 h-4 rounded-full mt-2">
                    <div
                      className="bg-purple-600 h-4 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <p className="mt-2">23,400 / 30,000 Kcal</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-bold">Log</h3>
                  <ul className="mt-2">
                    <li className="flex justify-between py-1">
                      <span>Breakfast 🥚</span>
                      <span>340 Kcal</span>
                      <span className="text-yellow-500">30%</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Lunch 🥗</span>
                      <span>210 Kcal</span>
                      <span className="text-green-500">14%</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Dinner 🍕</span>
                      <span>430 Kcal</span>
                      <span className="text-red-500">45%</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Snacks 🍿</span>
                      <span>200 Kcal</span>
                      <span className="text-yellow-500">12%</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold">{"Today\'s Macros"}</h2>
                <Doughnut data={doughnutData} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold">Calorie Tracker</h2>
                <Line data={lineData} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
                <h2 className="text-xl font-bold">Personal Goals & Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold">Weight Loss/Gain Goals</h3>
                    <div className="h-32 mt-4 bg-white rounded-lg shadow-md flex items-center justify-center">
                      <span className="text-2xl">+10kg</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold">Calorie Target</h3>
                    <div className="h-32 mt-4 bg-purple-600 rounded-lg shadow-md flex items-center justify-center text-white">
                      <span className="text-2xl">1,000 / 2,500 ml</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold">Body Mass Index (BMI)</h3>
                    <div className="h-32 mt-4 bg-white rounded-lg shadow-md flex items-center justify-center">
                      <span className="text-2xl">24.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
