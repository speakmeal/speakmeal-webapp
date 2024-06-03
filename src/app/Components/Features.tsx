import React from "react";

export function Features() {
  return (
    <>
      <div className="flex justify-center">
        <div className="w-[60vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Features & Benefits
          </h2>

          <p className="text-gray-600 mb-12">
            Our innovative app utilizes advanced voice recognition technology to
            make logging your meals effortless and accurate. Stay on top of your
            nutrition without the hassle of manual input.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-3">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <div className="w-32 h-32 mx-auto mb-4">
            <div className="rounded-full">
              <img src="/assets/natural_language.png" />
            </div>
          </div>
          <h3 className="text-xl mb-2">Natural language processing</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <div className="w-32 h-32 mx-auto mb-4">
            <div className="rounded-full">
              <img src="/assets/clock.png" />
            </div>
          </div>
          <h3 className="text-xl mb-2">
            Real-time calorie and nutrition breakdown
          </h3>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-32 h-32 mx-auto mb-4">
            <div className="rounded-full">
              <img src="/assets/logs.png" />
            </div>
          </div>
          <h3 className="text-xl mb-2">
            Keep accurate logs and set yourself targets
          </h3>
        </div>
      </div>
      <div className="text-center mt-12">
        <button className="bg-lime-500 text-white py-2 px-6 rounded-3xl">
          Get Started
        </button>
      </div>
    </>
  );
}
