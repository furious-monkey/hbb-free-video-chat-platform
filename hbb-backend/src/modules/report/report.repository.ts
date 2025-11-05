
// backend/src/modules/report/report.repository.ts
import { Service } from 'typedi';
import { PrismaClient, ReportReason } from '@prisma/client';

@Service()
export class ReportRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createReport(data: {
    reporterId: string;
    reportedUserId: string;
    category: ReportReason[]; // Match schema field name
    reportMessage?: string;
  }): Promise<any> {
    return this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reportedUserId: data.reportedUserId,
        category: data.category,
        reportMessage: data.reportMessage,
      },
    });
  }
}