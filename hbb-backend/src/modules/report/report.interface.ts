import { ReportReason } from '@prisma/client';

export interface CreateReportDto {
  reportedUserId: string;
  categories: string[]; 
  reportMessage?: string;
}