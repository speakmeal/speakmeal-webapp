"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Alert from "../Components/Alert/Alert";
import { useAlert } from "../Components/Alert/useAlert";
import { createClient } from "../Utils/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { useRouter } from "next/navigation";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();
  const router = useRouter();

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
        emailRedirectTo: `${window.location.origin}/SignIn`,
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
    // triggerAlert(
    //   "We've just sent you a confirmation email. Please check your inbox",
    //   "success",
    //   5000
    // );
    router.push("/onboarding/first-meal"); //redirect user to the onboarding flow automatically
  };

  /**
   * Sign up with OAuth providers
   */
  const signInWithProvider = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider, 
      options: {
        redirectTo: `${window.location.origin}/SignIn`
      }
    })

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }
  };

  const onPageLoad = async () => {
    //if user has already signed up, redirect them to the first meal onboarding page
    setIsLoading(true);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error){
      router.push('/onboarding/first-meal');
    } else {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    onPageLoad()
  }, []);

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

      <div className="flex flex-row justify-center w-full">
        {showAlert && <Alert message={message} type={type} />}
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="rounded-lg shadow-lg p-8 w-full max-w-md bg-black border-2 border-gray-600">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
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
              <div className="flex items-center justify-center bg-black text-[#4F19D6]">
                <span className="loading loading-ring loading-lg text-center"></span>
              </div>
            ) : (
              <div>
                <button
                  type="submit"
                  className="w-full bg-[#4F19D6] text-white py-2 px-4 rounded-full hover:bg-purple-700 transition"
                  onClick={signUp}
                >
                  Sign Up
                </button>

                <p className="text-gray-700 text-center my-5">Or</p>

                <button
                  type="button"
                  className="w-full bg-white text-gray-800 py-2 px-4 rounded-full hover:border-[#4F19D6] hover:border-2 transition flex items-center justify-center border border-gray-300"
                  onClick={() => signInWithProvider('google')}
                >
                  <FcGoogle className="mr-2" size={24} />
                  Sign Up with Google
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-gray-600 mt-5">
            Already have an account?
            <a
              className="text-[#4F19D6] hover:text-purple-700 font-semibold ml-2"
              href="/LogIn"
            >
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
