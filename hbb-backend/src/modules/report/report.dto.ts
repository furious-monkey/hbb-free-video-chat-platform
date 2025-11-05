// backend/src/modules/report/report.dto.ts
export interface CreateReportDto {
  reportedUserId: string;
  categories: string[];
  description?: string; 
}