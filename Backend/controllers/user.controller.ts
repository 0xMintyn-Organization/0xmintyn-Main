require('dotenv').config();
import ejs from 'ejs';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import path from 'path';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import UserModel, { IUser } from '../models/user.mode';
import { getUserById } from '../services/user.services';
import ErrorHandler from '../utils/errorHandler';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import sendEmail from '../utils/sendMail';

    // Register a user
    interface IRegistrationBody {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        nationality: string;
        age: number;
        email: string;
        username: string;
        contactNumber: string;
        password: string;
    }

    export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { firstName, lastName, dateOfBirth, nationality, age, email, username, contactNumber, password }: IRegistrationBody = req.body;
            const isEmailExist = await UserModel.findOne({ email });
            const isUsernameExist = await UserModel.findOne({ username });

            if (isEmailExist) {
                return next(new ErrorHandler('Email already exists', 400));
            }

            if (isUsernameExist) {
                return next(new ErrorHandler('Username already exists', 400));
            }

            const user: IRegistrationBody = {
                firstName,
                lastName,
                dateOfBirth,
                nationality,
                age,
                email,
                username,
                contactNumber,
                password
            };

            // @ts-ignore
            const activationToken = createActivationToken(user); 
            const activationCode = activationToken.activationCode;
            console.log(activationCode);

            const data = { user: { name: user.firstName }, activationCode };
            const html = await ejs.renderFile(path.join(__dirname, '../mails/activatiomail.ejs'), data);
            try {
                await sendEmail({
                    email,
                    subject: 'Account activation',
                    template: 'activatiomail.ejs',
                    data
                });
                res.status(200).json({
                    success: true,
                    message: `Please check your email ${user.email} to activate your account`,
                    activationToken: activationToken.token
                });
            } catch (error) {
                return next(new ErrorHandler(error.message, 500));
            }

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Create activation token
    export const createActivationToken = (user: IUser) => {
        const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const token = jwt.sign({
            user,
            activationCode
        }, process.env.ACTIVATION_SECRET as Secret, { expiresIn: '5m' });
        return { token, activationCode };
    };

    // Activate user account
    interface IActivationRequest {
        activation_token: string;
        activation_code: string;
    }

    export const activateUserAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } = req.body as IActivationRequest;

            const newUser: { user: IUser, activationCode: string } = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as string) as { user: IUser, activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler('Invalid Activation Code', 400));
            }

            const { email } = newUser.user;

            const existUser = await UserModel.findOne({ email });
            if (existUser) {
                return next(new ErrorHandler('User already exists', 400));
            }

            const user = await UserModel.create(newUser.user);

            res.status(200).json({
                success: true,
                message: 'Account Activated Successfully',
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Login user
    interface ILoginBody {
        email: string;
        password: string;
    }

    export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password }: ILoginBody = req.body;
            if (!email || !password) {
                return next(new ErrorHandler('Please enter email and password', 400));
            }

            const user = await UserModel.findOne({ email }).select('+password');
            if (!user) {
                return next(new ErrorHandler('Invalid email or password', 401));
            }

            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                return next(new ErrorHandler('Invalid email or password', 401));
            }

            sendToken(user, 200, res);

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Logout user
    export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie('access_token', "", { maxAge: 1 });
            res.cookie('refresh_token', "", { maxAge: 1 });
            const UserId = req.user?._id || ''; // @ts-ignore 
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // update access token (as route handler for /refreshtoken)
    export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_token = req.cookies.refresh_token as string;
            if (!refresh_token) {
                return next(new ErrorHandler('Please login to access this resource', 400));
            }
            const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
            const message = 'Could not update access token';
            if (!decoded) {
                return next(new ErrorHandler(message, 400));
            }
            const session = await UserModel.findById(decoded.id).select("+password");

            if (!session) {
                return next(new ErrorHandler("Please login to access this resource", 400));
            }

            const user = session.toJSON();

            const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '1h' });

            const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: '3d' });

            res.cookie('access_token', accessToken, accessTokenOptions);
            res.cookie('refresh_token', refreshToken, refreshTokenOptions);

            res.status(200).json({
                success: true,
                accessToken,
                user: {
                    _id: user._id,
                    name: user.firstName + ' ' + user.lastName,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    isVerified: user.isVerified
                }
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));

        }
    });

    // update access token (as middleware)
    export const updateAccessTokenMiddleware = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_token = req.cookies.refresh_token as string;
            if (!refresh_token) {
                return next(new ErrorHandler('Please login to access this resource', 400));
            }
            const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
            const message = 'Could not update access token';
            if (!decoded) {
                return next(new ErrorHandler(message, 400));
            }
            const session = await UserModel.findById(decoded.id).select("+password");

            if (!session) {
                return next(new ErrorHandler("Please login to access this resource", 400));
            }

            const user = session.toJSON();

            const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '1h' });

            const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: '3d' });

            res.cookie('access_token', accessToken, accessTokenOptions);
            res.cookie('refresh_token', refreshToken, refreshTokenOptions);

            // Set user in request and continue to next middleware
            req.user = user;
            next();

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));

        }
    });



    export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id as string; // @ts-ignore
            getUserById(userId, res);
        }
        catch (error: any) {
            return next(new ErrorHandler(error.message, 400));

        }
    }
    );


    // update user profile
    interface IUpdateProfileBody {
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        nationality: string;
        age: number;
        contactNumber: string;
        bio: string;
    }

    export const updateProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { firstName, lastName, dateOfBirth, nationality, age, contactNumber , bio }: Partial<IUpdateProfileBody> = req.body;
            const userId = req.user?._id;

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // Update only provided fields
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (dateOfBirth) user.dateOfBirth = dateOfBirth;
            if (nationality) user.nationality = nationality;
            if (age) user.age = age;
            if (contactNumber) user.contactNumber = contactNumber;
            if (bio) user.bio = bio;

            await user.save();


            res.status(200).json({
                success: true,
                user,
                message: "Profile updated successfully",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    export const updateProfilePicture = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // @ts-ignore
            if (!req.file) {
                return next(new ErrorHandler("Please upload an image", 400));
            }

            const serverUrl = process.env.SERVER_URL || "http://localhost:8000"; 
            // @ts-ignore
            const avatarUrl = `${serverUrl}/uploads/files/${req.file.filename}`;

            user.avatar = avatarUrl; 
            await user.save();


            res.status(200).json({
                success: true,
                user,
                message: "Profile picture updated successfully",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    export const updateBannerPicture = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // @ts-ignore
            if (!req.file) {
                return next(new ErrorHandler("Please upload an image", 400));
            }

            const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
            // @ts-ignore
            const bannerUrl = `${serverUrl}/uploads/files/${req.file.filename}`;

            user.banner = bannerUrl;
            await user.save();

            res.status(200).json({
                success: true,
                user,
                message: "Banner picture updated successfully",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    export const updateUserName = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.body;
            const userId = req.user?._id as string; // @ts-ignore

            const user = await UserModel.findById(userId);
            if (!user) {    
                return next(new ErrorHandler("User not found", 404));
            }
            const isUsernameExist = await UserModel.findOne({   
                username,
            });
            if (isUsernameExist) {
                return next(new ErrorHandler('Username already exists', 400));
            }
            user.username = username;
            await user.save();


            res.status(200).json({
                success: true,
                user,
                message: "Username updated successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });


    export const getAllUsers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await UserModel.find({}).select('-password -__v').sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                users,
                message: "All users fetched successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    type IUpdatePasswordBody = {
        oldPassword: string;
        newPassword: string;
    };


    export const updatePassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { oldPassword, newPassword }: IUpdatePasswordBody = req.body;
            if (!oldPassword || !newPassword) {
                return next(new ErrorHandler('Please enter old and new password', 400));
            }

            const user = await UserModel.findById(req.user?._id).select('+password');
            if (user?.password === undefined) {
                return next(new ErrorHandler('User not found', 400));

            }

            if (!user) {
                return next(new ErrorHandler('Please login to access this resource', 400));
            }
            const isPasswordMatch = await user.comparePassword(oldPassword);
            if (!isPasswordMatch) {
                return next(new ErrorHandler('Invalid old password', 400));
            }
            user.password = newPassword;
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Password updated successfully',
                user,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));

        }
    });


    type ISocialAuthBody = {
        email: string;
        avatar: string;
    };

    // social Auth 
    export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {  email, avatar } = req.body as ISocialAuthBody;
            const user = await UserModel.findOne({ email });

            if (!user) {
                const newUser = await UserModel.create({
                    email,
                    avatar
                });
                sendToken(newUser, 200, res);
            }
            else {
                sendToken(user, 200, res);
            }


        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));

        }
    });

    // Apply to become an instructor
    interface IInstructorApplication {
        headline: string;
        bio: string;
    }

    export const applyForInstructor = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { headline, bio }: IInstructorApplication = req.body;
            const userId = req.user?._id;

            if (!userId) {
                return next(new ErrorHandler('User not found', 400));
            }

            // Validate input
            if (!headline || !bio) {
                return next(new ErrorHandler('Headline and bio are required', 400));
            }

            if (headline.length < 10 || headline.length > 100) {
                return next(new ErrorHandler('Headline must be between 10 and 100 characters', 400));
            }

            if (bio.length < 50 || bio.length > 500) {
                return next(new ErrorHandler('Bio must be between 50 and 500 characters', 400));
            }

            // Update user with instructor application data
            const user = await UserModel.findByIdAndUpdate(
                userId,
                {
                    instructorHeadline: headline,
                    instructorBio: bio,
                    instructorStatus: 'approved', // Auto-approve for now
                    role: 'instructor' // Automatically promote to instructor
                },
                { new: true }
            );

            if (!user) {
                return next(new ErrorHandler('User not found', 400));
            }

            // Generate new access token with updated role
            const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '1h' });
            
            res.status(200).json({
                success: true,
                message: 'Congratulations! You are now an instructor. You can create and manage courses.',
                accessToken,
                user: {
                    _id: user._id,
                    name: user.firstName + ' ' + user.lastName,
                    email: user.email,
                    role: user.role,
                    instructorHeadline: user.instructorHeadline,
                    instructorBio: user.instructorBio,
                    instructorStatus: user.instructorStatus
                }
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Toggle seller status
    export const toggleSellerStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // Toggle the isSeller status
            user.isSeller = !user.isSeller;
            await user.save();

            res.status(200).json({
                success: true,
                message: user.isSeller ? "Seller status activated successfully" : "Seller status deactivated successfully",
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    isVerified: user.isVerified,
                    isSeller: user.isSeller,
                    avatar: user.avatar,
                    banner: user.banner,
                    bio: user.bio
                }
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Add or update social account
    export const updateSocialAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const { platform, username } = req.body;

            if (!platform || !username) {
                return next(new ErrorHandler("Platform and username are required", 400));
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // Check if social account already exists
            const existingAccountIndex = user.socialAccounts.findIndex(
                (account: any) => account.platform.toLowerCase() === platform.toLowerCase()
            );

            if (existingAccountIndex !== -1) {
                // Update existing account
                user.socialAccounts[existingAccountIndex].username = username;
            } else {
                // Add new account
                user.socialAccounts.push({
                    platform,
                    username,
                    isVerified: false
                });
            }

            await user.save();

            res.status(200).json({
                success: true,
                user,
                message: "Social account updated successfully",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Remove social account
    export const removeSocialAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const { platform } = req.body;

            if (!platform) {
                return next(new ErrorHandler("Platform is required", 400));
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return next(new ErrorHandler("User not found", 404));
            }

            // Remove the social account
            user.socialAccounts = user.socialAccounts.filter(
                (account: any) => account.platform.toLowerCase() !== platform.toLowerCase()
            );

            await user.save();

            res.status(200).json({
                success: true,
                user,
                message: "Social account removed successfully",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });