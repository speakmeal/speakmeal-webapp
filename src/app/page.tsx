import Image from "next/image";
import { FaMicrophone } from "react-icons/fa";
import { Features } from "./Components/Features";
import Testimonial from "./Components/Testimonial";
import PriceBanner from "./Components/PriceBanner";
import Footer from "./Components/Footer";
import { permanentRedirect } from "next/navigation";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-100">
      {/* Navbar */}
      <nav className="bg-white">
        <div className="container mx-auto p-2 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/assets/logo.png"
              alt="Speak Meal Logo"
              width={50}
              height={50}
            />
            <span className="text-xl font-bold ml-2">Speak Meal</span>
          </div>

          <div className="hidden md:flex space-x-6">
            <a href="#home" className="text-gray-700 hover:text-purple-500">
              Home
            </a>
            <a href="#features" className="text-gray-700 hover:text-purple-500">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-purple-500">
              Pricing
            </a>
          </div>

          <div className="flex space-x-6 items-center">
            <a
              className="text-gray-700 hover:text-purple-500"
              href="/LogIn"
            >
              Login
            </a>

            <a className="bg-lime-400 text-white py-2 px-4 rounded-3xl hover:bg-purple-500" href="/SignIn">
              Sign Up
            </a>
          </div>

          <div className="md:hidden">
            <button className="text-gray-700 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main section */}
      <header className="text-center py-24" id="home">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight md:leading-snug">
            Never miss a calorie again <br />
            <span className="text-4xl md:text-5xl font-bold p-5">
              <span className="relative text-purple-600 after:absolute after:border-t-4 after:border-t-solid after:border-t-purple-500 after:rounded-[50%] after:h-[8px] after:w-full after:left-0 after:bottom-[-1px]">
                Track{" "}
              </span>
              your calories with <br /> just your voice
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            No manual input. No hassle. Simply speak. Speak out your meal, and
            see the magic!
          </p>
          <div className="mt-8 space-x-4">
            <button className="bg-lime-400 text-white py-2 px-6 rounded-3xl">
              <div className="flex flex-row space-x-3">
                <div>Try Me</div>

                <div className="mt-1">
                  <FaMicrophone />
                </div>
              </div>
            </button>
            <button className="bg-purple-600 text-white py-2 px-6 rounded-3xl">
              Experience Full Features
            </button>
          </div>
        </div>

        <div className="w-full flex justify-center mt-5">
          <img className="w-[90vw] md:w-[70vw] mt-5" src="/assets/background.png" />
        </div>
xf
        <div className="w-full mt-[10vh]" id="features">
          <Features />
        </div>
      </header>

      {/* Client reviews */}
      <div className="p-5">
        <h1 className="text-3xl md:text-4xl font-bold text-center">
          What our clients say about us
        </h1>
        <div className="carousel">
          <div className="carousel-item">
            <Testimonial
              quote="Speak Meal has revolutionized the way I help my clients track their nutrition. It's user-friendly, accurate, and saves a lot of time!"
              name="John Doe"
              job="Certified Personal Trainer"
            />
          </div>

          <div className="carousel-item">
            <Testimonial
              quote="The simplicity and efficiency of Speak Meal are unmatched. It has made meal tracking a breeze for my clients."
              name="Jane Smith"
              job="Accoountant"
            />
          </div>

          <div className="carousel-item">
            <Testimonial
              quote="I love how easy Speak Meal makes it for my clients to stay on top of their nutrition. The voice recognition is spot on!"
              name="Mike Johnson"
              job="Wellness Coach"
            />
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div id="pricing">
        <h1 className="text-3xl md:text-4xl font-bold text-center">Pricing</h1>
        <p className="text-center mt-2 text-lg">
          3 protein bars per month, that's all we ask
        </p>
        <PriceBanner name="Personal Plan" descriptionLines={
          ["Daily Logging", 
           "AI-Powered Meal Breakdowns",
           "Speech Recognition",  
           "Cancel Anytime"
          ]
        } monthlyPriceString="$7"
          callback={null}
          />
      </div>

      {/* Bottom hero section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center relative">
          <div className="flex justify-between items-center mb-8">
            <div>
              <img className="w-[20vw]" src="/assets/ex1.png" />
            </div>

            <div className="mb-8">
              <span className="bg-blue-100 text-blue-600 py-2 px-4 rounded-full text-lg font-semibold">
                GET STARTED
              </span>
            </div>

            <div>
              <div>
                <img className="w-[20vw]" src="/assets/ex2.png" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
            Transform your life, <br /> one meal at a time
          </h1>

          <button className="bg-lime-500 text-white py-3 px-6 rounded-full font-semibold hover:bg-lime-600 transition">
            Start Your Journey Today!
          </button>

          <div className="mt-12">
            <div className="flex items-center justify-center space-x-2">
              <img
                src="/assets/logo.png"
                alt="Speak Meal Logo"
                className="w-16 h-16"
              />
              <span className="text-4xl font-bold text-gray-800">
                Speak Meal
              </span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Add get started section
//Add footer
//Setup supabase and add auth
