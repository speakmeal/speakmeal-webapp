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

//Github account:
//email: getspeakmeal@gmail.com 
//password: BigMeals33##


//Pushing + deploy to vercel:
// > git config user.email "getspeakmeal@gmail.com"
// > git push origin main

//Add bicep measurement