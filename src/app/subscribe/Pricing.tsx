"use client";

import type {
  Price,
  ProductWithPrices,
  SubscriptionWithProduct,
  Tables,
} from "../types_db";
import { getStripe } from "../Utils/stripe/client";
import { checkoutWithStripe } from "../Utils/stripe/server";
import { getErrorRedirect } from "../Utils/helpers";
import cn from "classnames";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import LoadingIndicator from "../Components/LoadingIndicator";
import PriceBanner from "../Components/PriceBanner";

interface Props {
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

export default function Pricing({ products }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();

  /**
   * Redirect user to the checkout page to buy a specific subscription
   */
  const handleStripeCheckout = async (price: Price) => {
    setIsLoading(true);

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      '/onboarding/first-meal'
    );

    if (errorRedirect) {
      setIsLoading(false);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setIsLoading(false);

      return router.push(
        getErrorRedirect(
          currentPath,
          "An unknown error occurred.",
          "Please try again later or contact a system administrator."
        )
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingIndicator />
      </div>
    );
  } else if (!products.length) {
    return (
      <>
        <section className="h-screen">
          <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8 mt-20">
            <div className="sm:flex sm:flex-col sm:align-center"></div>
            <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
              No subscriptions available.
            </p>
          </div>
        </section>
      </>
    );
  } else {
    return (
      <>
        <section>
          <div className="mt-10">
              {products.map((product, index) => {
                const price = product?.prices?.find(
                  (price) => price.interval === "month"
                );

                if (!price) return null;
                const priceString = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: price.currency!,
                  minimumFractionDigits: 0,
                }).format((price?.unit_amount || 0) / 100);

                return (
                  <div className="w-full" key={index}>
                    <PriceBanner
                      name={product.name || ""}
                      descriptionLines={product.description?.split("\\n") || []}
                      monthlyPriceString={priceString}
                      callback={() => {handleStripeCheckout(price)}}
                    />
                  </div>
                );
              })}
            </div>
          </section>
      </>
    );
  }
}
