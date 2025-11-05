// modules/payment/payment.utils.ts - Payment utilities for handling payment calculations
export const calculateServiceCharge = (amount: number, percentage: number = 5): number => {
    return amount * (percentage / 100);
  };
  
  export const calculateTotalAmount = (amount: number, serviceCharge: number): number => {
    return amount + serviceCharge;
  };