"use client"
import React, { useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";

export default function ThemeSection() {
  const { config, refreshConfig } = useGlobal();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentTheme = config?.theme || "fall";

  const handleThemeChange = async (newTheme: "fall" | "spring") => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/update-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Theme updated successfully!");
        await refreshConfig();
      } else {
        setMessage(data.status || "Failed to update theme");
      }
    } catch (error) {
      setMessage("Error updating theme");
      console.error("Error updating theme:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-cornell-blue">Theme Settings</h2>
      <p className="text-gray-600 mb-6">
        Control the visual theme of the website. Fall theme shows winter/snow imagery, 
        while Spring theme shows the traditional green design.
      </p>

      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => handleThemeChange("fall")}
            disabled={saving || currentTheme === "fall"}
            className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all ${
              currentTheme === "fall"
                ? "border-cornell-blue bg-blue-50 text-cornell-blue font-semibold"
                : "border-gray-300 hover:border-cornell-blue hover:bg-gray-50"
            } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="text-lg font-semibold mb-2">❄️ Fall Theme</div>
            <div className="text-sm text-gray-600">Winter/snow design with blue colors</div>
          </button>

          <button
            onClick={() => handleThemeChange("spring")}
            disabled={saving || currentTheme === "spring"}
            className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all ${
              currentTheme === "spring"
                ? "border-cornell-blue bg-blue-50 text-cornell-blue font-semibold"
                : "border-gray-300 hover:border-cornell-blue hover:bg-gray-50"
            } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="text-lg font-semibold mb-2">🌸 Spring Theme</div>
            <div className="text-sm text-gray-600">Traditional green design</div>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Theme</h3>
          <p className="text-gray-700">
            {currentTheme === "fall" ? "❄️ Fall (Winter)" : "🌸 Spring"} theme is currently active
          </p>
        </div>
      </div>
    </div>
  );
}
