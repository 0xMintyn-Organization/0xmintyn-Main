import express from 'express';
import { getInstructorStats, getInstructorDashboard, getInstructorAnalytics, getInstructorStudents, getInstructorEarnings } from '../controllers/instructor.controller';
import { isAthenticated } from '../utils/auth';
import { updateAccessTokenMiddleware } from '../controllers/user.controller';

const instructorRouter = express.Router();

// Get instructor statistics (public)
instructorRouter.get('/instructor-stats/:instructorId', getInstructorStats);

// Get instructor dashboard (protected)
instructorRouter.get('/instructor/dashboard', updateAccessTokenMiddleware, isAthenticated, getInstructorDashboard);

// Get instructor analytics (protected)
instructorRouter.get('/instructor/analytics', updateAccessTokenMiddleware, isAthenticated, getInstructorAnalytics);

// Get instructor students (protected)
instructorRouter.get('/instructor/students', updateAccessTokenMiddleware, isAthenticated, getInstructorStudents);

// Get instructor earnings (protected)
instructorRouter.get('/instructor/earnings', updateAccessTokenMiddleware, isAthenticated, getInstructorEarnings);

export default instructorRouter;
