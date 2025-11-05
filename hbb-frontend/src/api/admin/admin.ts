import { api } from "../index";

export default class AdminService {
  static async getAdminFaq() {
    return api.get("admin/faq", {
      withCredentials: true,
    });
  }
}
