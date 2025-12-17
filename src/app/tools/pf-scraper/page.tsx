"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import { LOCATION_IDS, SORT_OPTIONS } from "@/lib/constants";

interface ScrapedProperty {
  id: string;
  title: string;
  price: string;
  location: string;
  areaLocation: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  propertyType: string;
  url: string;
  agent: string;
  verified: boolean;
  permitNumber?: string;
  referenceNumber?: string;
  completionDate?: string;
  furnishing?: string;
  imageUrl?: string;
  pageNumber: number;
  positionOnPage: number;
}

const PROPERTY_TYPES_SCRAPER = [
  { value: "", label: "All Types" },
  { value: "1", label: "Apartment" },
  { value: "35", label: "Villa" },
  { value: "22", label: "Townhouse" },
  { value: "20", label: "Penthouse" },
  { value: "24", label: "Duplex" },
  { value: "42", label: "Compound" },
  { value: "14", label: "Land/Plot" },
];

const PURPOSES = [
  { value: "for-sale", label: "For Sale", pfValue: "1" },
  { value: "for-rent", label: "For Rent", pfValue: "2" },
];

const CONSTRUCTION_STATUS_SCRAPER = [
  { value: "", label: "Any Status" },
  { value: "completed", label: "Ready" },
  { value: "off_plan", label: "Off-Plan" },
];

export default function PFScraperPage() {
  const [location, setLocation] = useState("51");
  const [purpose, setPurpose] = useState("for-sale");
  const [propertyType, setPropertyType] = useState("");
  const [constructionStatus, setConstructionStatus] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("mr");
  const [pages, setPages] = useState("5");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [results, setResults] = useState<ScrapedProperty[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mode, setMode] = useState<"manual" | "url">("manual");
  const [directUrl, setDirectUrl] = useState("");

  // Build search URL
  const buildSearchUrl = () => {
    const locationName = LOCATION_IDS[location]?.toLowerCase().replace(/\s+/g, "-") || "dubai";
    let url = `https://www.propertyfinder.ae/en/${purpose}/properties-${locationName}.html`;

    const params: string[] = [];
    if (propertyType) params.push(`pt=${propertyType}`);
    if (bedrooms) params.push(`br=${bedrooms}`);
    if (minPrice) params.push(`pf=${minPrice}`);
    if (maxPrice) params.push(`pt=${maxPrice}`);
    if (constructionStatus) params.push(`cs=${constructionStatus}`);
    if (sortBy) params.push(`so=${sortBy}`);

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    return url;
  };

  const startScraping = async () => {
    setScraping(true);
    setProgress({ current: 0, total: parseInt(pages), status: "Starting..." });
    setResults([]);
    setResult(null);

    try {
      const response = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          locationName: LOCATION_IDS[location],
          purpose,
          propertyType,
          constructionStatus,
          bedrooms,
          minPrice,
          maxPrice,
          sortBy,
          pages: parseInt(pages),
          directUrl: mode === "url" ? directUrl : undefined,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") {
                setProgress({
                  current: data.current,
                  total: data.total,
                  status: data.status,
                });
              } else if (data.type === "properties") {
                setResults((prev) => [...prev, ...data.properties]);
              } else if (data.type === "complete") {
                setResult({
                  success: true,
                  message: `Scraped ${data.total} properties from ${data.pages} pages`,
                });
              } else if (data.type === "error") {
                setResult({ success: false, message: data.message });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to start scraping" });
    } finally {
      setScraping(false);
      setProgress({ current: 0, total: 0, status: "" });
    }
  };

  const exportToCsv = () => {
    if (results.length === 0) return;

    const headers = [
      "Scrape Date",
      "Location ID",
      "Area Location",
      "Property Type",
      "Bedrooms",
      "Bathrooms",
      "Size (sq.ft)",
      "Title",
      "Price",
      "Location",
      "Verified",
      "Completion Date",
      "Furnishing",
      "Permit Number",
      "Reference Number",
      "Agent",
      "URL",
      "Page Number",
      "Position",
    ];

    const csvContent = [
      headers.join(","),
      ...results.map((p) =>
        [
          new Date().toISOString().split("T")[0],
          location,
          `"${p.areaLocation || ""}"`,
          p.propertyType,
          p.bedrooms,
          p.bathrooms,
          p.size,
          `"${p.title.replace(/"/g, '""')}"`,
          `"${p.price}"`,
          `"${p.location}"`,
          p.verified ? "Yes" : "No",
          p.completionDate || "",
          p.furnishing || "",
          p.permitNumber || "",
          p.referenceNumber || "",
          `"${p.agent}"`,
          p.url,
          p.pageNumber,
          p.positionOnPage,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property_finder_${LOCATION_IDS[location]?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const appendToMaster = () => {
    // In browser, we store in localStorage
    const existingData = localStorage.getItem("pf_master_csv");
    const existing = existingData ? JSON.parse(existingData) : [];
    const combined = [...existing, ...results];
    localStorage.setItem("pf_master_csv", JSON.stringify(combined));
    setResult({ success: true, message: `Appended ${results.length} properties to master list (total: ${combined.length})` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
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
            <span className="text-gray-500 text-xs uppercase tracking-wider">Proxy</span>
            <p className="text-white font-mono text-sm">Oxylabs Residential</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Region</span>
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

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              mode === "manual" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            Manual Search
          </button>
          <button
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              mode === "url" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            Direct URL
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Parameters */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Search Parameters</h2>

            {mode === "url" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Property Finder URL</label>
                  <textarea
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    rows={3}
                    placeholder="Paste a Property Finder search URL..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pages to Scrape</label>
                  <select
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {[1, 2, 3, 5, 10, 15, 20, 25, 50].map((num) => (
                      <option key={num} value={num}>{num} pages (~{num * 25} listings)</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {Object.entries(LOCATION_IDS).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {PROPERTY_TYPES_SCRAPER.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Construction Status</label>
                  <select
                    value={constructionStatus}
                    onChange={(e) => setConstructionStatus(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {CONSTRUCTION_STATUS_SCRAPER.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value="">Any</option>
                    <option value="0">Studio</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>{num} BR</option>
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
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Any"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pages to Scrape</label>
                  <select
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  >
                    {[1, 2, 3, 5, 10, 15, 20, 25, 50].map((num) => (
                      <option key={num} value={num}>{num} pages (~{num * 25} listings)</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Generated URL Preview */}
            {mode === "manual" && (
              <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Generated URL:</p>
                <p className="text-xs text-purple-400 break-all">{buildSearchUrl()}</p>
              </div>
            )}

            <button
              onClick={startScraping}
              disabled={scraping}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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

          {/* Results */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Results</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  {results.length} properties
                </span>
                {results.length > 0 && (
                  <>
                    <button
                      onClick={exportToCsv}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={appendToMaster}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Add to Master
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {scraping && progress.total > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{progress.status}</span>
                  <span>Page {progress.current} of {progress.total}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {results.length === 0 && !scraping ? (
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium line-clamp-1">{property.title}</h3>
                          {property.verified && (
                            <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded">Verified</span>
                          )}
                        </div>
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
                        {(property.permitNumber || property.completionDate) && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {property.permitNumber && <span>Permit: {property.permitNumber}</span>}
                            {property.completionDate && <span>Completion: {property.completionDate}</span>}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-2">
                          Agent: {property.agent} | Page {property.pageNumber}, #{property.positionOnPage}
                        </p>
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
