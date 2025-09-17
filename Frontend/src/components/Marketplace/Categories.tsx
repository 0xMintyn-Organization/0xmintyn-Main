"use client";
import { useState } from "react";

const navItems = [
  { name: "All Categories", value: "" },
  { name: "Product", value: "Product" },
  { name: "Service", value: "Service" },
];

export default function Categories({ onSelectCategory }: { onSelectCategory: (category: string) => void }) {
  const [selected, setSelected] = useState("");

  const handleClick = (value: string) => {
    setSelected(value);
    onSelectCategory(value);
  };

  return (
    <ul className="h-screen overflow-y-auto dark:bg-transparent dark:text-white shadow-md shadow-top">
      <h2 className="text-lg font-semibold my-4">Categories</h2>
      {navItems.map(({ name, value }) => (
        <li key={value}>
          <button
            onClick={() => handleClick(value)}
            className={`w-full text-left flex items-center p-2 rounded-lg text-sm transition-colors ${selected === value ? "bg-green-900 text-white" : "hover:bg-green-500 hover:bg-opacity-20"
              }`}
          >
            {name}
          </button>
        </li>
      ))}
    </ul>
  );
}
