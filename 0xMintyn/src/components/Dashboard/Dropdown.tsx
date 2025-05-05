import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dropdown() {
  return (
      <Select defaultValue="oxm/usd">
        <SelectTrigger className=" h-8 text-xs bg-zinc-300 dark:bg-zinc-800 ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="">
          <SelectItem value="oxm/usd">OXM to USD</SelectItem>
          <SelectItem value="oxm/eth">OXM to ETH</SelectItem>
          <SelectItem value="oxm/btc">OXM to BTC</SelectItem>
        </SelectContent>
      </Select>
  );
}
