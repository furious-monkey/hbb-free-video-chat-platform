// backend/src/modules/report/report.service.ts
import { Service } from 'typedi';
import { ReportRepository } from './report.repository';
import { ReportReason } from '@prisma/client';

@Service()
export default class ReportService {  
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async createReport(payload: {
    reporterId: string;
    reportedUserId: string;
    categories: string[];
    description?: string;
  }): Promise<any> {
    // Map frontend categories to backend enum values
    const categoryMap: { [key: string]: ReportReason } = {
      'CATFISHING': ReportReason.CATFISHING,
      'MISCONDUCT': ReportReason.MISCONDUCT,
      'HARASSMENT': ReportReason.HARASSMENT,
      'ILLEGAL_ACTIVITIES': ReportReason.ILLEGAL_ACTIVITY,
      'OTHER': ReportReason.OTHER
    };

    const mappedCategories = payload.categories.map((cat) => {
      const mappedCategory = categoryMap[cat];
      if (!mappedCategory) {
        throw new Error(`Invalid report category: ${cat}`);
      }
      return mappedCategory;
    });

    return this.repository.createReport({
      reporterId: payload.reporterId,
      reportedUserId: payload.reportedUserId,
      category: mappedCategories,
      reportMessage: payload.description,
    });
  }
}