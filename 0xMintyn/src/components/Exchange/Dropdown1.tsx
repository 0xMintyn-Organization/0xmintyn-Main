import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dropdown1() {
  return (
      <Select defaultValue="oxm">
        <SelectTrigger className=" h-8 text-xs bg-zinc-300 dark:bg-zinc-800 ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="oxm">OXM</SelectItem>
          <SelectItem value="eth">ETH</SelectItem>
          <SelectItem value="btc">BTC</SelectItem>
        </SelectContent>
      </Select>
  );
}
