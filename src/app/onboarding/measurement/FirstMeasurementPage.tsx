"use client";
import React, { useState } from "react";
import Alert from "@/app/Components/Alert/Alert";
import { useAlert } from "@/app/Components/Alert/useAlert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/Utils/supabase/client";
import Logo from "../../../../public/assets/logo.png"; // Adjust path if necessary

interface FormData {
  heightFeet: string;
  heightInches: string;
  weight: string;
  abdomen: string;
  hip: string;
  chest: string;
}

const FirstMeasurementPage: React.FC = () => {
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const [formData, setFormData] = useState<FormData>({
    heightFeet: "",
    heightInches: "",
    weight: "",
    abdomen: "",
    hip: "",
    chest: "",
  });

  const supabase = createClient();
  const router = useRouter();

  const saveMeasurement = async () => {
    setIsPageLoading(true);

    // Convert height from feet and inches to total inches
    const totalHeightInches =
      parseInt(formData.heightFeet || "0") * 12 +
      parseInt(formData.heightInches || "0");

    // Validate input fields
    if (isNaN(totalHeightInches) || totalHeightInches <= 0) {
      triggerAlert("Invalid height value", "error");
      setIsPageLoading(false);
      return;
    }

    if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      triggerAlert("Invalid weight value", "error");
      setIsPageLoading(false);
      return;
    }

    // Optional fields
    const abdomenInches = parseFloat(formData.abdomen) || 0;
    const hipInches = parseFloat(formData.hip) || 0;
    const chestInches = parseFloat(formData.chest) || 0;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("measurement").insert({
      user_id: user?.id,
      weight_pounds: parseFloat(formData.weight),
      height_inches: totalHeightInches,
      abdomen_inches: abdomenInches,
      hip_inches: hipInches,
      chest_inches: chestInches,
    });

    if (error) {
      triggerAlert(error.message, "error");
      setIsPageLoading(false);
      return;
    }

    router.push("/onboarding/profile");
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black text-white">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black p-8">
      {showAlert && <Alert message={message} type={type} />}

      {/* Logo - Top Right */}
      <div className="absolute top-5 right-5">
        <img src={Logo.src} alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-4xl md:text-6xl font-bold text-[#53ac00] text-center">
          Log Your First <br /> Measurement
        </h1>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center mt-10 bg-opacity-40 rounded-lg shadow-md p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Height input (feet + inches) */}
          <div className="w-full md:col-span-2">
            <label className="block text-white">Height:</label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="heightFeet"
                placeholder="Feet"
                value={formData.heightFeet}
                onChange={(e) =>
                  setFormData({ ...formData, heightFeet: e.target.value })
                }
                className="input input-bordered w-full bg-gray-800 text-white"
              />
              <input
                type="number"
                name="heightInches"
                placeholder="Inches"
                value={formData.heightInches}
                onChange={(e) =>
                  setFormData({ ...formData, heightInches: e.target.value })
                }
                className="input input-bordered w-full bg-gray-800 text-white"
              />
            </div>
          </div>

          {/* Weight input (pounds) */}
          <div className="w-full">
            <label className="block text-white">Weight (pounds):</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          {/* Optional fields (abdomen, hip, chest) */}
          <div className="w-full">
            <label className="block text-white">Abdomen (inches):</label>
            <input
              type="number"
              name="abdomen"
              value={formData.abdomen}
              onChange={(e) =>
                setFormData({ ...formData, abdomen: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Hip (inches):</label>
            <input
              type="number"
              name="hip"
              value={formData.hip}
              onChange={(e) =>
                setFormData({ ...formData, hip: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Chest (inches):</label>
            <input
              type="number"
              name="chest"
              value={formData.chest}
              onChange={(e) =>
                setFormData({ ...formData, chest: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full flex justify-center mt-10">
          <button
            type="submit"
            className="btn w-full max-w-md bg-[#53ac00] text-white text-lg hover:text-blue-500 transition-all duration-300"
            onClick={saveMeasurement}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Skip Button */}
      <div className="flex flex-row justify-center mt-2 mb-4">
        <button
          className="text-lg text-[#53ac00] hover:text-gray-300 transition-all duration-300"
          onClick={() => router.push("/onboarding/profile")}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default FirstMeasurementPage;
