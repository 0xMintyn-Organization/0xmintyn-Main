import express from 'express';
import { activateUserAccount, activateUserAccountByLink, completeContributorOnboarding, completeStartupOnboarding, directRegisterUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, sessionFromCode, socialAuth, updateAccessToken, updateAccessTokenMiddleware, updateBannerPicture, updatePassword, updateProfile, updateProfilePicture, updateUserName, applyForInstructor, toggleSellerStatus, updateSocialAccount, removeSocialAccount, forgotPassword, resetPassword } from '../controllers/user.controller';
import { getInstructorStats } from '../controllers/instructor.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';
import { basicAuthDirectRegister } from '../middleware/basicAuth';

const userRouter = express.Router();

userRouter.post('/register', registrationUser);

// Secret direct-registration API (no OTP). Protected by Basic Auth. Use for bulk/loop user creation.
userRouter.post('/register-direct', basicAuthDirectRegister, directRegisterUser);

userRouter.post('/activate-user', activateUserAccount);
userRouter.post('/activate-link', activateUserAccountByLink);

userRouter.post('/login', loginUser);

userRouter.get('/session-from-code', sessionFromCode);

userRouter.post('/forgot-password', forgotPassword);

userRouter.post('/reset-password', resetPassword);

userRouter.get('/logout' , isAuthenticated, logoutUser);

userRouter.get('/users', getAllUsers);

userRouter.get('/refreshtoken', updateAccessToken);

userRouter.get('/me', updateAccessTokenMiddleware,  isAuthenticated, getUserInfo);

userRouter.put('/me/onboarding/startup', updateAccessTokenMiddleware, isAuthenticated, completeStartupOnboarding);
userRouter.put('/me/onboarding/contributor', updateAccessTokenMiddleware, isAuthenticated, completeContributorOnboarding);

userRouter.get('/instructor-stats/:instructorId', getInstructorStats);

userRouter.put('/update-user-info', updateAccessTokenMiddleware, isAuthenticated, updateProfile);

userRouter.put('/update-username', updateAccessTokenMiddleware, isAuthenticated, updateUserName);

userRouter.put('/change-password', updateAccessTokenMiddleware, isAuthenticated, updatePassword);

userRouter.post('/social-auth', socialAuth);

userRouter.put("/update-user-avatar", updateAccessTokenMiddleware, isAuthenticated, upload.single("avatar"), updateProfilePicture);

userRouter.put("/update-user-banner", updateAccessTokenMiddleware, isAuthenticated, upload.single("banner"), updateBannerPicture);

userRouter.post("/apply-instructor", updateAccessTokenMiddleware, isAuthenticated, applyForInstructor);

userRouter.put("/toggle-seller-status", updateAccessTokenMiddleware, isAuthenticated, toggleSellerStatus);

userRouter.put("/update-social-account", updateAccessTokenMiddleware, isAuthenticated, updateSocialAccount);

userRouter.delete("/remove-social-account", updateAccessTokenMiddleware, isAuthenticated, removeSocialAccount);



export default userRouter;