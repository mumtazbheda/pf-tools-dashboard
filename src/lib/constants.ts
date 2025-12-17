// Property Finder API Configuration
export const PF_API_BASE = "https://atlas.propertyfinder.com";

// Property Types mapping
export const PROPERTY_TYPES = [
  { value: "AP", label: "Apartment", pfValue: 1 },
  { value: "VH", label: "Villa", pfValue: 35 },
  { value: "TH", label: "Townhouse", pfValue: 22 },
  { value: "PH", label: "Penthouse", pfValue: 20 },
  { value: "LP", label: "Land/Plot", pfValue: 14 },
  { value: "FF", label: "Full Floor", pfValue: 21 },
  { value: "BU", label: "Bulk Units", pfValue: 43 },
  { value: "CD", label: "Compound", pfValue: 42 },
  { value: "DX", label: "Duplex", pfValue: 24 },
  { value: "WB", label: "Whole Building", pfValue: 3 },
  { value: "OF", label: "Office", pfValue: 5 },
  { value: "RE", label: "Retail", pfValue: 6 },
  { value: "WH", label: "Warehouse", pfValue: 8 },
  { value: "SH", label: "Shop", pfValue: 9 },
  { value: "SR", label: "Showroom", pfValue: 10 },
];

// Offering Types
export const OFFERING_TYPES = [
  { value: "RS", label: "For Sale" },
  { value: "RR", label: "For Rent" },
];

// Construction Status
export const CONSTRUCTION_STATUS = [
  { value: "completed", label: "Ready" },
  { value: "off_plan", label: "Off-Plan" },
];

// Furnishing Types
export const FURNISHING_TYPES = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
];

// Bedroom options
export const BEDROOM_OPTIONS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
  { value: "6", label: "6 Bedrooms" },
  { value: "7", label: "7+ Bedrooms" },
];

// Location IDs for scraper
export const LOCATION_IDS: Record<string, string> = {
  "1": "Dubai",
  "2": "Abu Dhabi",
  "3": "Sharjah",
  "4": "Ajman",
  "5": "Ras Al Khaimah",
  "6": "Fujairah",
  "7": "Umm Al Quwain",
  "49": "Dubai Land",
  "50": "Business Bay",
  "51": "Dubai Marina",
  "52": "Downtown Dubai",
  "53": "Palm Jumeirah",
  "54": "Jumeirah Beach Residence",
  "55": "Dubai Hills Estate",
  "56": "Arabian Ranches",
  "57": "Jumeirah Village Circle",
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
  "68": "Dubai Investment Park",
  "69": "Jumeirah Lake Towers",
  "70": "The Greens",
  "71": "The Views",
  "72": "Emirates Hills",
  "73": "Meadows",
  "74": "Springs",
  "75": "Dubai Creek Harbour",
  "76": "Mohammed Bin Rashid City",
  "77": "Meydan",
  "78": "Al Furjan",
  "79": "Town Square",
  "80": "Damac Hills",
};

// Users configuration
export const USERS = [
  {
    id: "galahome",
    name: "Gala Home",
    email: "info@galahome.ae",
    licenseNumber: "CN-1100636"
  },
  {
    id: "vamrealty",
    name: "VAM Realty",
    email: "admin@realtyvam.com",
    licenseNumber: ""
  },
];

// CSV Required Columns for bulk upload
export const CSV_REQUIRED_COLUMNS = [
  "Reference",
  "Permit_Number",
  "Agent_Name",
  "Property_Type",
  "Location_Name",
  "Title_EN",
  "Description_EN",
  "Bathrooms",
  "Property_Size",
];

// AWS S3 Configuration
export const S3_CONFIG = {
  bucket: "gala-home-property-images",
  region: "us-east-1",
  cloudfrontDomain: "d1g4mqni3902xv.cloudfront.net",
};

// Scraper configuration
export const SCRAPER_CONFIG = {
  proxyHost: "pr.oxylabs.io",
  proxyPort: 7777,
  proxyCountry: "ae",
  maxRetries: 3,
  timeout: 60000,
  delayBetweenPages: 2000,
  delayBetweenRequests: 10000,
};

// Sort options for scraper
export const SORT_OPTIONS = [
  { value: "mr", label: "Featured" },
  { value: "nd", label: "Newest" },
  { value: "pa", label: "Price: Low to High" },
  { value: "pd", label: "Price: High to Low" },
];
