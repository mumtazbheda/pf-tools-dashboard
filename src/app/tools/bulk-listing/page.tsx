"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { listingsStorage, Listing, generateId, userSettingsStorage } from "@/lib/storage";
import { PROPERTY_TYPES, OFFERING_TYPES, CONSTRUCTION_STATUS, FURNISHING_TYPES, BEDROOM_OPTIONS, USERS, CSV_REQUIRED_COLUMNS } from "@/lib/constants";

type TabType = "manual" | "csv" | "listings";

interface ManualFormData {
  reference: string;
  permitNumber: string;
  locationName: string;
  locationId: string;
  propertyType: string;
  offeringType: string;
  constructionStatus: string;
  furnishingType: string;
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  price: string;
  agentName: string;
}

const initialFormData: ManualFormData = {
  reference: "",
  permitNumber: "",
  locationName: "",
  locationId: "",
  propertyType: "AP",
  offeringType: "RS",
  constructionStatus: "completed",
  furnishingType: "unfurnished",
  title: "",
  description: "",
  bedrooms: "1",
  bathrooms: "1",
  size: "",
  price: "",
  agentName: "",
};

export default function BulkListingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("manual");
  const [selectedUser, setSelectedUser] = useState(USERS[0].id);
  const [form, setForm] = useState<ManualFormData>(initialFormData);
  const [listings, setListings] = useState<Listing[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [permitLoading, setPermitLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<Array<{ id: number; name: string; fullName: string }>>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; status: string } | null>(null);

  // Load listings on mount
  useEffect(() => {
    setListings(listingsStorage.getAll());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch permit data from RERA
  const fetchPermitData = async () => {
    if (!form.permitNumber) {
      setResult({ success: false, message: "Please enter a permit number" });
      return;
    }

    const userSettings = userSettingsStorage.get(selectedUser);
    if (!userSettings?.licenseNumber) {
      setResult({ success: false, message: "Please configure your license number in Settings" });
      return;
    }

    setPermitLoading(true);
    try {
      const response = await fetch("/api/pf/permit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitNumber: form.permitNumber,
          licenseNumber: userSettings.licenseNumber,
          userId: selectedUser,
        }),
      });

      const data = await response.json();
      if (data.success && data.permit) {
        setForm((prev) => ({
          ...prev,
          price: data.permit.price?.toString() || prev.price,
          bedrooms: data.permit.bedrooms?.toString() || prev.bedrooms,
          size: data.permit.size?.toString() || prev.size,
          locationName: data.permit.locationName || prev.locationName,
        }));
        setResult({ success: true, message: "Permit data fetched successfully" });
      } else {
        setResult({ success: false, message: data.message || "Failed to fetch permit data" });
      }
    } catch (error) {
      setResult({ success: false, message: "Error fetching permit data" });
    } finally {
      setPermitLoading(false);
    }
  };

  // Search locations
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocationResults([]);
      return;
    }

    setLocationLoading(true);
    try {
      const response = await fetch("/api/pf/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId: selectedUser }),
      });

      const data = await response.json();
      if (data.success) {
        setLocationResults(data.locations || []);
      }
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Select location
  const selectLocation = (location: { id: number; name: string; fullName: string }) => {
    setForm((prev) => ({
      ...prev,
      locationName: location.fullName,
      locationId: location.id.toString(),
    }));
    setLocationResults([]);
  };

  // Create manual listing
  const createManualListing = async () => {
    if (!form.reference || !form.permitNumber || !form.title || !form.price) {
      setResult({ success: false, message: "Please fill in required fields: Reference, Permit Number, Title, Price" });
      return;
    }

    // Check for duplicate reference
    if (listingsStorage.getByReference(form.reference)) {
      setResult({ success: false, message: "A listing with this reference already exists" });
      return;
    }

    setLoading(true);
    try {
      const newListing: Listing = {
        id: generateId(),
        reference: form.reference,
        permitNumber: form.permitNumber,
        locationName: form.locationName,
        locationId: parseInt(form.locationId) || undefined,
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        size: form.size,
        price: form.price,
        agentName: form.agentName,
        status: "draft",
        createdAt: new Date().toISOString(),
        data: {
          offeringType: form.offeringType,
          constructionStatus: form.constructionStatus,
          furnishingType: form.furnishingType,
        },
      };

      listingsStorage.save(newListing);
      setListings(listingsStorage.getAll());
      setForm(initialFormData);
      setResult({ success: true, message: "Listing created as draft. Go to Listings tab to publish." });
    } catch (error) {
      setResult({ success: false, message: "Failed to create listing" });
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file selection
  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    // Parse CSV for preview
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      setResult({ success: false, message: "CSV file is empty or has no data rows" });
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const preview = lines.slice(1, 6).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    setCsvPreview(preview);

    // Validate columns
    const missingColumns = CSV_REQUIRED_COLUMNS.filter(
      (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      setResult({
        success: false,
        message: `Missing required columns: ${missingColumns.join(", ")}`,
      });
    } else {
      setResult({ success: true, message: `Found ${lines.length - 1} rows. Ready to upload.` });
    }
  };

  // Process CSV upload
  const processCsvUpload = async () => {
    if (!csvFile) {
      setResult({ success: false, message: "Please select a CSV file" });
      return;
    }

    setLoading(true);
    setBulkProgress({ current: 0, total: csvPreview.length, status: "Processing..." });

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        // Create listing from CSV row
        const listing: Listing = {
          id: generateId(),
          reference: row["Reference"] || `REF-${Date.now()}-${i}`,
          permitNumber: row["Permit_Number"] || "",
          locationName: row["Location_Name"] || "",
          title: row["Title_EN"] || "",
          description: row["Description_EN"] || "",
          propertyType: row["Property_Type"] || "AP",
          bedrooms: row["Bedrooms"] || "",
          bathrooms: row["Bathrooms"] || "1",
          size: row["Property_Size"] || "",
          price: row["Price"] || "",
          agentName: row["Agent_Name"] || "",
          status: "draft",
          createdAt: new Date().toISOString(),
        };

        listingsStorage.save(listing);
        setBulkProgress({ current: i, total: lines.length - 1, status: `Processing row ${i}...` });

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setListings(listingsStorage.getAll());
      setBulkProgress(null);
      setCsvFile(null);
      setCsvPreview([]);
      setResult({ success: true, message: `Successfully imported ${lines.length - 1} listings as drafts` });
    } catch (error) {
      setResult({ success: false, message: "Failed to process CSV file" });
      setBulkProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Publish listing to Property Finder
  const publishListing = async (listing: Listing) => {
    setLoading(true);
    try {
      const response = await fetch("/api/listings/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, userId: selectedUser }),
      });

      const data = await response.json();
      if (data.success) {
        listingsStorage.updateStatus(listing.id, "live", data.pfUrl);
        setListings(listingsStorage.getAll());
        setResult({ success: true, message: "Listing published successfully!" });
      } else {
        listingsStorage.updateStatus(listing.id, "failed", undefined, data.message);
        setListings(listingsStorage.getAll());
        setResult({ success: false, message: data.message || "Failed to publish listing" });
      }
    } catch (error) {
      setResult({ success: false, message: "Error publishing listing" });
    } finally {
      setLoading(false);
    }
  };

  // Delete listing
  const deleteListing = (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      listingsStorage.delete(id);
      setListings(listingsStorage.getAll());
      setResult({ success: true, message: "Listing deleted" });
    }
  };

  const tabs = [
    { id: "manual", label: "Manual Listing", icon: "📝" },
    { id: "csv", label: "CSV Upload", icon: "📁" },
    { id: "listings", label: `All Listings (${listings.length})`, icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Property Finder Listings</h1>
              <p className="text-gray-400">Create, upload, and manage your Property Finder listings</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>

        {/* User Selection */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300">Active User:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              result.success
                ? "bg-green-900/50 border border-green-700 text-green-400"
                : "bg-red-900/50 border border-red-700 text-red-400"
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Manual Listing Tab */}
        {activeTab === "manual" && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Create Manual Listing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reference *</label>
                  <input
                    type="text"
                    name="reference"
                    value={form.reference}
                    onChange={handleInputChange}
                    placeholder="Unique listing reference"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  />
                </div>

                {/* Permit Number with Lookup */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permit Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="permitNumber"
                      value={form.permitNumber}
                      onChange={handleInputChange}
                      placeholder="RERA permit number"
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                    <button
                      onClick={fetchPermitData}
                      disabled={permitLoading}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {permitLoading ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        "Lookup"
                      )}
                    </button>
                  </div>
                </div>

                {/* Location Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    name="locationName"
                    value={form.locationName}
                    onChange={(e) => {
                      handleInputChange(e);
                      searchLocations(e.target.value);
                    }}
                    placeholder="Search location..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  />
                  {locationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                      {locationResults.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => selectLocation(loc)}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-800"
                        >
                          {loc.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Type & Offering Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                    <select
                      name="propertyType"
                      value={form.propertyType}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Offering Type</label>
                    <select
                      name="offeringType"
                      value={form.offeringType}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {OFFERING_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Construction Status & Furnishing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Construction Status</label>
                    <select
                      name="constructionStatus"
                      value={form.constructionStatus}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {CONSTRUCTION_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Furnishing</label>
                    <select
                      name="furnishingType"
                      value={form.furnishingType}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {FURNISHING_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title (EN) *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="Property title in English"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (EN)</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Property description..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  />
                </div>

                {/* Bedrooms, Bathrooms, Size */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bedrooms</label>
                    <select
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {BEDROOM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bathrooms</label>
                    <select
                      name="bathrooms"
                      value={form.bathrooms}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Size (sq.ft)</label>
                    <input
                      type="number"
                      name="size"
                      value={form.size}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Price & Agent */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (AED) *</label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name</label>
                    <input
                      type="text"
                      name="agentName"
                      value={form.agentName}
                      onChange={handleInputChange}
                      placeholder="Agent name"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <button
                  onClick={createManualListing}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? "Creating..." : "Create Draft Listing"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload Tab */}
        {activeTab === "csv" && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Bulk CSV Upload</h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center mb-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-blue-400 hover:text-blue-300 font-medium">Click to upload CSV</span>
              </label>
              {csvFile && (
                <p className="mt-4 text-green-400">{csvFile.name} selected</p>
              )}
            </div>

            {/* Required Columns */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Required CSV Columns:</h3>
              <div className="flex flex-wrap gap-2">
                {CSV_REQUIRED_COLUMNS.map((col) => (
                  <span key={col} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">
                    {col}
                  </span>
                ))}
                <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-400 font-mono">
                  Bedrooms (optional)
                </span>
              </div>
            </div>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview (first 5 rows):</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900">
                      {Object.keys(csvPreview[0]).map((header) => (
                        <th key={header} className="px-3 py-2 text-left text-gray-400 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-700">
                        {Object.values(row).map((value, vIdx) => (
                          <td key={vIdx} className="px-3 py-2 text-gray-300 truncate max-w-[150px]">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Progress Bar */}
            {bulkProgress && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{bulkProgress.status}</span>
                  <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={processCsvUpload}
              disabled={loading || !csvFile}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? "Processing..." : "Upload & Create Draft Listings"}
            </button>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">All Listings</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-sm">
                  Draft: {listings.filter((l) => l.status === "draft").length}
                </span>
                <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm">
                  Live: {listings.filter((l) => l.status === "live").length}
                </span>
                <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm">
                  Failed: {listings.filter((l) => l.status === "failed").length}
                </span>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No listings yet. Create one using the Manual or CSV tab.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            listing.status === "live"
                              ? "bg-green-900/50 text-green-400"
                              : listing.status === "failed"
                              ? "bg-red-900/50 text-red-400"
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {listing.status.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">{listing.reference}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{listing.title}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {listing.bedrooms} BR | {listing.locationName} | AED {Number(listing.price).toLocaleString()}
                      </p>
                      {listing.pfListingUrl && (
                        <a
                          href={listing.pfListingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-xs hover:underline mt-1 inline-block"
                        >
                          View on Property Finder →
                        </a>
                      )}
                      {listing.errorMessage && (
                        <p className="text-red-400 text-xs mt-1">{listing.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.status === "draft" && (
                        <button
                          onClick={() => publishListing(listing)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
