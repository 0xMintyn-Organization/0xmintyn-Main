import express from 'express';
import { activateUserAccount, activateUserAccountByLink, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateAccessTokenMiddleware, updateBannerPicture, updatePassword, updateProfile, updateProfilePicture, updateUserName, applyForInstructor, toggleSellerStatus, updateSocialAccount, removeSocialAccount, updateWalletAddress, removeWalletAddress, forgotPassword, resetPassword } from '../controllers/user.controller';
import { getInstructorStats } from '../controllers/instructor.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const userRouter = express.Router();

// Test route to verify router is loaded
userRouter.get('/test-router', (req, res) => {
    res.status(200).json({ success: true, message: 'User router is loaded and working!' });
});

userRouter.post('/register', registrationUser);

userRouter.post('/activate-user', activateUserAccount);
userRouter.post('/activate-link', activateUserAccountByLink);

userRouter.post('/login', loginUser);

userRouter.post('/forgot-password', forgotPassword);

userRouter.post('/reset-password', resetPassword);

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

userRouter.put("/toggle-seller-status", updateAccessTokenMiddleware, isAuthenticated, toggleSellerStatus);

userRouter.put("/update-social-account", updateAccessTokenMiddleware, isAuthenticated, updateSocialAccount);

userRouter.delete("/remove-social-account", updateAccessTokenMiddleware, isAuthenticated, removeSocialAccount);

userRouter.put("/update-wallet-address", updateAccessTokenMiddleware, isAuthenticated, updateWalletAddress);

userRouter.delete("/remove-wallet-address", updateAccessTokenMiddleware, isAuthenticated, removeWalletAddress);

export default userRouter;