"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  // '/' router should not be accessible, since landing page is deployed on framer, 
  // hence redirect the user to the sign up page
  const router = useRouter();
  useEffect(() => {
    router.push("/SignIn");
  }, [])
}