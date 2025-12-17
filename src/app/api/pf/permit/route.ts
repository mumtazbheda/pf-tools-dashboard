import { NextRequest, NextResponse } from "next/server";

const PF_API_BASE = "https://atlas.propertyfinder.com";

// Environment variables for API keys
const API_KEYS: Record<string, { key: string; secret: string }> = {
  galahome: {
    key: process.env.PF_API_KEY_GALAHOME || "",
    secret: process.env.PF_API_SECRET_GALAHOME || "",
  },
  vamrealty: {
    key: process.env.PF_API_KEY_VAM || "",
    secret: process.env.PF_API_SECRET_VAM || "",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { permitNumber, licenseNumber, userId } = await request.json();

    if (!permitNumber) {
      return NextResponse.json(
        { success: false, message: "Permit number is required" },
        { status: 400 }
      );
    }

    if (!licenseNumber) {
      return NextResponse.json(
        { success: false, message: "License number is required. Configure it in Settings." },
        { status: 400 }
      );
    }

    // Get API credentials for user
    const credentials = API_KEYS[userId];
    if (!credentials || !credentials.key) {
      return NextResponse.json(
        { success: false, message: "API credentials not configured for this user" },
        { status: 400 }
      );
    }

    // Get auth token
    const tokenResponse = await fetch(`${PF_API_BASE}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: credentials.key, apiSecret: credentials.secret }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.accessToken;

    // Fetch permit data
    const permitResponse = await fetch(
      `${PF_API_BASE}/v1/compliances/${permitNumber}/${licenseNumber}?permitType=rera`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!permitResponse.ok) {
      if (permitResponse.status === 404) {
        return NextResponse.json(
          { success: false, message: "Permit not found or not valid for your license" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to fetch permit data" },
        { status: 500 }
      );
    }

    const permitData = await permitResponse.json();

    if (!permitData.data || permitData.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "No permit data found" },
        { status: 404 }
      );
    }

    const permit = permitData.data[0];
    const property = permit.property || {};

    // Normalize bedrooms
    let bedrooms = property.roomsCount;
    if (bedrooms === 0 || bedrooms === "0") {
      bedrooms = "studio";
    } else if (typeof bedrooms === "number") {
      bedrooms = bedrooms.toString();
    }

    return NextResponse.json({
      success: true,
      permit: {
        permitNumber: permit.permitNumber,
        expiresAt: permit.expiresAt,
        price: property.value,
        bedrooms,
        size: property.size,
        locationName: property.locationName,
        listingType: property.listingType,
      },
    });
  } catch (error) {
    console.error("Permit lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to lookup permit" },
      { status: 500 }
    );
  }
}
