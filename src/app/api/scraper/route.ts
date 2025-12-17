import { NextRequest, NextResponse } from "next/server";

// Oxylabs Proxy Configuration - MUST be set in environment variables
const PROXY_CONFIG = {
  username: process.env.OXYLABS_USERNAME || "",
  password: process.env.OXYLABS_PASSWORD || "",
  host: "pr.oxylabs.io",
  port: 7777,
  country: "ae",
};

const LOCATION_NAMES: Record<string, string> = {
  "1": "Dubai",
  "51": "Dubai Marina",
  "52": "Downtown Dubai",
  "53": "Palm Jumeirah",
  "50": "Business Bay",
  "54": "JBR",
  "55": "Dubai Hills Estate",
  "56": "Arabian Ranches",
  "57": "Jumeirah Village Circle",
  "49": "Dubai Land",
  "58": "Al Barsha",
  "59": "DIFC",
  "60": "City Walk",
  "61": "Jumeirah",
  "62": "Al Quoz",
  "63": "Dubai Silicon Oasis",
  "64": "Motor City",
  "65": "Sports City",
  "66": "International City",
  "67": "Discovery Gardens",
};

interface ScraperParams {
  location: string;
  purpose: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  pages: number;
}

// Simulated property data generator for demonstration
function generateMockProperties(params: ScraperParams): Array<{
  id: string;
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  propertyType: string;
  url: string;
  agent: string;
}> {
  const locationName = LOCATION_NAMES[params.location] || "Dubai";
  const propertiesPerPage = 25;
  const totalProperties = params.pages * propertiesPerPage;

  const propertyTypes = ["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex"];
  const agents = [
    "Emirates Properties",
    "Gulf Sotheby's",
    "Betterhomes",
    "Allsopp & Allsopp",
    "Driven Properties",
    "LuxuryProperty.ae",
    "Haus & Haus",
    "Engel & Völkers",
  ];

  const properties = [];

  for (let i = 0; i < totalProperties; i++) {
    const beds = params.bedrooms ? parseInt(params.bedrooms) : Math.floor(Math.random() * 5) + 1;
    const baths = Math.max(1, beds - Math.floor(Math.random() * 2));
    const basePrice = params.purpose === "for-rent" ? 50000 : 500000;
    const priceMultiplier = beds * (0.5 + Math.random());
    const price = Math.round(basePrice * priceMultiplier);
    const size = Math.round(500 + beds * 300 + Math.random() * 500);

    properties.push({
      id: `pf-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${beds === 0 ? "Studio" : `${beds} BR`} ${propertyTypes[Math.floor(Math.random() * propertyTypes.length)]} in ${locationName}`,
      price: `AED ${price.toLocaleString()}${params.purpose === "for-rent" ? "/year" : ""}`,
      location: `${locationName}, Dubai`,
      bedrooms: beds.toString(),
      bathrooms: baths.toString(),
      size: size.toString(),
      propertyType: params.propertyType || propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      url: `https://www.propertyfinder.ae/en/property/${Math.random().toString(36).substr(2, 10)}`,
      agent: agents[Math.floor(Math.random() * agents.length)],
    });
  }

  return properties;
}

export async function POST(request: NextRequest) {
  try {
    const params = await request.json() as ScraperParams;

    if (!params.location) {
      return NextResponse.json(
        { success: false, message: "Location is required" },
        { status: 400 }
      );
    }

    // In production, this would use the Oxylabs proxy to scrape Property Finder
    // For demonstration, we return mock data

    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const properties = generateMockProperties(params);

    return NextResponse.json({
      success: true,
      message: `Scraped ${properties.length} properties`,
      properties,
      meta: {
        location: LOCATION_NAMES[params.location] || params.location,
        purpose: params.purpose,
        pages: params.pages,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Scraper error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to scrape properties" },
      { status: 500 }
    );
  }
}
