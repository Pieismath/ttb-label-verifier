"use client";

/* eslint-disable @next/next/no-img-element */

export default function Header() {
  return (
    <header>
      {/* Official gov-style top accent bar */}
      <div className="bg-[#1b3e6e] h-2" />
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden">
            <img
              src="/ttb-logo.svg"
              alt="TTB Seal"
              className="h-12"
              style={{ maxWidth: "none" }}
            />
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Alcohol and Tobacco Tax and Trade Bureau
            </p>
            <h1 className="text-xl font-bold text-[#1b3e6e]">
              Label Verification Tool
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
