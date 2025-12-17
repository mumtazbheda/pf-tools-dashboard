"use client";

import { useState, useCallback } from "react";
import BackButton from "@/components/BackButton";

interface UploadedImage {
  id: string;
  name: string;
  s3Url: string;
  cloudfrontUrl: string;
  location: string;
  uploadedAt: string;
}

const locations = [
  "Dubai Marina",
  "Downtown Dubai",
  "Palm Jumeirah",
  "Business Bay",
  "JBR",
  "Dubai Hills",
  "Arabian Ranches",
  "Jumeirah Village Circle",
  "Dubai Land",
  "Al Barsha",
  "DIFC",
  "City Walk",
  "Other",
];

export default function ImageStoragePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("Dubai Marina");
  const [customLocation, setCustomLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setResult({ success: false, message: "Please select images to upload" });
      return;
    }

    const uploadLocation = location === "Other" ? customLocation : location;
    if (!uploadLocation) {
      setResult({ success: false, message: "Please specify a location" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("location", uploadLocation);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setUploadedImages((prev) => [...data.images, ...prev]);
        setSelectedFiles([]);
        setResult({ success: true, message: `Successfully uploaded ${data.images.length} images` });
      } else {
        setResult({ success: false, message: data.message || "Upload failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to upload images" });
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setResult({ success: true, message: "URL copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Image Storage & Editor</h1>
            <p className="text-gray-400">Upload images to AWS S3 with CloudFront CDN delivery</p>
          </div>
        </div>

        {/* S3 Info */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-6 flex flex-wrap gap-6">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">S3 Bucket</span>
            <p className="text-white font-mono text-sm">gala-home-property-images</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">CloudFront Domain</span>
            <p className="text-white font-mono text-sm">d1g4mqni3902xv.cloudfront.net</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Region</span>
            <p className="text-white font-mono text-sm">us-east-1</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Upload Images</h2>

            {/* Location Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Property Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              {location === "Other" && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Enter custom location"
                  className="w-full mt-3 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? "border-green-500 bg-green-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-green-400 hover:text-green-300 font-medium"
              >
                Click to upload
              </label>
              <span className="text-gray-500"> or drag and drop</span>
              <p className="text-gray-500 text-sm mt-2">PNG, JPG, WEBP up to 10MB each</p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-900 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white text-sm truncate max-w-[200px]">{file.name}</p>
                          <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={uploadImages}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading to S3...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? "s" : ""} to S3
                </>
              )}
            </button>
          </div>

          {/* Uploaded Images */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Uploaded Images</h2>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                {uploadedImages.length} images
              </span>
            </div>

            {uploadedImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No images uploaded yet</p>
                <p className="text-sm mt-1">Upload images to see them here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                        <img
                          src={image.cloudfrontUrl}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-white font-medium truncate">{image.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{image.location}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => copyUrl(image.cloudfrontUrl)}
                            className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
                          >
                            Copy HTTPS URL
                          </button>
                          <a
                            href={image.cloudfrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            Open
                          </a>
                        </div>
                      </div>
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
