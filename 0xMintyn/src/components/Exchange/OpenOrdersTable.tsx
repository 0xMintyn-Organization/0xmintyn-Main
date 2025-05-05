import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { openOrders } from "@/lib/utils"
import { Button } from "../ui/button"
  
  export function OpenOrdersTable() {
    return (
      <Table className="text-right">
        <TableHeader>
          <TableRow className="text-green-700">
            <TableHead>Date</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>X Heading</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openOrders.map((data, idx) => (
            <TableRow key={idx}>
              <TableCell>{data.date}</TableCell>
              <TableCell>{data.pair}</TableCell>
              <TableCell>{data.type}</TableCell>
              <TableCell className={data.side === 'Buy' ? "text-green-700" : 'text-red-600'}>{data.side}</TableCell>
              <TableCell>${data.price.toFixed(2)}</TableCell>
              <TableCell>${data.amount.toFixed(2)}</TableCell>
              <TableCell>{data.xValue.toFixed(2)}</TableCell>
              <TableCell>${(data.price * data.amount).toFixed(2)}</TableCell>
              <TableCell>
                <Button 
                  className="my-1 bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl"
                  aria-label={data.action}
                >
                  {data.action}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  