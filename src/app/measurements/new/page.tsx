"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { createClient } from "@/app/Utils/supabase/client";
import { emptyMeasurement, Measurement } from "@/app/types_db";
import DashNavbar from "@/app/Components/DashNavbar";

const NewMeasurement: React.FC = () => {
  const [measurementVals, setMeasurementVals] =
    useState<Measurement>(emptyMeasurement);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  /**
   * Save the measurement to the database
   */
  const saveMeasurement = async () => {
    setIsLoading(true);
    //get the user from the db
    const {
      data: { user },
    } = await supabase.auth.getUser();

    //add entry to database for new measurement
    const { error } = await supabase.from("measurement").insert({
        weight_kg: measurementVals.weight_kg,
        height_cm: measurementVals.height_cm,
        abdomen_cm: measurementVals.abdomen_cm, 
        hip_cm: measurementVals.hip_cm, 
        chest_cm: measurementVals.chest_cm,
        user_id: user?.id,
    });

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    //measurement was saved successfully, so redirect user to the dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <DashNavbar redirectPath="/dashboard" />

      <div className="p-6 bg-white rounded-lg shadow-md m-4">
        <h2 className="text-4xl font-bold mb-4 text-center">New Measurement</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700">Height (cm):</label>
            <input
              type="number"
              className="input input-bordered w-full mt-1"
              value={measurementVals.height_cm}
              onChange={(e) =>
                setMeasurementVals((prev: Measurement) => ({
                  ...prev,
                  height_cm: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <label className="block text-gray-700">Weight (kg):</label>
            <input
              type="number"
              className="input input-bordered w-full mt-1"
              value={measurementVals.weight_kg}
              onChange={(e) => setMeasurementVals((prev) => ({
                ...prev, 
                weight_kg: parseFloat(e.target.value)
              }))}
            />
          </div>

          <div>
            <label className="block text-gray-700">Abdomen (cm):</label>
            <input
              type="number"
              className="input input-bordered w-full mt-1"
              value={measurementVals.abdomen_cm}
              onChange={(e) => setMeasurementVals((prev) => ({
                ...prev, 
                abdomen_cm: parseFloat(e.target.value)
              }))}
            />
          </div>

          <div>
            <label className="block text-gray-700">Hip (cm):</label>
            <input
              type="number"
              className="input input-bordered w-full mt-1"
              value={measurementVals.hip_cm}
              onChange={(e) => setMeasurementVals((prev) => ({
                ...prev, 
                hip_cm: parseFloat(e.target.value)
              }))}
            />
          </div>

          <div>
            <label className="block text-gray-700">Chest (cm):</label>
            <input
              type="number"
              className="input input-bordered w-full mt-1"
              value={measurementVals.chest_cm}
              onChange={(e) => setMeasurementVals((prev) => ({
                ...prev, 
                chest_cm: parseFloat(e.target.value)
              }))}
            />
          </div>
        </div>

        <div className="mt-5 text-center">
          {!isLoading ? (
            <button
              className="btn rounded-full bg-lime-500 text-white hover:bg-purple-500 w-32"
              onClick={saveMeasurement}
            >
              Save
            </button>
          ) : (
            <LoadingIndicator />
          )}
        </div>

        {showAlert && <Alert message={message} type={type} />}
      </div>
    </div>
  );
};

export default NewMeasurement;
