"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, DollarSign, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface Props {
  isOpen: boolean | undefined;
  onClose: (value: boolean) => void;
}

const payoutSchema = z.object({
  amount: z.string().min(1, "Amount is required").transform((val) => parseFloat(val)),
  paymentMethod: z.enum(["bank_transfer", "paypal", "stripe"]),
  accountDetails: z.string().min(1, "Account details are required"),
});

type Payout = {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
};

const GetPaidModal = ({ isOpen, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([]);
  const [minimumPayout] = useState(50); // Minimum payout amount

  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "bank_transfer",
      accountDetails: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchPayoutData();
    }
  }, [isOpen]);

  const fetchPayoutData = async () => {
    try {
      // Fetch available balance, pending balance, and recent payouts
      // This would be replaced with actual API calls
      setAvailableBalance(1250.50);
      setPendingBalance(350.00);
      setRecentPayouts([
        {
          id: "1",
          date: "2024-03-20",
          amount: 500,
          status: "completed",
          method: "bank_transfer"
        },
        {
          id: "2",
          date: "2024-03-15",
          amount: 750,
          status: "processing",
          method: "paypal"
        }
      ]);
    } catch (error) {
      console.error("Error fetching payout data:", error);
    }
  };

  const onSubmit = async (data: z.infer<typeof payoutSchema>) => {
    if (data.amount > availableBalance) {
      toast.error("Requested amount exceeds available balance");
      return;
    }

    if (data.amount < minimumPayout) {
      toast.error(`Minimum payout amount is $${minimumPayout}`);
      return;
    }

    setLoading(true);
    try {
      // API call to request payout
      const toastId = toast.loading("Processing payout request...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Payout request submitted successfully", { id: toastId });
      form.reset();
      fetchPayoutData(); // Refresh data
    } catch (error) {
      toast.error("Failed to submit payout request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "processing":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  return (
    <>
      {isOpen && (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-[#F1E499]" />
                <p className="text-sm text-white/60">Available Balance</p>
              </div>
              <p className="text-2xl font-semibold text-white">
                ${availableBalance.toFixed(2)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Ready for withdrawal
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#6AB5D2]" />
                <p className="text-sm text-white/60">Pending Balance</p>
              </div>
              <p className="text-2xl font-semibold text-white">
                ${pendingBalance.toFixed(2)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                In review period
              </p>
            </div>
          </div>

          {/* Minimum Payout Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200">
              Minimum payout amount is ${minimumPayout}. Funds are typically available within 3-5 business days.
            </p>
          </div>

          {/* Payout Request Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Request Payout</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C3E1ED] font-normal text-[10px]">
                        Amount to withdraw
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                            $
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8 !h-10 backdrop-blur-sm text-white placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C3E1ED] font-normal text-[10px]">
                        Payment Method
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            className="!h-10 backdrop-blur-sm text-white !border-none"
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                          >
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1a1a1a] border-white/20">
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#C3E1ED] font-normal text-[10px]">
                        Account Details
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter account number or email"
                          className="!h-10 backdrop-blur-sm text-white placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                          style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="yellow"
                  className="w-full h-11 shadow-custom-shadow"
                  disabled={loading || availableBalance === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Request Payout"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Recent Payouts */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-4">Recent Payouts</h3>
            
            {recentPayouts.length > 0 ? (
              <div className="space-y-3">
                {recentPayouts.map((payout) => (
                  <div 
                    key={payout.id} 
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-sm text-white">${payout.amount.toFixed(2)}</p>
                      <p className="text-xs text-white/40">{payout.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs capitalize ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </p>
                      <p className="text-xs text-white/40">{payout.method.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 text-center py-4">
                No recent payouts
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GetPaidModal;