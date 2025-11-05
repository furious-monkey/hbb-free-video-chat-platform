// backend/src/modules/transaction/transaction.interface.ts
export interface ITransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  stripePaymentId?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionWithUser extends ITransaction {
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profile?: {
      username: string | null;
    } | null;
  };
}

export enum TransactionType {
  SIGNUP_FEE = 'SIGNUP_FEE',
  MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
  GIFT = 'GIFT',
  GIFT_SENT = 'GIFT_SENT',
  GIFT_RECEIVED = 'GIFT_RECEIVED',
  LIVE_STREAM = 'LIVE_STREAM',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export interface ITransactionFilters {
  userId: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  cursor?: string;
}

export interface ITransactionService {
  getTransactions(filters: ITransactionFilters): Promise<{
    transactions: ITransactionWithUser[];
    nextCursor: string | null;
    hasNextPage: boolean;
    totalEarned: number;
    totalSpent: number;
  }>;
  
  getTransactionById(id: string, userId: string): Promise<ITransactionWithUser>;
  
  createTransaction(data: {
    userId: string;
    amount: number;
    currency?: string;
    type: TransactionType;
    status: TransactionStatus;
    stripePaymentId?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: any;
  }): Promise<ITransaction>;
  
  updateTransactionStatus(id: string, status: TransactionStatus): Promise<ITransaction>;
  
  generateStatementData(userId: string, startDate?: string, endDate?: string): Promise<{
    transactions: ITransactionWithUser[];
    accountHolder: string;
    dateRange: string;
    moneyEarned: number;
    moneySpent: number;
    location: string;
  }>;
}