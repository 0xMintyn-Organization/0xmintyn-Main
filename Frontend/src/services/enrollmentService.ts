import axiosInstance from "@/utils/axiosInstance";

// Enrollment API service
export const enrollmentService = {
  // Enroll in a course
  enrollInCourse: async (courseId: string) => {
    const response = await axiosInstance.post(`/enrollment/enroll/${courseId}`);
    return response.data;
  },

  // Get user's enrolled courses
  getUserEnrolledCourses: async () => {
    const response = await axiosInstance.get('/enrollment/my-courses');
    return response.data;
  },

  // Check if user is enrolled in a course
  checkEnrollment: async (courseId: string) => {
    const response = await axiosInstance.get(`/enrollment/check/${courseId}`);
    return response.data;
  },

  // Get all orders (Admin only)
  getAllOrders: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    courseId?: string;
    userId?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.courseId) queryParams.append("courseId", params.courseId);
    if (params.userId) queryParams.append("userId", params.userId);

    const response = await axiosInstance.get(`/enrollment/orders?${queryParams}`);
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId: string) => {
    const response = await axiosInstance.get(`/enrollment/orders/${orderId}`);
    return response.data;
  },

  // Update order status (Admin only)
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await axiosInstance.put(
      `/enrollment/orders/${orderId}/status`,
      { status }
    );
    return response.data;
  },
};

export default enrollmentService;
