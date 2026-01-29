import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlaceOrderDropdown() {
  return (
      <Select defaultValue="buy">
        <SelectTrigger className=" h-8 text-xs bg-zinc-300 dark:bg-zinc-800 ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="buy">Buy EQM</SelectItem>
          <SelectItem value="sell">Sell EQM</SelectItem>
        </SelectContent>
      </Select>
  );
}
