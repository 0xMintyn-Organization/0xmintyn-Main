import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function SortDropdown({ onSortChange }: { onSortChange: (sortBy: string) => void }) {
  const [selectedSort, setSelectedSort] = useState("newest");

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSortChange(value); // Passing the selected sort option to the parent
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Sort by:</span>
      <Select value={selectedSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[100px] h-6 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
