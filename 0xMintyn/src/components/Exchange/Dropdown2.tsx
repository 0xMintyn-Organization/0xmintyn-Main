import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dropdown2() {
  return (
      <Select defaultValue="usd">
        <SelectTrigger className="h-8 text-xs bg-zinc-300 dark:bg-zinc-800 ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="usd">USD</SelectItem>
          <SelectItem value="oxm">OXM</SelectItem>
          <SelectItem value="eth">ETH</SelectItem>
          <SelectItem value="btc">BTC</SelectItem>
        </SelectContent>
      </Select>
  );
}
