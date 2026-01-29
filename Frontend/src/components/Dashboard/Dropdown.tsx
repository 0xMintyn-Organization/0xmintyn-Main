import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dropdown() {
  return (
      <Select defaultValue="eqm/usd">
        <SelectTrigger className=" h-8 text-xs bg-zinc-300 dark:bg-zinc-800 ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="">
          <SelectItem value="eqm/usd">EQM to USD</SelectItem>
          <SelectItem value="eqm/eth">EQM to ETH</SelectItem>
          <SelectItem value="eqm/btc">EQM to BTC</SelectItem>
        </SelectContent>
      </Select>
  );
}
