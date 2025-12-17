import Link from "next/link";

const tools = [
  {
    id: "bulk-listing",
    title: "Property Finder Bulk Listing",
    description: "Create bulk listings on Property Finder with automated image management via AWS S3",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: "from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
    features: ["Multi-user support", "AWS S3 Integration", "CSV/Excel Upload", "RERA Permit API"],
  },
  {
    id: "image-storage",
    title: "Image Storage & Editor",
    description: "Upload and manage property images on AWS S3 with CloudFront CDN delivery",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "from-green-500 to-green-600",
    hoverColor: "hover:from-green-600 hover:to-green-700",
    features: ["S3 Upload", "CloudFront HTTPS", "Image Rotation", "Multi-location"],
  },
  {
    id: "pf-scraper",
    title: "PF Scraper",
    description: "Extract property listings from Property Finder with location-based filtering",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
    color: "from-purple-500 to-purple-600",
    hoverColor: "hover:from-purple-600 hover:to-purple-700",
    features: ["Location Search", "Auto-permutation", "CSV Export", "Proxy Support"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PF Tools Dashboard</h1>
                <p className="text-xs text-gray-400">Property Finder Automation Suite</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full border border-green-400/20">
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Your Property Tools,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              One Dashboard
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Manage bulk listings, upload images to S3, and scrape property data - all from a single unified interface.
          </p>
        </div>

        {/* Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gray-800 rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 h-full flex flex-col">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 flex-grow">
                  {tool.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tool.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs font-medium text-gray-300 bg-gray-700/50 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center text-blue-400 font-medium text-sm group-hover:text-blue-300">
                  Open Tool
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Users", value: "2", sublabel: "Gala Home & VAM" },
            { label: "S3 Bucket", value: "Active", sublabel: "gala-home-property-images" },
            { label: "API Status", value: "Online", sublabel: "Property Finder Atlas" },
            { label: "Proxy", value: "Ready", sublabel: "Oxylabs Residential" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              PF Tools Dashboard - Built by Mumtaz Ahmed
            </p>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span>Gala Home</span>
              <span className="text-gray-700">|</span>
              <span>VAM Realty</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
