"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface Category {
  id: string
  name: string
}

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  activeFilter: string
  onFilterChange: (filter: string) => void
  categories: Category[]
  authUserType?: string
  isRTL: boolean
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  categories,
  authUserType,
  isRTL,
}: SearchBarProps) {
  const { t } = useTranslation()

  // Determine main filters based on role
  const filters =
    authUserType === "seller"
      ? [
          { id: "all", label: t("all_people") || "All People" },
          { id: "jobs", label: t("all_jobs") || "All Jobs" },
          { id: "buyer", label: t("filter_buyer") || "Buyers" },
        ]
      : [
          { id: "all", label: t("all_people") || "All People" },
          { id: "gigs", label: t("all_services") || "All Services" },
          { id: "seller", label: t("filter_seller") || "Sellers" },
        ]

  return (
    <div className={`w-full mx-auto mb-8 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Search input */}
      <div className="relative mb-6">
        <Search
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${
            isRTL ? "right-3" : "left-3"
          }`}
        />
        <Input
          type="text"
          placeholder={
            authUserType === "seller"
              ? t("search_jobs") || "Search jobs..."
              : t("search_services") || "Search services..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // re-trigger search on Enter
              onSearchChange(searchTerm)
            }
          }}
          className={`py-3 text-lg border-red-200 focus:border-red-500 rounded-lg ${
            isRTL ? "pr-10" : "pl-10"
          }`}
        />
      </div>

      {/* Main filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <Button
            key={f.id}
            variant={activeFilter === f.id ? "default" : "outline"}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              activeFilter === f.id
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">
            {t("categories") || "Categories"}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeFilter === cat.id ? "default" : "outline"}
                onClick={() => onFilterChange(cat.id)}
                className={`rounded-full px-4 py-2 text-sm ${
                  activeFilter === cat.id
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
