import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email, password, trackerData } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        trackerData: trackerData ? JSON.stringify(trackerData) : null,
      },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
      trackerData: user.trackerData ? JSON.parse(user.trackerData) : null,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
