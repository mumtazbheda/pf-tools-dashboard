import { NextRequest, NextResponse } from "next/server";

const PF_API_BASE = "https://atlas.propertyfinder.com";

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json();

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: "API Key and Secret are required" },
        { status: 400 }
      );
    }

    // Get auth token
    const tokenResponse = await fetch(`${PF_API_BASE}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, apiSecret }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid API credentials" },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.accessToken;

    // Get user/agents
    const usersResponse = await fetch(`${PF_API_BASE}/v1/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!usersResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const usersData = await usersResponse.json();
    const agents: Array<{ id: number; name: string; publicProfileId: string }> = [];

    if (usersData.data && usersData.data.length > 0) {
      const user = usersData.data[0];
      if (user.agents) {
        for (const agent of user.agents) {
          agents.push({
            id: parseInt(agent.id),
            name: agent.name,
            publicProfileId: agent.publicProfileId || "",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      agents,
    });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      { success: false, message: "Connection test failed" },
      { status: 500 }
    );
  }
}
