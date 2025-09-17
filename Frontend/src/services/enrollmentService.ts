import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URI;

// Enrollment API service
export const enrollmentService = {
  // Enroll in a course
  enrollInCourse: async (courseId: string) => {
    const response = await axios.post(
      `${API_BASE_URL}enrollment/enroll/${courseId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  // Get user's enrolled courses
  getUserEnrolledCourses: async () => {
    const response = await axios.get(
      `${API_BASE_URL}enrollment/my-courses`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Check if user is enrolled in a course
  checkEnrollment: async (courseId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}enrollment/check/${courseId}`,
      { withCredentials: true }
    );
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

    const response = await axios.get(
      `${API_BASE_URL}enrollment/orders?${queryParams}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}enrollment/orders/${orderId}`,
      { withCredentials: true }
    );
    return response.data;
  },

  // Update order status (Admin only)
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await axios.put(
      `${API_BASE_URL}enrollment/orders/${orderId}/status`,
      { status },
      { withCredentials: true }
    );
    return response.data;
  },
};

export default enrollmentService;
