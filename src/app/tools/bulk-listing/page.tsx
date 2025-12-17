"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";

interface ListingForm {
  user: string;
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

const initialForm: ListingForm = {
  user: "galahome",
  title: "",
  description: "",
  price: "",
  bedrooms: "1",
  bathrooms: "1",
  size: "",
  location: "",
  propertyType: "AP",
  offeringType: "RS",
  reraPermit: "",
};

const users = [
  { id: "galahome", name: "Gala Home", email: "info@galahome.ae" },
  { id: "vamrealty", name: "VAM Realty", email: "admin@realtyvam.com" },
];

const propertyTypes = [
  { value: "AP", label: "Apartment" },
  { value: "VH", label: "Villa" },
  { value: "TH", label: "Townhouse" },
  { value: "PH", label: "Penthouse" },
  { value: "LP", label: "Land/Plot" },
  { value: "FF", label: "Full Floor" },
  { value: "BU", label: "Bulk Units" },
  { value: "CD", label: "Compound" },
  { value: "DX", label: "Duplex" },
  { value: "WB", label: "Whole Building" },
  { value: "OF", label: "Office" },
  { value: "RE", label: "Retail" },
  { value: "WH", label: "Warehouse" },
  { value: "SH", label: "Shop" },
  { value: "SR", label: "Showroom" },
];

const offeringTypes = [
  { value: "RS", label: "For Sale" },
  { value: "RR", label: "For Rent" },
];

export default function BulkListingPage() {
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [listings, setListings] = useState<ListingForm[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const addToQueue = () => {
    if (!form.title || !form.price || !form.location) {
      setResult({ success: false, message: "Please fill in required fields: Title, Price, Location" });
      return;
    }
    setListings((prev) => [...prev, form]);
    setForm(initialForm);
    setResult({ success: true, message: "Listing added to queue" });
  };

  const removeFromQueue = (index: number) => {
    setListings((prev) => prev.filter((_, i) => i !== index));
  };

  const submitListings = async () => {
    if (listings.length === 0 && mode === "single") {
      setResult({ success: false, message: "No listings in queue" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bulk-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listings, user: form.user }),
      });
      const data = await response.json();
      setResult({ success: data.success, message: data.message });
      if (data.success) {
        setListings([]);
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to submit listings" });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setResult({ success: false, message: "Please select a CSV file" });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("user", form.user);

    try {
      const response = await fetch("/api/bulk-listing/csv", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult({ success: data.success, message: data.message });
    } catch (error) {
      setResult({ success: false, message: "Failed to upload CSV" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Property Finder Bulk Listing</h1>
            <p className="text-gray-400">Create single or bulk listings on Property Finder</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode("single")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === "single"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Single Listing
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === "bulk"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            CSV Upload
          </button>
        </div>

        {/* User Selection */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select User Account</label>
          <select
            name="user"
            value={form.user}
            onChange={handleInputChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
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

        {mode === "single" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6">Listing Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Stunning 2BR Apartment in Dubai Marina"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Property description..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (AED) *</label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleInputChange}
                      placeholder="1500000"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Size (sq.ft)</label>
                    <input
                      type="number"
                      name="size"
                      value={form.size}
                      onChange={handleInputChange}
                      placeholder="1200"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bedrooms</label>
                    <select
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i}>{i === 0 ? "Studio" : i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bathrooms</label>
                    <select
                      name="bathrooms"
                      value={form.bathrooms}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Dubai Marina, Dubai"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                    <select
                      name="propertyType"
                      value={form.propertyType}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {propertyTypes.map((type) => (
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
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {offeringTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">RERA Permit Number</label>
                  <input
                    type="text"
                    name="reraPermit"
                    value={form.reraPermit}
                    onChange={handleInputChange}
                    placeholder="Optional - Auto-fetch available"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={addToQueue}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Add to Queue
                </button>
              </div>
            </div>

            {/* Queue */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Listing Queue</h2>
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  {listings.length} items
                </span>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No listings in queue</p>
                  <p className="text-sm mt-1">Add listings using the form</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {listings.map((listing, index) => (
                    <div
                      key={index}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">{listing.title}</p>
                        <p className="text-gray-400 text-sm">
                          {listing.bedrooms} BR | AED {Number(listing.price).toLocaleString()} | {listing.location}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {listings.length > 0 && (
                <button
                  onClick={submitListings}
                  disabled={loading}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit {listings.length} Listing{listings.length > 1 ? "s" : ""} to Property Finder
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* CSV Upload Mode */
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Upload CSV File</h2>

            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium"
              >
                Click to upload
              </label>
              <span className="text-gray-500"> or drag and drop</span>
              <p className="text-gray-500 text-sm mt-2">CSV or Excel files supported</p>

              {csvFile && (
                <div className="mt-4 p-3 bg-gray-900 rounded-lg inline-flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {csvFile.name}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Required CSV Columns:</h3>
              <div className="flex flex-wrap gap-2">
                {["title", "price", "bedrooms", "bathrooms", "size", "location", "property_type", "offering_type"].map((col) => (
                  <span key={col} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleCsvUpload}
              disabled={loading || !csvFile}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                "Upload & Process CSV"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
