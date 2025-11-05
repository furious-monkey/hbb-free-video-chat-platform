// frontend/src/api/transaction/transaction.ts
import { TransactionFilters } from "@/src/store/transactionStore";
import { api } from "../index";

export default class TransactionService {
  static async getTransactions(filters?: TransactionFilters) {
    const endpoint = 'transaction';
    
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }

    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    if (filters?.type) {
      params.append('type', filters.type);
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }

    if (filters?.cursor) {
      params.append('cursor', filters.cursor);
    }

    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

    return api.get(url, {
      withCredentials: true,
    });
  }

  static async getTransactionById(id: string) {
    const endpoint = `transaction/${id}`;
    return api.get(endpoint, {
      withCredentials: true,
    });
  }

  static async getStatementData(filters?: TransactionFilters) {
    const endpoint = 'transaction/statement';
    
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }

    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }

    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

    return api.get(url, {
      withCredentials: true,
    });
  }

  static async getInvoiceData(transactionId: string) {
    const endpoint = `transaction/invoice/${transactionId}`;
    return api.get(endpoint, {
      withCredentials: true,
    });
  }
}