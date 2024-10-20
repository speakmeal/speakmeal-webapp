//server-side component
import { createClient } from "@/app/Utils/supabase/server";
import { permanentRedirect } from "next/navigation";
import React from "react";
import FirstMeasurementPage from "./FirstMeasurementPage";

const FirstMeasurement: React.FC = async () => {
  const supabase = createClient();
  const {data: {user}} = await supabase.auth.getUser();
  console.log(user);
  const { data: measurements, error } = await supabase.from("measurement").select("*");
  //row level security ensures that only the measurements for the user logged in are retrieved

  if (error) {
    console.log(error.message);
    return permanentRedirect("/dashboard");
  }

  console.log(measurements);

  if (measurements && measurements.length > 0) {
    //user has already recorded a measurement, hence redirect them to the dashboard
    return permanentRedirect("/dashboard");
  }

  return <FirstMeasurementPage />;
}

export default FirstMeasurement;