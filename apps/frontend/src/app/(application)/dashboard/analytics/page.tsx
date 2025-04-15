"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/lib/analytics/use-analytics";

const ITEMS = Array.from({ length: 10 }, (_, i) => `Tracked Item #${i + 1}`);

export default function AdvancedAnalyticsPage() {
  const { trackEvent } = useAnalytics();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track items scrolling into view
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent("item_in_view", {
              item: entry.target.textContent,
            });
          }
        });
      },
      { threshold: 0.5 },
    );
    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => {
      itemRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
      observer.disconnect();
    };
  }, [trackEvent]);

  // Button click handler
  const handleButtonClick = () => {
    trackEvent("demo_button_click", { label: "Track Me!" });
  };

  // Mouse over handler
  const handleMouseOver = () => {
    trackEvent("hover_demo_element", { element: "Hover Me Box" });
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Advanced Analytics Demo</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded shadow mb-8 hover:bg-blue-700"
        onClick={handleButtonClick}
      >
        Track Button Click
      </button>
      <div
        className="w-full p-6 mb-8 bg-yellow-100 rounded shadow hover:bg-yellow-200 cursor-pointer"
        onMouseOver={handleMouseOver}
      >
        Hover over this box to track mouse over
      </div>
      <div className="space-y-6">
        {ITEMS.map((item, idx) => (
          <div
            key={item}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="p-4 bg-gray-100 rounded shadow"
          >
            {item}
          </div>
        ))}
      </div>
      <p className="mt-10 text-gray-500 text-sm">
        Open the browser console to see analytics events being tracked.
      </p>
    </div>
  );
}
