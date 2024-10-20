"use client";
import React, { useState } from "react";
import Alert from "@/app/Components/Alert/Alert";
import { useAlert } from "@/app/Components/Alert/useAlert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/Utils/supabase/client";
import Logo from "../../../../public/assets/logo.png"; // Adjust the path if necessary

const ProfileSetUpPage: React.FC = () => {
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<string>("Not specified");
  const [age, setAge] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  const submitProfile = async () => {
    setIsPageLoading(true);

    if (isNaN(parseInt(age))) {
      triggerAlert("Invalid value for age", "error");
      setIsPageLoading(false);
      return;
    }

    if (!name || !gender || !age) {
      triggerAlert("You must enter a value for every field", "error");
      setIsPageLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update({
        name: name,
        age: parseInt(age),
        gender: gender,
      })
      .eq("id", user?.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsPageLoading(false);
      return;
    }

    router.push("/onboarding/calories-goal");
  };

  if (isPageLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black text-white">
        <LoadingIndicator />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col justify-between bg-black p-8">
      {showAlert && <Alert message={message} type={type} />}

      {/* Logo - Top Right */}
      <div className="absolute top-5 right-5">
        <img src={Logo.src} alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-4xl md:text-6xl font-bold text-[#53ac00] text-center">
          Complete Your <br /> Profile
        </h1>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center mt-10 bg-opacity-40 rounded-lg shadow-md p-6 w-full">
        <h1 className="text-2xl font-semibold text-white mb-4">Your Information</h1>

        <div className="grid grid-cols-1 gap-6 max-w-5xl mt-5">
          <div className="w-full">
            <label className="block text-white">Name: </label>
            <input
              type="text"
              placeholder="Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-white">Gender: </label>
            <select
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="select select-bordered w-full bg-gray-800 text-white"
            >
              <option value="Not specified">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="w-full">
            <label className="block text-white">Age: </label>
            <input
              type="number"
              placeholder="Age"
              name="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="input input-bordered w-full bg-gray-800 text-white"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full flex justify-center mt-10">
          <button
            type="submit"
            className="btn btn-primary w-full max-w-md bg-[#53ac00] text-white text-lg hover:bg-[#469200] transition-all duration-300"
            onClick={submitProfile}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Skip Button */}
      <div className="flex flex-row justify-center mt-2 mb-4">
        <button
          className="text-lg text-[#53ac00] hover:text-gray-300 transition-all duration-300"
          onClick={() => router.push("/onboarding/calories-goal")}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default ProfileSetUpPage;
