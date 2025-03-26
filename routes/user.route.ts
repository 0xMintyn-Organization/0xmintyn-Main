import express from 'express';
import { activateUserAccount, getUserInfo, loginUser, logoutUser, registrationUser, updateAccessToken, updateProfile, updateProfilePicture } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const userRouter = express.Router();

userRouter.post('/register', registrationUser);

userRouter.post('/activate-user', activateUserAccount);

userRouter.post('/login', loginUser);

userRouter.get('/logout' , isAuthenticated, logoutUser);

userRouter.get('/refreshtoken', isAuthenticated, updateAccessToken);

userRouter.get('/me', updateAccessToken,  isAuthenticated, getUserInfo);

userRouter.put('/update-user-info', updateAccessToken, isAuthenticated, updateProfile);

userRouter.put("/update-user-avatar", updateAccessToken, isAuthenticated, upload.single("avatar"), updateProfilePicture);







export default userRouter;