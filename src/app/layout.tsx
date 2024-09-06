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
// Test stripe subscription flow 
// Remove credit features
// Test cancelation flow
// Remove CC from stripe
// Handle customer deletion event on stripe webhook
// Fix error with the first meal logging (auth token missing)

//Add bicep measurement