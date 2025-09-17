import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { tradeHistory } from "@/lib/utils"
  
  export function TradeHistoryTable() {
    return (
      <Table className="text-right">
        <TableHeader>
          <TableRow className="text-green-700">
            <TableHead>Date</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tradeHistory.map((data, idx) => (
            <TableRow key={idx}>
              <TableCell>{data.date}</TableCell>
              <TableCell>{data.pair}</TableCell>
              <TableCell className={data.side === 'Buy' ? "text-green-700" : 'text-red-600'}>{data.side}</TableCell>
              <TableCell>${data.price.toFixed(2)}</TableCell>
              <TableCell>${data.amount.toFixed(2)}</TableCell>
              <TableCell>${(data.price * data.amount).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  