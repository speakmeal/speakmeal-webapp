"use client";
import React, { useState } from "react";
import Alert from "@/app/Components/Alert/Alert";
import { useAlert } from "@/app/Components/Alert/useAlert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/Utils/supabase/client";
import Logo from "../../../../public/assets/logo.png"; // Adjust path if necessary

interface FormData {
  height: string;
  weight: string;
  abdomen: string;
  hip: string;
  chest: string;
}

const FirstMeasurementPage: React.FC = () => {
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const [formData, setFormData] = useState<FormData>({
    height: "",
    weight: "",
    abdomen: "",
    hip: "",
    chest: "",
  });

  const supabase = createClient();
  const router = useRouter();

  const saveMeasurement = async () => {
    setIsPageLoading(true);

    for (const key of Object.keys(formData)) {
      if (isNaN(parseFloat(formData[key as keyof FormData]))) {
        triggerAlert(`Invalid value for ${key} field`, "error");
        setIsPageLoading(false);
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("measurement")
      .insert({
        user_id: user?.id,
        weight_kg: parseFloat(formData.weight),
        height_cm: parseFloat(formData.height),
        abdomen_cm: parseFloat(formData.abdomen),
        hip_cm: parseFloat(formData.hip),
        chest_cm: parseFloat(formData.chest),
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
          <div className="w-full">
            <label className="block text-white">Height (cm): </label>
            <input
              type="text"
              name="height"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Weight (kg): </label>
            <input
              type="text"
              name="weight"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Abdomen (cm): </label>
            <input
              type="text"
              name="abdomen"
              value={formData.abdomen}
              onChange={(e) =>
                setFormData({ ...formData, abdomen: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Hip (cm): </label>
            <input
              type="text"
              name="hip"
              value={formData.hip}
              onChange={(e) =>
                setFormData({ ...formData, hip: e.target.value })
              }
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Chest (cm): </label>
            <input
              type="text"
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
