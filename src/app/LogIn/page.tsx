"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image"; // Assuming you are using Next.js for images
import { useAlert } from "../Components/Alert/useAlert";
import { createClient } from "../Utils/supabase/client";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

const LogIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();
  const router = useRouter();

  /**
   * Allow users to log in with email and password
   */
  const logIn = async () => {
    if (email === "" || password === "") {
      triggerAlert("You must enter an email and a password", "error");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    //error loggin in
    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    //redirect user to dashboard after successful log in
    router.push("/dashboard");
  };

  /**
   * Allow users to log in with external provider
   */
  const logInWithProvider = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider, 
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/LogIn`
      }
    });

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }
  }

  /**
   * Trigger password reset email
   */
  const resetPassword = async () => {
    //check if the email is valid
    const isEmailValid = String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );

    setIsLoading(true);
    if (isEmailValid) {
      //email is valid so send reset email
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/PasswordReset`,
      });

      triggerAlert(`We've sent a password reset email to ${email}`, "normal");
    } else {
      triggerAlert("You must enter a valid email in the email field", "error");
    }
    setIsLoading(false);
  };

  const onPageLoad = async () => {
    //if user is already logged in, redirect them to the dashboard
    setIsLoading(true);

    const { data: { user }, error } = await supabase.auth.getUser();
    if (user && !error){
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    onPageLoad();
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
        <div className="rounded-lg shadow-lg p-8 w-full max-w-md border-2 border-gray-600">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Log In
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
                  onClick={logIn}
                >
                  Log In
                </button>

                <p className="text-gray-700 text-center my-5">Or</p>

                <button
                  type="button"
                  className="w-full bg-white text-gray-800 py-2 px-4 rounded-full hover:border-[#4F19D6] hover:border-2 transition flex items-center justify-center border border-gray-300"
                  onClick={() => logInWithProvider('google')}
                >
                  <FcGoogle className="mr-2" size={24} />
                  Log In with Google
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-gray-600 mt-5">
            {"Don't have an account?"}
            <a
              className="text-[#4F19D6] hover:text-purple-700 font-semibold"
              href="/SignIn"
            >
              {" "}
              Sign Up
            </a>
          </p>

          <p className="text-center text-gray-600 mt-2">
            Forgot your password?
            <button
              className="text-[#4F19D6] hover:text-purple-700 font-semibold ml-1"
              onClick={resetPassword}
            >
              Reset Password
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
