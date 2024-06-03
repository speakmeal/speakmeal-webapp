"use client";
import React, { useState } from "react";
import Image from "next/image";
import Alert from "../Components/Alert/Alert";
import { useAlert } from "../Components/Alert/useAlert";
import { createClient } from "../Utils/supabase/client";
import LoadingIndicator from "../Components/LoadingIndicator";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();

  /**
   * Allow users to sign up with email and password and send them email confirmation link
   */
  const signUp = async () => {
    //inputs not filled in
    if (email.length === 0 || password.length === 0) {
      triggerAlert("You must enter an email and a password", "error");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth`,
      },
    });

    //sign up error
    if (error) {
      console.log(error);
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    setEmail("");
    setPassword("");

    //successful sign up
    setIsLoading(false);
    triggerAlert(
      "We've just sent you a confirmation email. Please check your inbox",
      "success",
      5000
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col shadow-md">
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
            <span className="text-xl font-bold ml-2 text-black">
              Speak Meal
            </span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Sign Up
          </h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="input input-bordered w-full"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="input input-bordered w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isLoading ? (
              <LoadingIndicator />
            ) : (
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-full hover:bg-purple-700 transition"
                onClick={signUp}
              >
                Sign In
              </button>
            )}
          </form>
          <p className="text-center text-gray-600 mt-5">
            Already have an account?
            <a
              className="text-purple-600 hover:text-purple-700 font-semibold"
              href="/LogIn"
            >
              {" "}
              Log In
            </a>
          </p>
        </div>
      </div>

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default SignIn;
