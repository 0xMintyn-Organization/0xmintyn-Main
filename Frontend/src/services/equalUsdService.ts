import axiosInstance from "@/utils/axiosInstance";

export const equalUsdService = {
  getBalance: async () => {
    const response = await axiosInstance.get("/equalusd/balance");
    return response.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const response = await axiosInstance.get(
      `/equalusd/transactions${queryParams.toString() ? `?${queryParams}` : ""}`
    );
    return response.data;
  },
};

export default equalUsdService;
