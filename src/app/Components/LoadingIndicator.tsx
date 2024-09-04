import React from "react";

function LoadingIndicator() {
  return (
    <div
      className="flex items-center justify-center bg-black text-[#4F19D6] h-screen"
    >
      <span className="loading loading-ring text-center w-32"></span>
    </div>
  );
}

export default LoadingIndicator;
