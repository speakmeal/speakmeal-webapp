"use client";
import React, { useState } from "react";
import Image from "next/image"; 
import { useAlert } from "../Components/Alert/useAlert";
import { createClient } from "../Utils/supabase/client";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordReset: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();
  const router = useRouter();

  /**
   * Allow users to reset their password
   */
  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      triggerAlert("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);
    
    // Under the hood supabase uses the code query parameter in teh url to identify the user and then resets its password
    const { error } = await supabase
        .auth
        .updateUser({
            password: newPassword
        });

    if (error){
        // error re-setting password -> user may not be logged in
        triggerAlert(error.message, "error");
        setIsLoading(false);
    } else {
        triggerAlert("Password reset successfully. You will be redirected to the login page.", "success");
        setTimeout(() => {
            router.push("/LogIn");
        }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col shadow-md">
      {/* Navbar */}
      <nav>
        <div className="container mx-auto p-4 flex justify-between items-center">
          <a className="flex items-center hover:text-purple-500" href="/">
            <Image
              src="/assets/logo.png"
              alt="Speak Meal Logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold ml-2 text-white">
              Speak Meal
            </span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="rounded-lg shadow-lg p-8 w-full max-w-md border-2 border-gray-600">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Reset Password
          </h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4 relative">
              <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                className="input input-bordered w-full"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 mt-7 flex items-center text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ?  <FaEyeSlash /> : <FaEye /> }
              </button>
            </div>
            <div className="mb-6 relative">
              <label
                className="block text-gray-700 mb-2"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="input input-bordered w-full"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 mt-7 flex items-center text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {isLoading ? (
              <div className="text-white">
                <LoadingIndicator />
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-[#4F19D6] text-white py-2 px-4 rounded-full hover:bg-purple-700 transition"
                onClick={resetPassword}
              >
                Reset Password
              </button>
            )}
          </form>

          <p className="text-center text-gray-600 mt-5">
            Remembered your password?
            <a
              className="text-[#4F19D6] hover:text-purple-700 font-semibold"
              href="/SignIn"
            >
              {" "}
              Sign In
            </a>
          </p>
        </div>
      </div>

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default PasswordReset;
