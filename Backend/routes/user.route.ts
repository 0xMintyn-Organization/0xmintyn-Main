import express from 'express';
import { activateUserAccount, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateAccessTokenMiddleware, updateBannerPicture, updatePassword, updateProfile, updateProfilePicture, updateUserName, applyForInstructor } from '../controllers/user.controller';
import { getInstructorStats } from '../controllers/instructor.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const userRouter = express.Router();

userRouter.post('/register', registrationUser);

userRouter.post('/activate-user', activateUserAccount);

userRouter.post('/login', loginUser);

userRouter.get('/logout' , isAuthenticated, logoutUser);

userRouter.get('/users', getAllUsers);

userRouter.get('/refreshtoken', updateAccessToken);

userRouter.get('/me', updateAccessTokenMiddleware,  isAuthenticated, getUserInfo);
userRouter.get('/instructor-stats/:instructorId', getInstructorStats);

userRouter.put('/update-user-info', updateAccessTokenMiddleware, isAuthenticated, updateProfile);

userRouter.put('/update-username', updateAccessTokenMiddleware, isAuthenticated, updateUserName);

userRouter.put('/change-password', updateAccessTokenMiddleware, isAuthenticated, updatePassword);

userRouter.post('/social-auth', socialAuth);

userRouter.put("/update-user-avatar", updateAccessTokenMiddleware, isAuthenticated, upload.single("avatar"), updateProfilePicture);

userRouter.put("/update-user-banner", updateAccessTokenMiddleware, isAuthenticated, upload.single("banner"), updateBannerPicture);

userRouter.post("/apply-instructor", updateAccessTokenMiddleware, isAuthenticated, applyForInstructor);





export default userRouter;