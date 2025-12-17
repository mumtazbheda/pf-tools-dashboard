import { NextRequest, NextResponse } from "next/server";

const PF_API_BASE = "https://atlas.propertyfinder.com";

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
    const { query, userId } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, locations: [] });
    }

    // Get API credentials
    const credentials = API_KEYS[userId];
    if (!credentials || !credentials.key) {
      return NextResponse.json(
        { success: false, message: "API credentials not configured" },
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

    // Search locations
    const locationsResponse = await fetch(
      `${PF_API_BASE}/v1/locations?name=${encodeURIComponent(query)}&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!locationsResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to search locations" },
        { status: 500 }
      );
    }

    const locationsData = await locationsResponse.json();
    const locations = (locationsData.data || []).map((loc: { id: number; name: string; tree?: Array<{ name: string; type: string }> }) => {
      // Build full name from tree
      const cityNames = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
      let fullName = loc.name;

      if (loc.tree && loc.tree.length > 0) {
        const parts = loc.tree
          .filter((t) => !cityNames.includes(t.name))
          .map((t) => t.name);
        if (parts.length > 0) {
          fullName = parts.join(", ");
        }
      }

      return {
        id: loc.id,
        name: loc.name,
        fullName,
      };
    });

    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search locations" },
      { status: 500 }
    );
  }
}
