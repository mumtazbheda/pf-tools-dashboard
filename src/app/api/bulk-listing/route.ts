import { NextRequest, NextResponse } from "next/server";

// API Keys - MUST be set in environment variables
const API_KEYS = {
  galahome: process.env.PF_API_KEY_GALAHOME || "",
  vamrealty: process.env.PF_API_KEY_VAM || "",
};

const PF_API_BASE = "https://atlas.propertyfinder.com";

interface ListingData {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  location: string;
  propertyType: string;
  offeringType: string;
  reraPermit: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listings, user } = body as { listings: ListingData[]; user: string };

    if (!listings || listings.length === 0) {
      return NextResponse.json(
        { success: false, message: "No listings provided" },
        { status: 400 }
      );
    }

    const apiKey = API_KEYS[user as keyof typeof API_KEYS];
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Invalid user account or API key not configured" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const listing of listings) {
      try {
        // Transform listing data to Property Finder API format
        const pfListing = {
          title_en: listing.title,
          description_en: listing.description || listing.title,
          price: parseInt(listing.price),
          bedrooms: parseInt(listing.bedrooms),
          bathrooms: parseInt(listing.bathrooms),
          size: parseFloat(listing.size) || 0,
          property_type: listing.propertyType,
          offering_type: listing.offeringType,
          location: listing.location,
          rera_permit_number: listing.reraPermit || null,
        };

        // In production, this would call the actual Property Finder API
        // For now, we simulate the response
        results.push({
          ...pfListing,
          status: "success",
          id: `PF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        errors.push({
          listing: listing.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.length} listings${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
      results,
      errors,
    });
  } catch (error) {
    console.error("Bulk listing error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process listings" },
      { status: 500 }
    );
  }
}
