import React from "react";
import { FaQuoteLeft } from "react-icons/fa";

interface Props {
  quote: string;
  name: string;
  job: string;
}

const Testimonial: React.FC<Props> = ({ quote, name, job }) => {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <FaQuoteLeft className="text-lime-500"/>
            </div>
          </div>
          <p className="text-lg text-gray-700 mb-4 h-32">
            {`"${quote}"`}
          </p>
          <div className="border-t border-gray-200 my-4"></div>
          <p className="font-bold text-gray-900">{name}</p>
          <p className="text-gray-500">{job}</p>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
