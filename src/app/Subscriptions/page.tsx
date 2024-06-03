"use client";
import { createClient } from "../Utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import Pricing from "./Pricing";
import { ProductWithPrices, SubscriptionWithProduct } from "../types_db";

//User is signed in, but may or may not have a subscription
function Subscriptions() {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [subscription, setSubscription] =
    useState<SubscriptionWithProduct | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  const onPageLoad = async () => {
    //check if the user already has a subscripton
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (subscription && !error) {
      //user already has a subscription, so redirect them to the dashboard page
      router.push("/Dashboard");
      setIsLoading(false);
      return;
    }

    //get all of the available subscription plans
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*, prices(*)")
      .eq("active", true)
      .eq("prices.active", true)
      .order("metadata->index")
      .order("unit_amount", { referencedTable: "prices" });

    if (productsError) {
      triggerAlert(productsError.message, "error");
      setIsLoading(false);
      return;
    }

    //store the user's subscription and the available plans in the component state
    setSubscription(subscription);
    setProducts(products);

    setIsLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

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

          <button
            className="btn btn-error rounded-3xl text-white"
            onClick={() => {
              supabase.auth.signOut();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {isLoading ? (
        <div className="flex flex-1 justify-center items-center">
          <LoadingIndicator />
        </div>
      ) : (
        <div>
          <Pricing products={products} subscription={subscription} />
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
}

export default Subscriptions;
