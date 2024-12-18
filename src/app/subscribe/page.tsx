"use client";
import { createClient } from "../Utils/supabase/client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import Pricing from "./Pricing";
import { ProductWithPrices, SubscriptionWithProduct, TRIAL_PERIOD_DAYS } from "../types_db";

//User is signed in, but may or may not have a subscription
const Subscriptions: React.FC = () => {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [subscription, setSubscription] =
    useState<SubscriptionWithProduct | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  const onPageLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user){
      console.error("Could not get user");
      return;
    }

    //if user is still trialing, redirect them to their account
    const creationDate = new Date(user.created_at);
    const now = new Date();
    if (now.getTime() - creationDate.getTime() < TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000){
      router.push("/account");
      return;
    } 

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (subscription && !error) {
      if (["active", "trialing"].includes(subscription.status)){ //user already has a valid subscription, so redirect them to the account page
        console.error("User already has subscription");
        router.push("/account");
        return;
      } else { //user has cancelled subscritption so delete it from db to allow new one to be created
        const { error: subError } = await supabase
          .from("subscriptions")
          .delete()
          .eq("id", subscription.id);
        
        const { error: custError } = await supabase
          .from("customers")
          .delete()
          .eq("id", user?.id);
        
        if (subError || custError){
          console.error("Sub error: " + subError);
          console.error("Customer error: " + custError);
        } else {
          console.log("Deleted cancelled subscription");
        }
      }
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
    <div className="min-h-screen bg-gradient-to-b bg-black flex flex-col shadow-md">
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

          <button
            className="btn btn-error rounded-3xl text-white"
            onClick={ async () => {
              setIsLoading(true);
              await supabase.auth.signOut();
              router.push("/LogIn");
              setIsLoading(false);
            }}
          >
            Log Out
          </button>
        </div>
      </nav>

      <h1 className="text-center font-bold text-[#4F19D6] text-4xl mt-10">
        Subscribe
      </h1>

      <p className="text-center text-white text-xl px-20 mt-5">
        Your free trial has expired <br></br> Subscribe to continue recording your calories & meals with unlimited access
      </p>

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
};

export default Subscriptions;
