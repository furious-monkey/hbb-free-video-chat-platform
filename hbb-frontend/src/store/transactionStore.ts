// frontend/src/store/transactionStore.ts
import { getCookie } from "cookies-next";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import TransactionService from "../api/transaction/transaction";

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  stripePaymentId: string | null;
  paymentMethod: string | null;
  description: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    profile?: {
      username: string | null;
    } | null;
  };
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

interface TransactionState {
  transactions: Transaction[];
  transactionsPaginationData: {
    nextCursor?: string;
    hasNextPage?: boolean;
  };
  selectedTransaction: Transaction | null;
  totalEarned: number;
  totalSpent: number;
  loading: boolean;
  isToken: boolean;
  error: string | null;

  // Actions
  getTransactions: (filters?: TransactionFilters) => Promise<any>;
  getTransactionById: (id: string) => Promise<any>;
  clearTransactions: () => void;
  setSelectedTransaction: (transaction: Transaction | null) => void;
}

export const useTransactionStore = create<TransactionState>()(
  devtools((set, get) => ({
    transactions: [],
    transactionsPaginationData: {},
    selectedTransaction: null,
    totalEarned: 0,
    totalSpent: 0,
    loading: false,
    isToken: !!getCookie("accessToken"),
    error: null,

    getTransactions: async (filters?: TransactionFilters) => {
      set({ loading: true, error: null });
      try {
        const response = await TransactionService.getTransactions(filters);

        if (response?.data?.data) {
          const { transactions, nextCursor, hasNextPage, totalEarned, totalSpent } = response.data.data;

          if (transactions) {
            set((state) => ({
              transactions: filters?.cursor
                ? [...state.transactions, ...transactions]
                : transactions,
              transactionsPaginationData: {
                nextCursor,
                hasNextPage,
              },
              totalEarned: totalEarned || 0,
              totalSpent: totalSpent || 0,
            }));
          }

          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        set({ 
          loading: false, 
          error: err.response?.data?.message || 'Failed to fetch transactions' 
        });
        return err;
      }
    },

    getTransactionById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await TransactionService.getTransactionById(id);

        if (response?.data?.data) {
          const { transaction } = response.data.data;

          if (transaction) {
            set({
              selectedTransaction: transaction,
            });
          }

          set({ loading: false });
          return response.data;
        }

        set({ loading: false });
      } catch (err: any) {
        set({ 
          loading: false, 
          error: err.response?.data?.message || 'Failed to fetch transaction' 
        });
        return err;
      }
    },

    clearTransactions: () => {
      set({
        transactions: [],
        transactionsPaginationData: {},
        selectedTransaction: null,
        totalEarned: 0,
        totalSpent: 0,
        error: null,
      });
    },

    setSelectedTransaction: (transaction: Transaction | null) => {
      set({ selectedTransaction: transaction });
    },
  }))
);