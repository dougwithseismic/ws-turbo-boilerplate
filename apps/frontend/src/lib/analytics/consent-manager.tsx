"use client";

import { useState, useEffect } from "react";
import { updateConsent } from "./provider";

interface ConsentManagerProps {
  onClose?: () => void;
}

export function ConsentManager({ onClose }: ConsentManagerProps) {
  const [consentSettings, setConsentSettings] = useState({
    functionality_storage: true,
    analytics_storage: false,
    ad_storage: false,
    personalization_storage: false,
    social_storage: false,
  });

  // Load saved consent settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("analytics2_consent_mode");
      if (savedSettings) {
        setConsentSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading consent settings:", error);
    }
  }, []);

  const handleToggle = (type: keyof typeof consentSettings) => {
    setConsentSettings((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSave = () => {
    // Update consent in analytics
    updateConsent({
      functionality_storage: consentSettings.functionality_storage
        ? "granted"
        : "denied",
      analytics_storage: consentSettings.analytics_storage
        ? "granted"
        : "denied",
      ad_storage: consentSettings.ad_storage ? "granted" : "denied",
      personalization_storage: consentSettings.personalization_storage
        ? "granted"
        : "denied",
      social_storage: consentSettings.social_storage ? "granted" : "denied",
    });

    // Close the consent manager if callback provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Privacy Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Necessary</h3>
              <p className="text-sm text-gray-500">
                Required for the website to function
              </p>
            </div>
            <input
              type="checkbox"
              checked={true}
              disabled={true}
              className="w-5 h-5 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Functional</h3>
              <p className="text-sm text-gray-500">
                Enhanced features and personalization
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.functionality_storage}
              onChange={() => handleToggle("functionality_storage")}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-gray-500">
                Measure how you use our website
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.analytics_storage}
              onChange={() => handleToggle("analytics_storage")}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Advertising</h3>
              <p className="text-sm text-gray-500">
                Personalized ads based on your behavior
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.ad_storage}
              onChange={() => handleToggle("ad_storage")}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Personalization</h3>
              <p className="text-sm text-gray-500">
                Personalize your experience
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.personalization_storage}
              onChange={() => handleToggle("personalization_storage")}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Social Media</h3>
              <p className="text-sm text-gray-500">
                Share content on social platforms
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.social_storage}
              onChange={() => handleToggle("social_storage")}
              className="w-5 h-5 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// Creates a button to open the consent manager
export function ConsentManagerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
      >
        Cookie Settings
      </button>

      {isOpen && <ConsentManager onClose={() => setIsOpen(false)} />}
    </>
  );
}
