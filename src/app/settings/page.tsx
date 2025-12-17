"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { userSettingsStorage, UserSettings } from "@/lib/storage";
import { USERS } from "@/lib/constants";

export default function SettingsPage() {
  const [selectedUser, setSelectedUser] = useState(USERS[0].id);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [agents, setAgents] = useState<Array<{ id: number; name: string; publicProfileId: string }>>([]);

  useEffect(() => {
    loadSettings(selectedUser);
  }, [selectedUser]);

  const loadSettings = (userId: string) => {
    const settings = userSettingsStorage.get(userId);
    if (settings) {
      setApiKey(settings.pfApiKey);
      setApiSecret(settings.pfApiSecret);
      setLicenseNumber(settings.licenseNumber);
      setAgents(settings.agents || []);
    } else {
      // Load default values for known users
      const user = USERS.find(u => u.id === userId);
      setApiKey("");
      setApiSecret("");
      setLicenseNumber(user?.licenseNumber || "");
      setAgents([]);
    }
  };

  const saveSettings = () => {
    const settings: UserSettings = {
      userId: selectedUser,
      pfApiKey: apiKey,
      pfApiSecret: apiSecret,
      licenseNumber,
      agents,
    };
    userSettingsStorage.save(settings);
    setResult({ success: true, message: "Settings saved successfully!" });
  };

  const testConnection = async () => {
    if (!apiKey || !apiSecret) {
      setResult({ success: false, message: "Please enter API Key and Secret" });
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch("/api/pf/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret }),
      });

      const data = await response.json();
      if (data.success) {
        setAgents(data.agents || []);
        // Auto-save on successful test
        const settings: UserSettings = {
          userId: selectedUser,
          pfApiKey: apiKey,
          pfApiSecret: apiSecret,
          licenseNumber,
          agents: data.agents || [],
        };
        userSettingsStorage.save(settings);
        setResult({ success: true, message: `Connection successful! Found ${data.agents?.length || 0} agents.` });
      } else {
        setResult({ success: false, message: data.message || "Connection failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to test connection" });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Configure your Property Finder API credentials</p>
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

        {/* User Selection */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select User Account</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
          >
            {USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* API Credentials */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">Property Finder API Credentials</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Property Finder API Key"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your Property Finder API Secret"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">RERA License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g., CN-1100636"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
              <p className="text-gray-500 text-xs mt-1">Required for permit number lookups</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={testConnection}
                disabled={testLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {testLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Agents */}
        {agents.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Connected Agents</h2>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{agent.name}</p>
                    <p className="text-gray-500 text-xs">ID: {agent.id}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">How to get API credentials:</h3>
          <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
            <li>Log in to your Property Finder Atlas dashboard</li>
            <li>Go to Settings → API Access</li>
            <li>Generate or copy your API Key and Secret</li>
            <li>Paste them above and test the connection</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
