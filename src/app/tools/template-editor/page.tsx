"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";

// Template Types
type TemplateType = "email" | "property" | "whatsapp";

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  subject?: string; // For emails
  htmlContent: string;
  cssContent?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES: { id: TemplateType; name: string; icon: string; description: string }[] = [
  { id: "email", name: "Email Templates", icon: "📧", description: "HTML email templates for client communication" },
  { id: "property", name: "Property Descriptions", icon: "🏠", description: "Rich property listing descriptions" },
  { id: "whatsapp", name: "WhatsApp/SMS", icon: "💬", description: "Message templates for quick communication" },
];

const CATEGORIES: Record<TemplateType, string[]> = {
  email: ["New Listing", "Follow Up", "Price Update", "Viewing Confirmation", "Thank You", "General"],
  property: ["Luxury", "Off-Plan", "Ready to Move", "Investment", "Rental", "General"],
  whatsapp: ["Inquiry Response", "Viewing Reminder", "Price Quote", "Follow Up", "General"],
};

const VARIABLES = [
  { name: "{{client_name}}", desc: "Client's full name" },
  { name: "{{client_first_name}}", desc: "Client's first name" },
  { name: "{{property_name}}", desc: "Property/Building name" },
  { name: "{{location}}", desc: "Full location address" },
  { name: "{{bedrooms}}", desc: "Number of bedrooms" },
  { name: "{{bathrooms}}", desc: "Number of bathrooms" },
  { name: "{{size}}", desc: "Property size in sq.ft" },
  { name: "{{price}}", desc: "Property price" },
  { name: "{{property_type}}", desc: "Type (Apartment, Villa, etc.)" },
  { name: "{{amenities}}", desc: "List of amenities" },
  { name: "{{agent_name}}", desc: "Agent name" },
  { name: "{{agent_phone}}", desc: "Agent phone number" },
  { name: "{{agent_email}}", desc: "Agent email" },
  { name: "{{company_name}}", desc: "Company name" },
  { name: "{{viewing_date}}", desc: "Viewing date" },
  { name: "{{viewing_time}}", desc: "Viewing time" },
  { name: "{{property_url}}", desc: "Link to property listing" },
];

const DEFAULT_TEMPLATES: Omit<Template, "id" | "createdAt" | "updatedAt">[] = [
  // Email Templates
  {
    name: "New Listing Alert",
    type: "email",
    category: "New Listing",
    subject: "Exclusive New Property: {{property_name}} in {{location}}",
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Property Alert!</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p style="font-size: 16px;">Dear {{client_name}},</p>

    <p>I'm excited to share an exclusive new listing that matches your requirements:</p>

    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #333; margin-top: 0;">{{property_name}}</h2>
      <p style="color: #666;"><strong>Location:</strong> {{location}}</p>
      <p style="color: #666;"><strong>Type:</strong> {{bedrooms}} BR {{property_type}}</p>
      <p style="color: #666;"><strong>Size:</strong> {{size}} sq.ft</p>
      <p style="font-size: 24px; color: #667eea; font-weight: bold;">AED {{price}}</p>

      <a href="{{property_url}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Property</a>
    </div>

    <p>Would you like to schedule a viewing? I'm available at your convenience.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>{{agent_name}}</strong><br>
      {{agent_phone}}<br>
      {{company_name}}
    </p>
  </div>

  <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>{{company_name}} | Dubai, UAE</p>
  </div>
</div>`,
    variables: ["client_name", "property_name", "location", "bedrooms", "property_type", "size", "price", "property_url", "agent_name", "agent_phone", "company_name"],
  },
  {
    name: "Viewing Confirmation",
    type: "email",
    category: "Viewing Confirmation",
    subject: "Viewing Confirmed: {{property_name}} on {{viewing_date}}",
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #28a745; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">✓ Viewing Confirmed</h1>
  </div>

  <div style="padding: 30px; background: #f9f9f9;">
    <p style="font-size: 16px;">Dear {{client_name}},</p>

    <p>Your property viewing has been confirmed. Here are the details:</p>

    <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3 style="margin-top: 0; color: #333;">{{property_name}}</h3>
      <p><strong>📍 Location:</strong> {{location}}</p>
      <p><strong>📅 Date:</strong> {{viewing_date}}</p>
      <p><strong>🕐 Time:</strong> {{viewing_time}}</p>
    </div>

    <p><strong>What to bring:</strong></p>
    <ul>
      <li>Valid Emirates ID or Passport</li>
      <li>Proof of income (if interested in renting)</li>
    </ul>

    <p>I will meet you at the property. If you need to reschedule, please let me know at least 24 hours in advance.</p>

    <p style="margin-top: 30px;">
      Looking forward to seeing you!<br><br>
      <strong>{{agent_name}}</strong><br>
      📱 {{agent_phone}}<br>
      {{company_name}}
    </p>
  </div>
</div>`,
    variables: ["client_name", "property_name", "location", "viewing_date", "viewing_time", "agent_name", "agent_phone", "company_name"],
  },
  {
    name: "Follow Up After Viewing",
    type: "email",
    category: "Follow Up",
    subject: "How was your viewing of {{property_name}}?",
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
  <p style="font-size: 16px;">Dear {{client_name}},</p>

  <p>Thank you for taking the time to view <strong>{{property_name}}</strong> yesterday. I hope you enjoyed seeing the property!</p>

  <p>I wanted to follow up and see if you have any questions or if you'd like to:</p>

  <ul>
    <li>Schedule a second viewing</li>
    <li>Discuss the price and payment options</li>
    <li>See similar properties in the area</li>
  </ul>

  <p>As a reminder, this property offers:</p>
  <ul>
    <li>{{bedrooms}} Bedrooms, {{bathrooms}} Bathrooms</li>
    <li>{{size}} sq.ft of living space</li>
    <li>Prime location in {{location}}</li>
    <li>Asking price: AED {{price}}</li>
  </ul>

  <p>Properties like this tend to move quickly. If you're interested, I'd recommend we move forward soon.</p>

  <p style="margin-top: 30px;">
    Best regards,<br>
    <strong>{{agent_name}}</strong><br>
    {{agent_phone}} | {{agent_email}}<br>
    {{company_name}}
  </p>
</div>`,
    variables: ["client_name", "property_name", "bedrooms", "bathrooms", "size", "location", "price", "agent_name", "agent_phone", "agent_email", "company_name"],
  },

  // Property Description Templates
  {
    name: "Luxury Property Description",
    type: "property",
    category: "Luxury",
    htmlContent: `<h2>{{property_name}} - {{location}}</h2>

<p>Experience luxury living at its finest in this stunning <strong>{{bedrooms}} bedroom {{property_type}}</strong> located in the prestigious {{location}}.</p>

<h3>Property Highlights:</h3>
<ul>
  <li>Spacious {{size}} sq.ft of living space</li>
  <li>{{bedrooms}} Bedrooms | {{bathrooms}} Bathrooms</li>
  <li>Premium finishes throughout</li>
  <li>Breathtaking views</li>
  <li>High-end appliances</li>
</ul>

<h3>Amenities:</h3>
<p>{{amenities}}</p>

<h3>Price: AED {{price}}</h3>

<p>For viewing arrangements, contact <strong>{{agent_name}}</strong> at {{agent_phone}}</p>
<p><em>{{company_name}} - Your Trusted Real Estate Partner</em></p>`,
    variables: ["property_name", "location", "bedrooms", "bathrooms", "size", "price", "property_type", "amenities", "agent_name", "agent_phone", "company_name"],
  },
  {
    name: "Off-Plan Investment",
    type: "property",
    category: "Off-Plan",
    htmlContent: `<h2>🏗️ Off-Plan Investment: {{property_name}}</h2>

<p><strong>Location:</strong> {{location}}</p>

<h3>Investment Highlights:</h3>
<ul>
  <li>{{bedrooms}} BR {{property_type}} - {{size}} sq.ft</li>
  <li>Attractive 60/40 payment plan</li>
  <li>Only 10% down payment required</li>
  <li>Expected handover: Q4 2025</li>
  <li>High ROI potential in prime location</li>
</ul>

<h3>Why Invest Here?</h3>
<ul>
  <li>Established developer with proven track record</li>
  <li>Premium community amenities</li>
  <li>Close to metro and major highways</li>
  <li>High rental demand area</li>
</ul>

<h3>Starting Price: AED {{price}}</h3>

<p>🔥 <strong>Limited units available at launch prices!</strong></p>

<p>Secure your investment today! Contact {{agent_name}} - {{agent_phone}}</p>`,
    variables: ["property_name", "location", "bedrooms", "size", "price", "property_type", "agent_name", "agent_phone"],
  },

  // WhatsApp/SMS Templates
  {
    name: "Quick Inquiry Response",
    type: "whatsapp",
    category: "Inquiry Response",
    htmlContent: `Hi {{client_first_name}}! 👋

Thank you for your inquiry about *{{property_name}}* in {{location}}.

📍 *Property Details:*
• {{bedrooms}} BR {{property_type}}
• {{size}} sq.ft
• Price: AED {{price}}

Would you like to schedule a viewing? I'm available this week.

Best regards,
{{agent_name}}
{{company_name}}`,
    variables: ["client_first_name", "property_name", "location", "bedrooms", "property_type", "size", "price", "agent_name", "company_name"],
  },
  {
    name: "Viewing Reminder",
    type: "whatsapp",
    category: "Viewing Reminder",
    htmlContent: `Hi {{client_first_name}}! 👋

This is a friendly reminder about your property viewing tomorrow:

📍 *{{property_name}}*
📅 {{viewing_date}}
🕐 {{viewing_time}}

I'll meet you at the property. Please bring your Emirates ID.

If you need to reschedule, let me know!

{{agent_name}} 📱`,
    variables: ["client_first_name", "property_name", "viewing_date", "viewing_time", "agent_name"],
  },
  {
    name: "Price Quote",
    type: "whatsapp",
    category: "Price Quote",
    htmlContent: `Hi {{client_first_name}}!

Here's the price breakdown for *{{property_name}}*:

💰 *Price:* AED {{price}}
📏 *Size:* {{size}} sq.ft
🛏️ *Type:* {{bedrooms}} BR {{property_type}}

*Payment Options:*
• Cash: 2% discount available
• Mortgage: Up to 80% financing
• Payment Plan: 60/40 (Off-plan only)

Interested? Let's discuss! 📞

{{agent_name}}
{{company_name}}`,
    variables: ["client_first_name", "property_name", "price", "size", "bedrooms", "property_type", "agent_name", "company_name"],
  },
  {
    name: "Follow Up Message",
    type: "whatsapp",
    category: "Follow Up",
    htmlContent: `Hi {{client_first_name}}! 👋

Just checking in about your property search.

Have you had a chance to think about *{{property_name}}*?

I also have some new listings that might interest you. Would you like me to share them?

Let me know how I can help! 🏠

{{agent_name}}`,
    variables: ["client_first_name", "property_name", "agent_name"],
  },
];

// Storage functions
const STORAGE_KEY = "pf_templates";

function generateId(): string {
  return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getStoredTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveTemplates(templates: Template[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function TemplateEditorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedType, setSelectedType] = useState<TemplateType>("email");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  // Preview variables
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({
    client_name: "Ahmed Al Maktoum",
    client_first_name: "Ahmed",
    property_name: "Marina Heights Tower",
    location: "Dubai Marina, Dubai",
    bedrooms: "2",
    bathrooms: "3",
    size: "1,450",
    price: "2,500,000",
    property_type: "Apartment",
    amenities: "Pool, Gym, 24/7 Security, Covered Parking, Kids Play Area",
    agent_name: "John Smith",
    agent_phone: "+971 50 123 4567",
    agent_email: "john@galahome.ae",
    company_name: "Gala Home Real Estate",
    viewing_date: "Monday, December 18th",
    viewing_time: "3:00 PM",
    property_url: "https://propertyfinder.ae/listing/12345",
  });

  useEffect(() => {
    const stored = getStoredTemplates();
    if (stored.length === 0) {
      // Initialize with default templates
      const initialTemplates: Template[] = DEFAULT_TEMPLATES.map((tmpl) => ({
        ...tmpl,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      saveTemplates(initialTemplates);
      setTemplates(initialTemplates);
    } else {
      setTemplates(stored);
    }
  }, []);

  const filteredTemplates = templates.filter((t) => t.type === selectedType);

  const createNewTemplate = () => {
    setSelectedTemplate(null);
    setName("");
    setCategory(CATEGORIES[selectedType][0]);
    setSubject("");
    setHtmlContent("");
    setIsEditing(true);
    setShowPreview(false);
  };

  const editTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setName(template.name);
    setCategory(template.category);
    setSubject(template.subject || "");
    setHtmlContent(template.htmlContent);
    setIsEditing(true);
    setShowPreview(false);
  };

  const saveTemplate = () => {
    if (!name || !htmlContent) {
      alert("Please provide a name and content for the template");
      return;
    }

    // Extract variables from content
    const variableMatches = htmlContent.match(/\{\{(\w+)\}\}/g) || [];
    const subjectMatches = subject?.match(/\{\{(\w+)\}\}/g) || [];
    const allMatches = [...variableMatches, ...subjectMatches];
    const variables = [...new Set(allMatches.map((v) => v.replace(/\{\{|\}\}/g, "")))];

    const template: Template = {
      id: selectedTemplate?.id || generateId(),
      name,
      type: selectedType,
      category,
      subject: selectedType === "email" ? subject : undefined,
      htmlContent,
      variables,
      createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = selectedTemplate
      ? templates.map((t) => (t.id === template.id ? template : t))
      : [...templates, template];

    saveTemplates(updatedTemplates);
    setTemplates(updatedTemplates);
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const deleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter((t) => t.id !== id);
      saveTemplates(updatedTemplates);
      setTemplates(updatedTemplates);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    }
  };

  const insertVariable = (variable: string) => {
    setHtmlContent((prev) => prev + variable);
  };

  const getPreviewContent = (content: string) => {
    let result = content;
    Object.entries(previewVars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return result;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeColor = (type: TemplateType) => {
    switch (type) {
      case "email": return "from-blue-500 to-blue-600";
      case "property": return "from-amber-500 to-amber-600";
      case "whatsapp": return "from-green-500 to-green-600";
    }
  };

  const getTypeButtonColor = (type: TemplateType, isActive: boolean) => {
    if (!isActive) return "bg-gray-700 hover:bg-gray-600 text-gray-300";
    switch (type) {
      case "email": return "bg-blue-600 text-white";
      case "property": return "bg-amber-600 text-white";
      case "whatsapp": return "bg-green-600 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTypeColor(selectedType)} flex items-center justify-center text-2xl`}>
              {TEMPLATE_TYPES.find((t) => t.id === selectedType)?.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Template Editor</h1>
              <p className="text-gray-400">Create email, property, and message templates</p>
            </div>
          </div>
          <button
            onClick={createNewTemplate}
            className={`px-4 py-2 bg-gradient-to-r ${getTypeColor(selectedType)} text-white rounded-lg transition-all hover:opacity-90 flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>

        {/* Template Type Tabs */}
        <div className="flex gap-3 mb-6">
          {TEMPLATE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setIsEditing(false);
                setSelectedTemplate(null);
              }}
              className={`px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${getTypeButtonColor(type.id, selectedType === type.id)}`}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="font-medium">{type.name}</span>
              <span className="px-2 py-0.5 bg-black/20 rounded-full text-xs">
                {templates.filter((t) => t.type === type.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4 border border-gray-700 h-fit max-h-[calc(100vh-300px)] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>{TEMPLATE_TYPES.find((t) => t.id === selectedType)?.icon}</span>
              Templates
            </h3>

            {filteredTemplates.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No templates yet.<br />Create your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? `bg-gradient-to-r ${getTypeColor(selectedType)} bg-opacity-20 border border-opacity-50`
                        : "bg-gray-700/50 hover:bg-gray-700"
                    }`}
                    onClick={() => editTemplate(template)}
                  >
                    <p className="text-white font-medium text-sm">{template.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{template.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor or Welcome */}
          <div className="lg:col-span-3">
            {isEditing ? (
              <div className="space-y-6">
                {/* Template Info */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Template"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CATEGORIES[selectedType].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Email Subject (only for email type) */}
                  {selectedType === "email" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line with {{variables}}"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Variables */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Insert Variable</label>
                    <div className="flex flex-wrap gap-2">
                      {VARIABLES.map((v) => (
                        <button
                          key={v.name}
                          onClick={() => insertVariable(v.name)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                          title={v.desc}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedType === "email" ? "Email Body (HTML)" : selectedType === "property" ? "Property Description (HTML)" : "Message Content"}
                    </label>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      rows={selectedType === "whatsapp" ? 10 : 15}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        selectedType === "email"
                          ? "Enter your HTML email template here..."
                          : selectedType === "property"
                          ? "Enter your HTML property description here..."
                          : "Enter your WhatsApp/SMS message here..."
                      }
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={saveTemplate}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </button>
                    <button
                      onClick={() => copyToClipboard(htmlContent)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedTemplate(null);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    {selectedTemplate && (
                      <button
                        onClick={() => deleteTemplate(selectedTemplate.id)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Preview</h3>
                      <button
                        onClick={() => copyToClipboard(getPreviewContent(htmlContent))}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Copy with values
                      </button>
                    </div>

                    {/* Preview Variables (Editable) */}
                    <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-gray-900 rounded-lg">
                      {Object.entries(previewVars).slice(0, 8).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1">{key}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setPreviewVars((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Email Subject Preview */}
                    {selectedType === "email" && subject && (
                      <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                        <span className="text-gray-500 text-sm">Subject: </span>
                        <span className="text-white">{getPreviewContent(subject)}</span>
                      </div>
                    )}

                    {/* Rendered Preview */}
                    {selectedType === "whatsapp" ? (
                      <div className="bg-[#075e54] rounded-lg p-4">
                        <div className="bg-[#dcf8c6] text-gray-900 rounded-lg p-4 max-w-md ml-auto whitespace-pre-wrap text-sm">
                          {getPreviewContent(htmlContent)}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="bg-white text-gray-900 rounded-lg p-6 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: getPreviewContent(htmlContent) }}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
                <div className="text-6xl mb-4">{TEMPLATE_TYPES.find((t) => t.id === selectedType)?.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {TEMPLATE_TYPES.find((t) => t.id === selectedType)?.name}
                </h3>
                <p className="text-gray-400 mb-6">
                  {TEMPLATE_TYPES.find((t) => t.id === selectedType)?.description}
                </p>
                <p className="text-gray-500 mb-6">
                  Select a template from the list to edit, or create a new one.
                </p>
                <button
                  onClick={createNewTemplate}
                  className={`px-6 py-3 bg-gradient-to-r ${getTypeColor(selectedType)} text-white rounded-lg transition-all hover:opacity-90`}
                >
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
