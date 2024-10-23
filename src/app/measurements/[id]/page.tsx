"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import { createClient } from "@/app/Utils/supabase/client";
import { emptyMeasurement, Measurement } from "@/app/types_db";
import DashNavbar from "@/app/Components/DashNavbar";
import LoadingIndicator from "@/app/Components/LoadingIndicator";

// Note that when a new measurement is being created, the id is set to 'new'
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
  const [feet, setFeet] = useState<string>(""); // For height input in feet
  const [inches, setInches] = useState<string>(""); // For height input in inches
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  // Save new measurement to the database or edit an existing one
  const saveMeasurement = async () => {
    setIsLoading(true);

    // Convert height from feet + inches to total inches
    const totalHeightInches = parseInt(feet || "0") * 12 + parseInt(inches || "0");

    // Ensure optional fields are defaulted to zero if not entered
    const abdomen_inches = measurementVals.abdomen_inches || 0;
    const chest_inches = measurementVals.chest_inches || 0;
    const hip_inches = measurementVals.hip_inches || 0;

    if (!measurementVals.weight_pounds || measurementVals.weight_pounds <= 0){
      triggerAlert("You must enter a valid weight", "error");
      setIsLoading(false);
      return;
    }

    if (!totalHeightInches || totalHeightInches <= 0){
      triggerAlert("You must enter a valid height", "error");
      setIsLoading(false);
      return;
    }

    // If id = 'new', insert a new measurement
    if (id === "new") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("measurement").insert({
        weight_pounds: measurementVals.weight_pounds, // Now pounds
        height_inches: totalHeightInches,
        chest_inches: chest_inches,
        abdomen_inches: abdomen_inches,
        hip_inches: hip_inches,
        user_id: user?.id,
      });

      if (error) {
        triggerAlert(error.message, "error");
        setIsLoading(false);
        return;
      }
    } else {
      // If id != 'new', update the previous measurement
      const { error } = await supabase
        .from("measurement")
        .update({
          weight_pounds: measurementVals.weight_pounds,
          height_inches: totalHeightInches,
          chest_inches: chest_inches,
          abdomen_inches: abdomen_inches,
          hip_inches: hip_inches,
        })
        .eq("id", measurementVals.id);

      if (error) {
        triggerAlert(error.message, "error");
        setIsLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  };

  // Delete existing measurement from the database
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

    // Measurement was deleted successfully, redirect to logs
    router.push("/logs");
  };

  // Load measurement data on page load if necessary
  const onPageLoad = async () => {
    setIsPageLoading(true);

    if (!isNaN(parseInt(id))) {
      // If id is a valid number, then the user wants to edit an existing measurement
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
      // Split the height_inches back into feet and inches for input
      const feetVal = Math.floor(measurement.height_inches / 12);
      const inchesVal = measurement.height_inches % 12;
      setFeet(feetVal.toString());
      setInches(inchesVal.toString());
    } else {
      // If id is some text that is not /new (invalid)
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

          <div className="flex flex-col items-center justify-center space-y-5">
            {/* Height input (feet + inches) */}
            <div className="form-control">
              <label className="label text-white">Height:</label>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  className="input input-bordered w-32"
                  placeholder="Feet"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                />
                <p className="text-white">&apos;</p> 
                <input
                  type="number"
                  className="input input-bordered w-32"
                  placeholder="Inches"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                />
                <p className="text-white">&apos;&apos;</p>
              </div>
            </div>

            {/* Weight input (pounds) */}
            <div className="form-control flex flex-row space-x-5">
              <label className="label text-white">Weight (pounds):</label>
              <input
                type="number"
                className="input input-bordered w-32"
                value={measurementVals.weight_pounds}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    weight_pounds: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            {/* Optional fields (abdomen, hip, chest) */}
            <div className="form-control flex flex-row space-x-5">
              <label className="label text-white">Abdomen (inches):</label>
              <input
                type="number"
                className="input input-bordered w-32"
                value={measurementVals.abdomen_inches || ""}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    abdomen_inches: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="form-control flex flex-row space-x-5">
              <label className="label text-white">Hip (inches):</label>
              <input
                type="number"
                className="input input-bordered w-32"
                value={measurementVals.hip_inches || ""}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    hip_inches: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="form-control flex flex-row space-x-5">
              <label className="label text-white">Chest (inches):</label>
              <input
                type="number"
                className="input input-bordered w-32"
                value={measurementVals.chest_inches || ""}
                onChange={(e) =>
                  setMeasurementVals((prev) => ({
                    ...prev,
                    chest_inches: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* Save/Delete Buttons */}
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
