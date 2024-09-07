"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import { createClient } from "@/app/Utils/supabase/client";
import { emptyMeasurement, Measurement } from "@/app/types_db";
import DashNavbar from "@/app/Components/DashNavbar";
import LoadingIndicator from "@/app/Components/LoadingIndicator";

//note that when a new measurement is being created, the id is set to 'new'
interface Params {
  id: string;
}

interface RouteParams {
  params: Params;
}
const NewMeasurement: React.FC<RouteParams> = ({
  params: { id },
}: RouteParams) => {
  const [measurementVals, setMeasurementVals] =
    useState<Measurement>(emptyMeasurement);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  /**
   * Save new measurement to the database or edit an existing one
   */
  const saveMeasurement = async () => {
    setIsLoading(true);

    //if id = 'new' insert a new measurement 
    if (id === "new") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("measurement")
        .insert({
          weight_kg: measurementVals.weight_kg, 
          height_cm: measurementVals.height_cm, 
          chest_cm: measurementVals.chest_cm, 
          abdomen_cm: measurementVals.abdomen_cm, 
          hip_cm: measurementVals.hip_cm,
          user_id: user?.id
      })

      if (error){
        triggerAlert(error.message, "error");
        setIsLoading(false);
        return;
      }
    } else {
      //if id != 'new' update the previous measurement
      const { error } = await supabase
        .from("measurement")
        .update({
          weight_kg: measurementVals.weight_kg, 
          height_cm: measurementVals.height_cm, 
          chest_cm: measurementVals.chest_cm, 
          abdomen_cm: measurementVals.abdomen_cm, 
          hip_cm: measurementVals.hip_cm
        })
        .eq('id', measurementVals.id);

      if (error){
        triggerAlert(error.message, "error");
        setIsLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  };

  //delete existing measurement from the database
  const deleteMeasurement = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from("measurement")
      .delete()
      .eq("id", measurementVals.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    //meal was deleted successfully, so redirect the user to the logs section
    router.push("/logs");
  };


  //load measurement data on page load if necessary
  const onPageLoad = async () => {
    setIsPageLoading(true);

    if (!isNaN(parseInt(id))) {
      //if id is a valid number, then user wants to edit existing measurement
      //hence, load the information for the meal selected
      const { data: measurement, error: measurementError } = await supabase
        .from("measurement")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (measurementError) {
        setIsPageLoading(false);
        triggerAlert(measurementError.message, "error");
        return;
      }

      setMeasurementVals(measurement);
    } else {
      //id is some text that is not /new (invalid)
      if (id !== "new") {
        router.push("/dashboard");
      }
    }

    setIsPageLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

  if (isPageLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DashNavbar />

      <div className="flex-grow flex items-center justify-center m-3 md:m-0">
        <div className="w-full max-w-4xl p-8 bg-gray-600 bg-opacity-30 rounded-lg shadow-md">
          <h2 className="text-4xl font-bold mb-6 text-center text-white">
            New Measurement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label text-white">Height (cm):</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={measurementVals.height_cm}
                onChange={(e) =>
                  setMeasurementVals((prev: Measurement) => ({
                    ...prev,
                    height_cm: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label text-white">Weight (kg):</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={measurementVals.weight_kg}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    weight_kg: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label text-white">Abdomen (cm):</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={measurementVals.abdomen_cm}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    abdomen_cm: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label text-white">Hip (cm):</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={measurementVals.hip_cm}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    hip_cm: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label text-white">Chest (cm):</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={measurementVals.chest_cm}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    chest_cm: parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-6 text-center w-full">
            {!isLoading ? (
              <div className="flex flex-row space-x-5 justify-center items-center">
                <button
                  className="btn btn-primary w-64 rounded-full"
                  onClick={saveMeasurement}
                >
                  Save
                </button>

                {id !== "new" && (
                  <button
                    className="btn btn-error text-white w-64 rounded-full"
                    onClick={deleteMeasurement}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center text-[#4F19D6]">
                <span className="loading loading-ring loading-lg text-center"></span>
              </div>
            )}
          </div>

          {showAlert && <Alert message={message} type={type} />}
        </div>
      </div>
    </div>
  );
};

export default NewMeasurement;
