"use client";
import Alert from "@/app/Components/Alert/Alert";
import { useAlert } from "@/app/Components/Alert/useAlert";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { createClient } from "@/app/Utils/supabase/client";

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
    <div className="h-screen flex flex-col bg-black p-8">
      {/* Logo and Header */}
      <div className="flex flex-row items-center justify-center space-x-10 mt-10">
        <h1 className="text-6xl font-bold text-[#4F19D6] text-center">
          Complete Your <br></br>Profile
        </h1>
      </div>

      <div className="flex flex-col items-center bg-gray-600 bg-opacity-30 rounded-lg shadow-md p-6 mt-40">
        <h1 className="text-xl font-semibold text-white">Your information</h1>

        <div className="grid grid-cols-2 mt-5 space-y-2 items-center">
          <p className="text-white">Name: </p>
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full max-w-md"
          />

          <p className="text-white">Gender: </p>
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="select select-bordered w-full max-w-md"
          >
            <option value="Not specified">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <p className="text-white">Age: </p>
          <input
            type="number"
            placeholder="Age"
            name="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input input-bordered w-full max-w-md"
          />
        </div>

        <div className="w-full flex flex-row justify-center">
          <button
            type="submit"
            className="btn btn-primary bg-[#4F19D6] w-full max-w-md mt-10"
            onClick={submitProfile}
          >
            Submit
          </button>
        </div>
      </div>

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default ProfileSetUpPage;