"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";

interface ScrapedProperty {
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
}

const dubaiLocations = [
  { id: "1", name: "All Dubai" },
  { id: "51", name: "Dubai Marina" },
  { id: "52", name: "Downtown Dubai" },
  { id: "53", name: "Palm Jumeirah" },
  { id: "50", name: "Business Bay" },
  { id: "54", name: "JBR" },
  { id: "55", name: "Dubai Hills Estate" },
  { id: "56", name: "Arabian Ranches" },
  { id: "57", name: "Jumeirah Village Circle" },
  { id: "49", name: "Dubai Land" },
  { id: "58", name: "Al Barsha" },
  { id: "59", name: "DIFC" },
  { id: "60", name: "City Walk" },
  { id: "61", name: "Jumeirah" },
  { id: "62", name: "Al Quoz" },
  { id: "63", name: "Dubai Silicon Oasis" },
  { id: "64", name: "Motor City" },
  { id: "65", name: "Sports City" },
  { id: "66", name: "International City" },
  { id: "67", name: "Discovery Gardens" },
];

const propertyTypes = [
  { value: "", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "land", label: "Land" },
];

const purposes = [
  { value: "for-sale", label: "For Sale" },
  { value: "for-rent", label: "For Rent" },
];

export default function PFScraperPage() {
  const [location, setLocation] = useState("51");
  const [purpose, setPurpose] = useState("for-sale");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [pages, setPages] = useState("5");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ScrapedProperty[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const startScraping = async () => {
    setScraping(true);
    setProgress(0);
    setResults([]);
    setResult(null);

    try {
      const response = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          purpose,
          propertyType,
          minPrice,
          maxPrice,
          bedrooms,
          pages: parseInt(pages),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.properties);
        setProgress(100);
        setResult({
          success: true,
          message: `Successfully scraped ${data.properties.length} properties from ${pages} pages`,
        });
      } else {
        setResult({ success: false, message: data.message || "Scraping failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to start scraping" });
    } finally {
      setScraping(false);
    }
  };

  const exportToCsv = () => {
    if (results.length === 0) return;

    const headers = ["Title", "Price", "Location", "Bedrooms", "Bathrooms", "Size", "Property Type", "Agent", "URL"];
    const csvContent = [
      headers.join(","),
      ...results.map((p) =>
        [
          `"${p.title}"`,
          p.price,
          `"${p.location}"`,
          p.bedrooms,
          p.bathrooms,
          p.size,
          p.propertyType,
          `"${p.agent}"`,
          p.url,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property_finder_${location}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">PF Scraper</h1>
            <p className="text-gray-400">Extract property listings from Property Finder</p>
          </div>
        </div>

        {/* Proxy Info */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-6 flex flex-wrap gap-6">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Proxy Provider</span>
            <p className="text-white font-mono text-sm">Oxylabs Residential</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Proxy Region</span>
            <p className="text-white font-mono text-sm">UAE (ae)</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Status</span>
            <p className="text-green-400 font-medium text-sm">Ready</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Parameters */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Search Parameters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {dubaiLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {purposes.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Price</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="0">Studio</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>{num} BR</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pages to Scrape</label>
                <select
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[1, 2, 3, 5, 10, 15, 20, 25, 50].map((num) => (
                    <option key={num} value={num}>{num} pages (~{num * 25} listings)</option>
                  ))}
                </select>
              </div>

              <button
                onClick={startScraping}
                disabled={scraping}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {scraping ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scraping...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Start Scraping
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Results</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  {results.length} properties
                </span>
                {results.length > 0 && (
                  <button
                    onClick={exportToCsv}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {scraping && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Scraping in progress...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>No results yet</p>
                <p className="text-sm mt-1">Configure parameters and start scraping</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {results.map((property) => (
                  <div
                    key={property.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="text-white font-medium line-clamp-1">{property.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{property.location}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          <span className="text-purple-400 font-medium">{property.price}</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-400">{property.bedrooms} BR</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-400">{property.bathrooms} Bath</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-400">{property.size} sq.ft</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">Agent: {property.agent}</p>
                      </div>
                      <a
                        href={property.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
