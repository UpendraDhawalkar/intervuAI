"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslatedText } from "@/lib/useTranslatedText";

const LANG_KEY = "appLanguage";

// 🔤 Base text for translation
const BASE_TEXT = {
  dashboard: "Dashboard",
  questions: "Questions",
  upgrade: "Upgrade",
  howItWorks: "How it Works?",
};

function Header() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");

  // 🌀 Real-time translation hook
  const { t, translating } = useTranslatedText(BASE_TEXT, "header");

  // 🏁 initial language load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANG_KEY) || "en";
    setLanguage(saved);
  }, []);

  // 🏁 language change
  const handleLanguageChange = (e) => {
    const value = e.target.value;
    setLanguage(value);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_KEY, value);
      window.dispatchEvent(new Event("app-language-change")); // 🔥 notify all components
    }
  };

  // 🔗 Navigation items with translation support
  const navItems = [
    { name: t("dashboard"), href: "/dashboard" },
    { name: t("questions"), href: "/dashboard/questions" },
    { name: t("upgrade"), href: "/dashboard/upgrade" },
    { name: t("howItWorks"), href: "/dashboard/how-it-works" },
  ];

  return (
    <div className="flex p-4 items-center justify-between bg-secondary dark:bg-gray-900 shadow-sm relative">
      {/* Logo */}
      <Image
        src={"/logo.svg"}
        width={70}
        height={40}
        alt="logo"
        className="cursor-pointer"
        onClick={() => router.push("/dashboard")}
      />

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-6">
        {navItems.map((item) => (
          <li
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`cursor-pointer transition-all ${
              path === item.href
                ? "text-primary font-bold"
                : "text-gray-700 dark:text-gray-300"
            } hover:text-primary hover:font-bold`}
          >
            {item.name}
          </li>
        ))}
      </ul>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Language dropdown (desktop) */}
        <div className="relative">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="hidden md:block border rounded-md px-2 py-1 text-sm bg-background text-foreground"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>

          {/* Translating indicator */}
          {translating && (
            <span className="absolute -bottom-4 left-0 text-[10px] text-gray-500 animate-pulse">
              Translating...
            </span>
          )}
        </div>

        <UserButton />

        {/* Hamburger Icon */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-secondary dark:bg-gray-900 shadow-md md:hidden">
          <ul className="flex flex-col text-center p-4 gap-4">
            {navItems.map((item) => (
              <li
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMenuOpen(false);
                }}
                className={`cursor-pointer transition-all ${
                  path === item.href
                    ? "text-primary font-bold"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-primary hover:font-bold`}
              >
                {item.name}
              </li>
            ))}
          </ul>

          {/* Language dropdown (mobile) */}
          <div className="flex justify-center pb-4">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="border rounded-md px-3 py-2 text-sm bg-background text-foreground w-40"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
