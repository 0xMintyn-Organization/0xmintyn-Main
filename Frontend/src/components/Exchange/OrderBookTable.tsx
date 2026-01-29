import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { orderBook } from "@/lib/utils"
  
  export function OrderBookTable() {
    return (
      <Table className="text-right">
        <TableHeader>
          <TableRow className="text-green-700">
            <TableHead>Price (USD)</TableHead>
            <TableHead>Amount (EQM)</TableHead>
            <TableHead>Total (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderBook.map((data, idx) => (
            <TableRow key={idx} className={`${idx < 5 ? 'text-red-600' : 'text-green-700'}`}>
              <TableCell>${data.priceUSD.toFixed(2)}</TableCell>
              <TableCell>{data.amountEQM.toFixed(2)}</TableCell>
              <TableCell>${(data.priceUSD * data.amountEQM).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  