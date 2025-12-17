// Property Finder API Integration
import { PF_API_BASE } from "./constants";

interface TokenResponse {
  accessToken: string;
}

interface PermitData {
  permitNumber: string;
  expiresAt: string;
  property: {
    value: number;
    roomsCount: number;
    size: number;
    locationName: string;
    listingType: string;
  };
}

interface LocationResult {
  id: number;
  name: string;
  tree: Array<{ name: string; type: string }>;
}

interface Agent {
  id: number;
  name: string;
  publicProfileId: string;
}

// Get authentication token
export async function getAuthToken(apiKey: string, apiSecret: string): Promise<string> {
  const response = await fetch(`${PF_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiKey, apiSecret }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data: TokenResponse = await response.json();
  return data.accessToken;
}

// Fetch permit data from RERA
export async function fetchPermitData(
  token: string,
  permitNumber: string,
  licenseNumber: string
): Promise<PermitData | null> {
  const response = await fetch(
    `${PF_API_BASE}/v1/compliances/${permitNumber}/${licenseNumber}?permitType=rera`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Permit lookup failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  return null;
}

// Search locations
export async function searchLocations(
  token: string,
  query: string
): Promise<LocationResult[]> {
  const response = await fetch(
    `${PF_API_BASE}/v1/locations?name=${encodeURIComponent(query)}&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Location search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// Get user agents
export async function getAgents(token: string): Promise<Agent[]> {
  const response = await fetch(`${PF_API_BASE}/v1/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.status}`);
  }

  const data = await response.json();
  const agents: Agent[] = [];

  if (data.data && data.data.length > 0) {
    const user = data.data[0];
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

  return agents;
}

// Create listing
export async function createListing(
  token: string,
  listingData: {
    reference: string;
    title: string;
    description: string;
    propertyType: string;
    offeringType: string;
    projectStatus: string;
    furnishingType: string;
    bedrooms: number;
    bathrooms: number;
    size: number;
    price: number;
    locationId: number;
    permitNumber: string;
    images: string[];
    createdById: number;
    assignedToId: number;
    amenities?: string[];
  }
): Promise<{ id: string; success: boolean; error?: string }> {
  // Map property type to category
  const category = listingData.offeringType === "RS" ? "residential_sale" : "residential_rent";

  // Map bedrooms
  const bedrooms = listingData.bedrooms === 0 ? "studio" : listingData.bedrooms.toString();

  const payload = {
    reference: listingData.reference,
    category,
    type: listingData.propertyType.toLowerCase(),
    projectStatus: listingData.projectStatus || "completed",
    furnishingType: listingData.furnishingType || "unfurnished",
    title: {
      en: listingData.title,
    },
    description: {
      en: listingData.description,
    },
    bedrooms,
    bathrooms: listingData.bathrooms,
    size: listingData.size,
    price: {
      type: listingData.offeringType === "RS" ? "fixed" : "yearly",
      amounts: {
        [listingData.offeringType === "RS" ? "sale" : "rent"]: listingData.price,
      },
    },
    location: {
      id: listingData.locationId,
    },
    media: {
      images: listingData.images.map((url) => ({
        original: { url },
      })),
    },
    compliance: {
      type: "rera",
      listingAdvertisementNumber: listingData.permitNumber,
    },
    amenities: listingData.amenities || [],
    createdBy: {
      id: listingData.createdById,
    },
    assignedTo: {
      id: listingData.assignedToId,
    },
  };

  const response = await fetch(`${PF_API_BASE}/v1/listings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { id: "", success: false, error: errorText };
  }

  const data = await response.json();
  return { id: data.data?.id || data.id, success: true };
}

// Publish listing
export async function publishListing(
  token: string,
  listingId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const response = await fetch(`${PF_API_BASE}/v1/listings/${listingId}/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: errorText };
  }

  // Wait a bit for the URL to be generated
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Fetch the listing to get the live URL
  const listingResponse = await fetch(`${PF_API_BASE}/v1/listings/${listingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (listingResponse.ok) {
    const listingData = await listingResponse.json();
    const pfUrl = listingData.data?.portals?.propertyfinder?.url;
    return { success: true, url: pfUrl };
  }

  return { success: true };
}

// Get leads
export async function getLeads(
  token: string,
  page: number = 1,
  limit: number = 50
): Promise<{ leads: Record<string, unknown>[]; total: number }> {
  const response = await fetch(
    `${PF_API_BASE}/v1/leads?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch leads: ${response.status}`);
  }

  const data = await response.json();
  return {
    leads: data.data || [],
    total: data.meta?.total || 0,
  };
}

// Get listings
export async function getListings(
  token: string,
  status?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ listings: Record<string, unknown>[]; total: number }> {
  let url = `${PF_API_BASE}/v1/listings?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.status}`);
  }

  const data = await response.json();
  return {
    listings: data.data || [],
    total: data.meta?.total || 0,
  };
}

// Helper to normalize bedrooms
export function normalizeBedrooms(value: number | string): string {
  const num = typeof value === "string" ? parseInt(value) : value;
  if (isNaN(num) || num === 0) return "studio";
  return num.toString();
}

// Helper to build location display name from tree
export function buildLocationName(tree: Array<{ name: string; type: string }>): string {
  const cityNames = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
  const parts = tree
    .filter((t) => !cityNames.includes(t.name))
    .map((t) => t.name);
  return parts.join(", ");
}
