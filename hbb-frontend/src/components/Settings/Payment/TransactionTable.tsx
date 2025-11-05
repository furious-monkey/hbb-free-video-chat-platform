import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Payment } from "../index.types";

export function TransactionTable() {
  return (
    <Table>
      <TableHeader className="hidden lg:table-header-group">
        <TableRow className="border-b border-white/60">
          <TableHead className="font-medium text-sm pl-0 pb-[10px]">
            Payment name
          </TableHead>
          <TableHead className="font-medium text-sm pl-0 pb-[10px] hidden lg:table-cell">
            Date
          </TableHead>
          <TableHead className="font-medium text-sm pl-0 pb-[10px]">
            Amount
          </TableHead>
          <TableHead className="font-medium text-sm pl-0 pb-[10px] w-40">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>

      <div className="mt-5" />
      <TableBody className="">
        {invoices.map((invoice, index) => (
          <TableRow
            className="border-b border-white/60 lg:border-0"
            key={index}
          >
            <TableCell className="pl-0 lg:pt-0 pt-2 pb-3 text-sm font-medium">
              <div className="flex-col flex">
                <p>{invoice.name}</p>
                <p className="lg:hidden font-light text-[10px]">
                  {invoice.date}
                </p>
              </div>
            </TableCell>
            <TableCell className="pl-0 lg:pt-0 pt-2 pb-3 text-sm font-medium hidden lg:table-cell">
              {invoice.date}
            </TableCell>
            <TableCell className="pl-0 lg:pt-0 pt-2 pb-3 text-sm font-medium">
              {invoice.amount}
            </TableCell>
            <TableCell className="pl-0 lg:pt-0 pr-0 pt-2 pb-3 text-sm">
              <div className="w-full flex justify-end lg:justify-normal">
                <p
                  className={`w-[98px] h-8 flex items-center justify-center rounded-lg ${
                    invoice.status === "Pending" ? "bg-base1" : "bg-[#4EB246]"
                  }`}
                >
                  {invoice.status}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const invoices: Payment[] = [
  {
    name: "Inna Pinovich",
    date: "24/03/2024",
    amount: "$20.00",
    status: "Pending",
  },
  {
    name: "Inna Pinovich",
    date: "24/03/2024",
    amount: "$20.00",
    status: "Completed",
  },
  {
    name: "Inna Pinovich",
    date: "24/03/2024",
    amount: "$20.00",
    status: "Completed",
  },
  {
    name: "Inna Pinovich",
    date: "24/03/2024",
    amount: "$20.00",
    status: "Completed",
  },
];
