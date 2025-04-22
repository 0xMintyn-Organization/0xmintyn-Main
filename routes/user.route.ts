import express from 'express';
import { activateUserAccount, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, updateAccessToken, updateBannerPicture, updateProfile, updateProfilePicture, updateUserName } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const userRouter = express.Router();

userRouter.post('/register', registrationUser);

userRouter.post('/activate-user', activateUserAccount);

userRouter.post('/login', loginUser);

userRouter.get('/logout' , isAuthenticated, logoutUser);

userRouter.get('/users', getAllUsers);

userRouter.get('/refreshtoken', isAuthenticated, updateAccessToken);

userRouter.get('/me', updateAccessToken,  isAuthenticated, getUserInfo);

userRouter.put('/update-user-info', updateAccessToken, isAuthenticated, updateProfile);

userRouter.put('/update-username', updateAccessToken, isAuthenticated, updateUserName);


userRouter.put("/update-user-avatar", updateAccessToken, isAuthenticated, upload.single("avatar"), updateProfilePicture);

userRouter.put("/update-user-banner", updateAccessToken, isAuthenticated, upload.single("banner"), updateBannerPicture);








export default userRouter;