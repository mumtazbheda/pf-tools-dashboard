// Simple localStorage-based storage for client-side persistence
// In production, this should be replaced with a proper database

export interface Listing {
  id: string;
  reference: string;
  permitNumber: string;
  locationName: string;
  locationId?: number;
  title: string;
  description: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  price: string;
  agentName: string;
  status: "draft" | "live" | "failed";
  pfListingId?: string;
  pfListingUrl?: string;
  errorMessage?: string;
  createdAt: string;
  publishedAt?: string;
  data?: Record<string, unknown>;
}

export interface Lead {
  id: string;
  listingId?: string;
  listingReference: string;
  locationName: string;
  leadType: string;
  leadDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  status: string;
  notes?: string;
}

export interface ImageFolder {
  id: string;
  locationName: string;
  locationId?: number;
  folderPath: string;
  imageCount: number;
  lastUsedIndex: number;
}

export interface StoredImage {
  id: string;
  locationName: string;
  s3Url: string;
  cloudfrontUrl: string;
  filename: string;
  uploadedAt: string;
}

export interface UserSettings {
  userId: string;
  pfApiKey: string;
  pfApiSecret: string;
  licenseNumber: string;
  agents: Array<{ id: number; name: string; publicProfileId: string }>;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  htmlContent: string;
  cssContent?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  listings: "pf_listings",
  leads: "pf_leads",
  imageFolders: "pf_image_folders",
  images: "pf_images",
  userSettings: "pf_user_settings",
  templates: "pf_templates",
  scraperResults: "pf_scraper_results",
};

// Helper to safely access localStorage (handles SSR)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
};

// Listings Storage
export const listingsStorage = {
  getAll: (): Listing[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.listings);
    return data ? JSON.parse(data) : [];
  },

  save: (listing: Listing): void => {
    const listings = listingsStorage.getAll();
    const existingIndex = listings.findIndex((l) => l.id === listing.id);
    if (existingIndex >= 0) {
      listings[existingIndex] = listing;
    } else {
      listings.push(listing);
    }
    safeLocalStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings));
  },

  saveAll: (listings: Listing[]): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings));
  },

  getByReference: (reference: string): Listing | undefined => {
    return listingsStorage.getAll().find((l) => l.reference === reference);
  },

  getByStatus: (status: string): Listing[] => {
    return listingsStorage.getAll().filter((l) => l.status === status);
  },

  delete: (id: string): void => {
    const listings = listingsStorage.getAll().filter((l) => l.id !== id);
    safeLocalStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings));
  },

  updateStatus: (id: string, status: "draft" | "live" | "failed", pfListingUrl?: string, errorMessage?: string): void => {
    const listings = listingsStorage.getAll();
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      listing.status = status;
      if (pfListingUrl) listing.pfListingUrl = pfListingUrl;
      if (errorMessage) listing.errorMessage = errorMessage;
      if (status === "live") listing.publishedAt = new Date().toISOString();
      listingsStorage.saveAll(listings);
    }
  },
};

// Leads Storage
export const leadsStorage = {
  getAll: (): Lead[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.leads);
    return data ? JSON.parse(data) : [];
  },

  save: (lead: Lead): void => {
    const leads = leadsStorage.getAll();
    const existingIndex = leads.findIndex((l) => l.id === lead.id);
    if (existingIndex >= 0) {
      leads[existingIndex] = lead;
    } else {
      leads.push(lead);
    }
    safeLocalStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  },

  saveAll: (leads: Lead[]): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  },

  getByListing: (listingReference: string): Lead[] => {
    return leadsStorage.getAll().filter((l) => l.listingReference === listingReference);
  },

  delete: (id: string): void => {
    const leads = leadsStorage.getAll().filter((l) => l.id !== id);
    safeLocalStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  },
};

// Image Folders Storage
export const imageFoldersStorage = {
  getAll: (): ImageFolder[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.imageFolders);
    return data ? JSON.parse(data) : [];
  },

  save: (folder: ImageFolder): void => {
    const folders = imageFoldersStorage.getAll();
    const existingIndex = folders.findIndex((f) => f.locationName === folder.locationName);
    if (existingIndex >= 0) {
      folders[existingIndex] = folder;
    } else {
      folders.push(folder);
    }
    safeLocalStorage.setItem(STORAGE_KEYS.imageFolders, JSON.stringify(folders));
  },

  getByLocation: (locationName: string): ImageFolder | undefined => {
    return imageFoldersStorage.getAll().find((f) => f.locationName === locationName);
  },

  incrementLastUsedIndex: (locationName: string): number => {
    const folders = imageFoldersStorage.getAll();
    const folder = folders.find((f) => f.locationName === locationName);
    if (folder) {
      folder.lastUsedIndex = (folder.lastUsedIndex + 1) % folder.imageCount;
      imageFoldersStorage.save(folder);
      return folder.lastUsedIndex;
    }
    return 0;
  },
};

// Images Storage
export const imagesStorage = {
  getAll: (): StoredImage[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.images);
    return data ? JSON.parse(data) : [];
  },

  save: (image: StoredImage): void => {
    const images = imagesStorage.getAll();
    images.push(image);
    safeLocalStorage.setItem(STORAGE_KEYS.images, JSON.stringify(images));
  },

  saveAll: (images: StoredImage[]): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.images, JSON.stringify(images));
  },

  getByLocation: (locationName: string): StoredImage[] => {
    return imagesStorage.getAll().filter((i) => i.locationName === locationName);
  },

  delete: (id: string): void => {
    const images = imagesStorage.getAll().filter((i) => i.id !== id);
    safeLocalStorage.setItem(STORAGE_KEYS.images, JSON.stringify(images));
  },

  getNextImageForLocation: (locationName: string): StoredImage | null => {
    const images = imagesStorage.getByLocation(locationName);
    if (images.length === 0) return null;

    const folder = imageFoldersStorage.getByLocation(locationName);
    const index = folder ? folder.lastUsedIndex : 0;
    const nextIndex = imageFoldersStorage.incrementLastUsedIndex(locationName);

    return images[nextIndex % images.length];
  },
};

// User Settings Storage
export const userSettingsStorage = {
  get: (userId: string): UserSettings | null => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.userSettings);
    const settings: UserSettings[] = data ? JSON.parse(data) : [];
    return settings.find((s) => s.userId === userId) || null;
  },

  save: (settings: UserSettings): void => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.userSettings);
    const allSettings: UserSettings[] = data ? JSON.parse(data) : [];
    const existingIndex = allSettings.findIndex((s) => s.userId === settings.userId);
    if (existingIndex >= 0) {
      allSettings[existingIndex] = settings;
    } else {
      allSettings.push(settings);
    }
    safeLocalStorage.setItem(STORAGE_KEYS.userSettings, JSON.stringify(allSettings));
  },

  getAll: (): UserSettings[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.userSettings);
    return data ? JSON.parse(data) : [];
  },
};

// Templates Storage
export const templatesStorage = {
  getAll: (): Template[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.templates);
    return data ? JSON.parse(data) : [];
  },

  save: (template: Template): void => {
    const templates = templatesStorage.getAll();
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.push(template);
    }
    safeLocalStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
  },

  delete: (id: string): void => {
    const templates = templatesStorage.getAll().filter((t) => t.id !== id);
    safeLocalStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
  },

  getById: (id: string): Template | undefined => {
    return templatesStorage.getAll().find((t) => t.id === id);
  },

  getByCategory: (category: string): Template[] => {
    return templatesStorage.getAll().filter((t) => t.category === category);
  },
};

// Scraper Results Storage
export const scraperStorage = {
  getResults: (): Record<string, unknown>[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.scraperResults);
    return data ? JSON.parse(data) : [];
  },

  saveResults: (results: Record<string, unknown>[]): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.scraperResults, JSON.stringify(results));
  },

  appendResults: (newResults: Record<string, unknown>[]): void => {
    const existing = scraperStorage.getResults();
    const combined = [...existing, ...newResults];
    scraperStorage.saveResults(combined);
  },

  clearResults: (): void => {
    safeLocalStorage.setItem(STORAGE_KEYS.scraperResults, JSON.stringify([]));
  },
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
