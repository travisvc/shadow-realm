"use client";

import { useState, useEffect } from "react";

export default function Settings() {
  const [apiUrl, setApiUrl] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedApiUrl = localStorage.getItem("apiUrl");
    const savedRefreshInterval = localStorage.getItem("refreshInterval");
    const savedDarkMode = localStorage.getItem("darkMode") === "true";

    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedRefreshInterval) setRefreshInterval(Number(savedRefreshInterval));
    setDarkMode(savedDarkMode);

    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("apiUrl", apiUrl);
    localStorage.setItem("refreshInterval", refreshInterval.toString());
    localStorage.setItem("darkMode", darkMode.toString());

    // Apply dark mode immediately
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#111112] p-8">
      Settings
    </div>
  );
}
