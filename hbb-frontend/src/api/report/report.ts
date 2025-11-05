// frontend/src/api/report/report.ts
import { api } from "../index";

export interface CreateReportData {
  reportedUserId: string;
  categories: string[];
  description?: string;
}

export default class ReportService {
  static async createReport(data: CreateReportData) {
    return api.post("report", data, {
      withCredentials: true,
    });
  }
}