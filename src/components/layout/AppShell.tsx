"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Users,
  User,
  Plus,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getInitials } from "@/lib/format";

interface AppShellProps {
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
  children: React.ReactNode;
}

const DESKTOP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Pinjaman", icon: ReceiptText },
  { href: "/contacts", label: "Kontak", icon: Users },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Pinjaman", icon: ReceiptText },
  { href: "/contacts", label: "Kontak", icon: Users },
  { href: "/settings", label: "Profil", icon: User },
];

export function AppShell({ profile, children }: AppShellProps) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(profile.full_name);

  useEffect(() => {
    setDisplayName(profile.full_name);
  }, [profile.full_name]);

  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ fullName?: string }>;
      if (custom.detail?.fullName) {
        setDisplayName(custom.detail.fullName);
      }
    };
    window.addEventListener("impas:profile-updated", onProfileUpdated);
    return () =>
      window.removeEventListener("impas:profile-updated", onProfileUpdated);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#F6F8F7] text-[#0B1312] flex flex-col md:flex-row">
      {/* Desktop Sidebar (240px fixed, NO logout icon) */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#DDE4E2] z-30">
        <div className="h-16 px-6 flex items-center border-b border-[#DDE4E2]">
          <BrandLogo href="/dashboard" size="md" />
        </div>

        <nav
          className="flex-1 px-3 py-5 space-y-1"
          aria-label="Navigasi utama"
        >
          {DESKTOP_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-[color,background-color] duration-150 ${
                  active
                    ? "bg-[#E6F4F1] text-[#0F766E] before:absolute before:left-0 before:inset-y-2 before:w-[3px] before:rounded-r before:bg-[#0F766E]"
                    : "text-[#475569] hover:bg-[#F6F8F7] hover:text-[#0B1312]"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    active ? "text-[#0F766E]" : "text-[#475569]"
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile Row -> links to /settings (no logout button here) */}
        <div className="p-3 border-t border-[#DDE4E2]">
          <Link
            href="/settings"
            aria-current={isActive("/settings") ? "page" : undefined}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-[background-color,color] duration-150 ${
              isActive("/settings")
                ? "bg-[#E6F4F1] text-[#0F766E]"
                : "hover:bg-[#F6F8F7]"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#0B1312] truncate">
                {displayName}
              </p>
              <p className="text-[13px] text-[#475569] truncate">
                {profile.email}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-[#DDE4E2] px-4 flex items-center justify-between">
        <BrandLogo href="/dashboard" size="sm" />
        <Link
          href="/loans/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-semibold transition-[background-color] duration-150"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Catat
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-[240px] pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (4 items) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white border-t border-[#DDE4E2] grid grid-cols-4"
        aria-label="Navigasi mobile"
      >
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 text-[13px] font-semibold transition-[color] duration-150 ${
                active
                  ? "text-[#0F766E] before:absolute before:top-0 before:inset-x-4 before:border-t-2 before:border-[#0F766E]"
                  : "text-[#475569]"
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
