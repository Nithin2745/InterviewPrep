import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, trackerData } = await req.json();

    if (!email || !trackerData) {
      return NextResponse.json(
        { error: "Email and trackerData are required" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { email },
      data: {
        trackerData: JSON.stringify(trackerData),
      },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
