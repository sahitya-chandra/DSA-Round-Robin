import { NextRequest, NextResponse } from "next/server";
import db from "@repo/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, rating, message } = body;

    // Validate required fields
    if (!name || !email || !rating || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create feedback in database
    const feedback = await db.feedback.create({
      data: {
        name,
        email,
        rating: parseInt(rating),
        message,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Feedback submitted successfully",
        id: feedback.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
