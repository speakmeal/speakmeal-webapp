import { createClient } from "@/app/Utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

import { Resend } from "resend";

const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Trial Has Ended</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f0f4f3; margin: 0; padding: 0; color: #333;">
    <div style="max-width: 600px; margin: 30px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header Section -->
        <div style="background-color: #0f8a5f; padding: 25px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">Your Free Trial Has Ended</h1>
            <p style="margin: 5px 0 0; color: #f0f4f3; font-size: 16px;">Don’t miss out on your progress!</p>
        </div>
        
        <!-- Body Content -->
        <div style="padding: 30px 20px; text-align: center;">
            <h2 style="color: #0f8a5f; font-size: 22px;">Keep Your Momentum Going</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555;">
                Your 3-day free trial has come to an end, but your journey towards better health doesn’t have to stop here.
                Upgrade now to <strong>keep your streak going.</strong>
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px;">
                Don’t lose access to the tools that help you take control of your nutrition and hit your goals.
            </p>
            <!-- CTA Button -->
            <a href="https://tryspeakmeal.vercel.app" style="display: inline-block; padding: 15px 30px; font-size: 18px; color: white; background-color: #0f8a5f; text-decoration: none; border-radius: 5px; font-weight: bold;">Upgrade Now</a>
        </div>

        <!-- Features Section -->
        <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0;">
            <h3 style="text-align: center; color: #0f8a5f; font-size: 18px; margin-top: 0;">Why Upgrade to Premium?</h3>
            <ul style="list-style: none; padding: 0; text-align: left; color: #555; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 10px;">✔ <strong>Unlimited Voice Entries:</strong> Log meals with ease, hands-free.</li>
                <li style="margin-bottom: 10px;">✔ <strong>Advanced Progress Analytics:</strong> Track your macros and calorie trends over time.</li>
                <li style="margin-bottom: 10px;">✔ <strong>Personalized Goals:</strong> Tailored recommendations to keep you on track.</li>
                <li style="margin-bottom: 10px;">✔ <strong>Priority Support:</strong> We’re here for you whenever you need help.</li>
            </ul>
        </div>
        
        <!-- Footer Section -->
        <div style="background-color: #0f8a5f; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: white;">
                &copy; 2024 Speak Meal. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;


export async function POST(req: NextRequest) {
  //authenticate user
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    console.error("No token provided");
    return NextResponse.error();
  }

  console.log('>> Scheduling email');

  const supabaseServerClient = createClient();
  const { data: { user }, error } = await supabaseServerClient.auth.getUser(token);
  if (error || !user) {
    console.error("Error getting user")
    return NextResponse.error();
  }

  //TODO: ensure email is only scheduled once by getting the user's profile -> use database flag

  //schedule email in 3 days
  const resend = new Resend(process.env.RESEND_API_KEY);
  const TPlus3Days = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString();
  await resend.emails.send({
    from: "Adam <info@tech-cortex.co.uk>",
    to: [ user.email || '' ],
    subject: "Your Speakmeal trial has come to an end",
    html: emailTemplate,
    scheduledAt: TPlus3Days,
  });

  return NextResponse.json({
    success: true
  });
}
