"use client";

import { useState, useEffect } from "react";
import { updateConsent } from "./provider";

interface ConsentManagerProps {
  onClose?: () => void;
}

export function ConsentManager({ onClose }: ConsentManagerProps) {
  const [consentSettings, setConsentSettings] = useState({
    functional: true,
    analytics: false,
    advertising: false,
    social: false,
  });

  // Load saved consent settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("analytics_consent");
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
    updateConsent(consentSettings);

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
              checked={consentSettings.functional}
              onChange={() => handleToggle("functional")}
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
              checked={consentSettings.analytics}
              onChange={() => handleToggle("analytics")}
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
              checked={consentSettings.advertising}
              onChange={() => handleToggle("advertising")}
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
              checked={consentSettings.social}
              onChange={() => handleToggle("social")}
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
