import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Speak Meal",
  description: "Track your calories with just your voice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}


//supabase account:
//email: Getspeakmeal@gmail.com
//password: MsSAAS33#
//dbPassword: RobertoCalories10#


//Resend account:
//email: Getspeakmeal@gmail.com
//password: BigMsSAAS33#



//TODO: 
// Update subscription product description by running webhook locally
// Test stripe subscription flow 
//Add credit limit for free users (waiting for confirmation)
//Improve goals section with sliders, like in the onboarding page + add pre-determined ratios (e.g keto (80% protein, 15% fat, 5% carbs))

//Add bicep measurement
//Add upgrade button in account page for free users