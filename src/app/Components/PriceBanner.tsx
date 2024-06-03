"use client";

import { useRouter } from "next/navigation";

interface Props {
  name: string;
  descriptionLines: string[];
  monthlyPriceString: string;
  callback: (() => void) | null
};


export default function PriceBanner({name, descriptionLines, monthlyPriceString, callback}: Props) {
  const router = useRouter();

    return (
      <section className="py-16">
        <div className="container mx-auto px-4 md:w-1/2">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            {/* Personal Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white text-center py-6">
                <h3 className="text-2xl font-semibold">{name}</h3>
                <p className="mt-2">
                  <span className="text-4xl font-bold">{monthlyPriceString}</span>
                  <span className="text-lg"> / month</span>
                </p>
              </div>

              <div className="p-6 text-center">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Features</h4>
                <div className="text-gray-600 space-y-3">
                  {
                    descriptionLines.map((line, index) => (
                      <p key={index}>✓ {line}</p>
                    ))
                  }
                </div>

                <div className="mt-8">
                  <button className="bg-purple-600 text-white py-3 px-6 rounded-full transition-transform transform hover:scale-105"
                          onClick={() => {
                            if (callback){
                              callback();
                            } else {
                              router.push("/SignIn");
                            }
                          }}>Start Your Journey</button>
                  <p className="text-gray-500 mt-4">7-Day Free Trial</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  