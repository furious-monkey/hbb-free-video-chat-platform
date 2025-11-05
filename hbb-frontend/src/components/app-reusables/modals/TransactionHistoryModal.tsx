"use client";

import React, { useEffect, useState } from "react";
import { DatePickerWithRange } from "../DatePickerWithRange";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { DownloadIcon } from "../../svgs/DownloadIcon";
import { Button } from "../../ui/button";
import { DateIcon } from "../../svgs/DateIcon";
import { useRouter } from "next/navigation";
import { useTransactionStore } from "@/src/store/transactionStore";
import TransactionService from "@/src/api/transaction/transaction";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface Props {
  isOpen: boolean | undefined;
}

const TransactionalHistoryModal = ({ isOpen }: Props) => {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    return {
      from: lastYear,
      to: today,
    };
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    transactions,
    transactionsPaginationData,
    totalEarned,
    totalSpent,
    loading,
    error,
    getTransactions,
  } = useTransactionStore();

  // Fetch transactions when modal opens or date range changes
  useEffect(() => {
    if (isOpen) {
      const filters = {
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        cursor: undefined, // Reset cursor when date range changes
      };
      console.log("Fetching transactions with filters:", filters);
      getTransactions(filters);
    }
  }, [isOpen, dateRange, getTransactions]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log("Date range changed to:", range);
    setDateRange(range);
  };

  const handleLoadMore = () => {
    if (transactionsPaginationData.hasNextPage) {
      const filters = {
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        cursor: transactionsPaginationData.nextCursor,
      };
      console.log("Loading more with filters:", filters);
      getTransactions(filters);
    }
  };
  const handleDownloadStatement = async () => {
    setIsDownloading(true);
    try {
      // Check if we have transactions
      if (!transactions || transactions.length === 0) {
        alert("No transactions found for the selected period");
        return;
      }

      // Format the data for PDF generation
      const pdfData = {
        transactions: transactions.map((tx) => {
          const txType = formatTransactionType(tx.type);
          return {
            id: tx.id,
            date: format(new Date(tx.createdAt), "dd/MM/yyyy"),
            paymentDetails: getPaymentDetails(tx),
            amount: Number(tx.amount), // Ensure amount is a number
            type: txType,
            // Add these fields for the PDF generator
            moneyEarned: txType === "earned" ? Number(tx.amount) : 0,
            moneySpent: txType === "spent" ? Number(tx.amount) : 0,
          };
        }),
        accountHolder: "Your Account", // Replace with actual user data
        dateRange: `${
          dateRange?.from ? format(dateRange.from, "LLL dd, yyyy") : "Beginning"
        } - ${
          dateRange?.to ? format(dateRange.to, "LLL dd, yyyy") : "Present"
        }`,
        moneyEarned: totalEarned,
        moneySpent: totalSpent,
        location: "Online", // Replace with actual user location
        date: format(new Date(), "yyyy-MM-dd"), // Current date for filename
      };

      // Generate PDF
      const pdfResponse = await axios.post("/api/generate-pdf", pdfData, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (pdfResponse.status === 200) {
        const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `statement_${format(new Date(), "yyyy-MM-dd")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error("Failed to generate PDF:", pdfResponse.statusText);
        alert("Failed to generate PDF. Please try again.");
      }
    } catch (error) {
      console.error("Error generating statement:", error);
      alert("Error generating statement. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      console.log("Downloading invoice for transaction:", transactionId);
      const response = await TransactionService.getInvoiceData(transactionId);

      if (response && response.data) {
        const invoiceData = response.data.data;
        console.log("Invoice data received:", invoiceData);

        // Send the data to your existing PDF generation endpoint
        const pdfResponse = await axios.post(
          "/api/download-invoice",
          {
            ...invoiceData.transaction,
            invoiceNumber: invoiceData.invoiceNumber,
            date: invoiceData.date,
          },
          {
            responseType: "blob",
          }
        );

        console.log("PDF response:", pdfResponse);

        const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${transactionId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const formatTransactionType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      SIGNUP_FEE: "spent",
      MEMBERSHIP_FEE: "spent",
      GIFT: "earned",
      LIVE_STREAM: "earned",
      GIFT_SENT: "spent",
      GIFT_RECEIVED: "earned",
      STREAM_BID_EARNINGS: "earned",
      BID_ACCEPTED: "earned",
      STREAM_TIME_BASED: "earned",
    };
    return typeMap[type] || type.toLowerCase();
  };

  const getPaymentDetails = (transaction: any) => {
    if (transaction.user) {
      const firstName = transaction.user.firstName || "";
      const lastName = transaction.user.lastName || "";
      const username = transaction.user.profile?.username;

      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      } else if (username) {
        return `@${username}`;
      }
    }

    return transaction.description || transaction.type;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbol = currency.toUpperCase() === "USD" ? "$" : currency;
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Skeleton loader for desktop table rows
  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32 bg-white/10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24 bg-white/10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20 bg-white/10" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-4 w-20 bg-white/10" />
          <Skeleton className="h-5 w-5 rounded bg-white/10" />
        </div>
      </TableCell>
    </TableRow>
  );

  // Skeleton loader for mobile table rows
  const MobileTableRowSkeleton = () => (
    <TableRow>
      <TableCell className="font-medium flex flex-col">
        <Skeleton className="h-4 w-28 mb-1 bg-white/10" />
        <Skeleton className="h-3 w-20 bg-white/10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16 bg-white/10" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-4 w-16 bg-white/10" />
          <Skeleton className="h-5 w-5 rounded bg-white/10" />
        </div>
      </TableCell>
    </TableRow>
  );

  if (!isOpen) return null;

  return (
    <div className="overflow-y-auto no-scrollbar pb-20 lg:pb-0">
      {/* Title and Date Picker */}
      <h2 className="text-[12px] font-medium leading-[1.3] text-white/60 font-space-grotesk">
        Payment duration
      </h2>
      <div className="flex flex-col lg:flex-row justify-between gap-y-4 lg:gap-y-0 lg:items-center mt-2 border-b !border-[rgba(255,255,255,0.2)] pb-4">
        <div className="flex items-center gap-2">
          <DateIcon className="!h-8 w-auto" />
          <div>
            <DatePickerWithRange
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        <Button
          onClick={handleDownloadStatement}
          disabled={isDownloading || transactions.length === 0 || loading}
          className="w-full lg:w-max flex items-center gap-2 text-xs lg:!text-sm font-normal leading-[1.3] !text-[#F1E499] bg-transparent font-space-grotesk border !border-[rgba(255,255,255,0.32)] rounded-md !h-8 hover:bg-white/10"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            "Download statement"
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State with Skeletons */}
      {loading && (
        <>
          {/* Desktop Loading Skeleton */}
          <div className="hidden lg:block mt-6 h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="!border-[rgba(255,255,255,0.6)]">
                  <TableHead className="lg:w-[200px]">
                    Payment details
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(8)].map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Loading Skeleton */}
          <div className="lg:hidden mt-6">
            <Table>
              <TableBody>
                {[...Array(6)].map((_, index) => (
                  <MobileTableRowSkeleton key={index} />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && (
        <div className="text-center py-12 text-white/60">
          No transactions found for the selected period.
        </div>
      )}

      {/* Table - Desktop */}
      {!loading && transactions.length > 0 && (
        <>
          <div className="hidden lg:block mt-6 h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="!border-[rgba(255,255,255,0.6)]">
                  <TableHead className="lg:w-[200px]">
                    Payment details
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="">
                {transactions.map((transaction) => {
                  const transactionType = formatTransactionType(
                    transaction.type
                  );
                  const isSpent = transactionType === "spent";

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {getPaymentDetails(transaction)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {isSpent ? "-" : "+"}
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className="text-[#F1E499] cursor-pointer uppercase"
                            onClick={() =>
                              router.push(
                                `/dashboard/influencer/live?modal=transactionDetails&id=${transaction.id}`
                              )
                            }
                          >
                            {transaction.id.slice(0, 8)}
                          </span>
                          <span
                            className="bg-transparent border-none px-0 h-max cursor-pointer"
                            onClick={() =>
                              handleDownloadInvoice(transaction.id)
                            }
                          >
                            <DownloadIcon />
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Table - Mobile */}
          <div className="lg:hidden">
            <Table>
              <TableBody className="">
                {transactions.map((transaction) => {
                  const transactionType = formatTransactionType(
                    transaction.type
                  );
                  const isSpent = transactionType === "spent";

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium flex flex-col">
                        <span>{getPaymentDetails(transaction)}</span>
                        <span className="text-[#E2E2E2] text-xs font-thin">
                          {format(
                            new Date(transaction.createdAt),
                            "dd/MM/yyyy"
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isSpent ? "-" : "+"}
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className="text-[#F1E499] cursor-pointer px-0 uppercase"
                            onClick={() =>
                              router.push(
                                `/dashboard/influencer/live?modal=transactionDetails&id=${transaction.id}`
                              )
                            }
                          >
                            {transaction.id.slice(0, 8)}
                          </span>
                          <span
                            onClick={() =>
                              handleDownloadInvoice(transaction.id)
                            }
                            className="bg-transparent border-none px-0 h-max cursor-pointer"
                          >
                            <DownloadIcon />
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {transactionsPaginationData.hasNextPage && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                className="text-xs lg:!text-sm font-normal leading-[1.3] !text-[#F1E499] bg-transparent font-space-grotesk border !border-[rgba(255,255,255,0.32)] rounded-md !h-8 hover:bg-white/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionalHistoryModal;