require('dotenv').config();
import ejs from 'ejs';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import path from 'path';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import UserModel, { IUser } from '../models/user.mode';
import StartupProfileModel from '../models/startupProfile.model';
import ContributorProfileModel from '../models/contributorProfile.model';
import { getUserById } from '../services/user.services';
import ErrorHandler from '../utils/errorHandler';
import { accessTokenOptions, refreshTokenOptions, sendToken, clearCookieOptions } from '../utils/jwt';
import { createLoginCode, consumeLoginCode } from '../utils/loginCodeStore';
import sendEmail from '../utils/sendMail';
import logger from '../utils/logger';

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
    /** Marketplace identity: 'startup' | 'contributor'. Platform role remains 'user' for both. */
    marketplace_role?: 'startup' | 'contributor';
    /** Required when marketplace_role === 'startup'. */
    startupName?: string;
    startupDescription?: string;
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { firstName, lastName, dateOfBirth, nationality, age, email, username, contactNumber, password, marketplace_role, startupName, startupDescription }: IRegistrationBody = req.body;
            
            // Validate required fields (including marketplace selection)
            if (!email || !username || !password) {
                return next(new ErrorHandler('Email, username, and password are required', 400));
            }
            if (marketplace_role !== 'startup' && marketplace_role !== 'contributor') {
                return next(new ErrorHandler('Please choose how you want to sign up: Startup or Contributor', 400));
            }
            if (marketplace_role === 'startup' && (!startupName || typeof startupName !== 'string' || !startupName.trim())) {
                return next(new ErrorHandler('Startup name is required when signing up as a startup', 400));
            }


            // Check if email already exists BEFORE sending OTP
            const isEmailExist = await UserModel.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
            }

            // Check if username already exists BEFORE sending OTP
            const isUsernameExist = await UserModel.findOne({ username });
            if (isUsernameExist) {
                return next(new ErrorHandler('This username is already taken. Please choose a different username.', 400));
            }


            const user: IRegistrationBody & { marketplace_role: 'startup' | 'contributor'; startupName?: string; startupDescription?: string } = {
                firstName,
                lastName,
                dateOfBirth,
                nationality,
                age,
                email,
                username,
                contactNumber,
                password,
                marketplace_role,
            };
            if (marketplace_role === 'startup') {
                user.startupName = startupName?.trim();
                if (startupDescription && typeof startupDescription === 'string' && startupDescription.trim()) {
                    user.startupDescription = startupDescription.trim();
                }
            }

            // @ts-ignore
            const activationToken = createActivationToken(user); 
            const activationCode = activationToken.activationCode;
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Registration OTP]', activationCode, '| email:', user.email);
            }
            logger.debug('Activation code generated', { email: user.email });

            // Build activation link for token-based email verification
            const clientUrl =
                process.env.CLIENT_URL || "http://localhost:3000/";
            const normalizedClientUrl = clientUrl.endsWith("/")
                ? clientUrl.slice(0, -1)
                : clientUrl;
            const activationLink = `${normalizedClientUrl}/activation-link?token=${activationToken.token}`;

            const data = {
                user: { name: user.firstName },
                activationCode,
                activationLink,
            };
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

    /**
     * Secret direct-registration API (no OTP/email).
     * Protected by Basic Auth via middleware.
     * POST body: same as register (firstName, lastName, dateOfBirth, nationality, age, email, username, contactNumber, password).
     * Optional: role (user|instructor|admin|influencer). User is created with isVerified: true.
     */
    export const directRegisterUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                firstName,
                lastName,
                dateOfBirth,
                nationality,
                age,
                email,
                username,
                contactNumber,
                password,
                role: roleOverride,
                marketplace_role: marketplaceRoleOverride,
                startupName,
                startupDescription,
            } = req.body as IRegistrationBody & { role?: string; marketplace_role?: 'startup' | 'contributor'; startupName?: string; startupDescription?: string };

            if (!firstName || !lastName || !email || !username || !password || !contactNumber || !nationality) {
                return next(new ErrorHandler('firstName, lastName, email, username, password, contactNumber, and nationality are required', 400));
            }

            const isEmailExist = await UserModel.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler('This email is already registered.', 400));
            }
            const isUsernameExist = await UserModel.findOne({ username });
            if (isUsernameExist) {
                return next(new ErrorHandler('This username is already taken.', 400));
            }

            const parsedDob = dateOfBirth ? new Date(dateOfBirth) : new Date();
            const computedAge = age != null && !isNaN(Number(age)) ? Number(age) : Math.max(0, new Date().getFullYear() - parsedDob.getFullYear());
            const validRoles = ['user', 'instructor', 'admin', 'influencer'];
            const role = roleOverride && validRoles.includes(roleOverride) ? roleOverride : 'user';

            const userPayload: Record<string, any> = {
                firstName,
                lastName,
                dateOfBirth: parsedDob,
                nationality,
                age: computedAge,
                email,
                username,
                contactNumber,
                password,
                role,
                isVerified: true,
                testuser: true,
            };
            if (marketplaceRoleOverride === 'startup' || marketplaceRoleOverride === 'contributor') {
                userPayload.marketplace_role = marketplaceRoleOverride;
            }
            if (marketplaceRoleOverride === 'startup') {
                if (startupName && typeof startupName === 'string' && startupName.trim()) {
                    userPayload.startupName = startupName.trim();
                }
                if (startupDescription && typeof startupDescription === 'string' && startupDescription.trim()) {
                    userPayload.startupDescription = startupDescription.trim();
                }
            }

            const user = await UserModel.create(userPayload);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                userId: user._id,
                email: user.email,
                username: user.username,
            });
        } catch (error: any) {
            if (error.code === 11000) {
                const key = Object.keys(error.keyValue || {})[0];
                if (key === 'email') return next(new ErrorHandler('This email is already registered.', 400));
                if (key === 'username') return next(new ErrorHandler('This username is already taken.', 400));
            }
            return next(new ErrorHandler(error.message || 'Failed to create user', 400));
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

    interface ILinkActivationRequest {
        activation_token: string;
    }

    export const activateUserAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } = req.body as IActivationRequest;

            if (!activation_token || !activation_code) {
                return next(new ErrorHandler('Activation token and code are required', 400));
            }

            // Verify JWT token
            let newUser: { user: IUser, activationCode: string };
            try {
                newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as string) as { user: IUser, activationCode: string };
            } catch (jwtError: any) {
                if (jwtError.name === 'TokenExpiredError') {
                    return next(new ErrorHandler('Activation code has expired. Please register again.', 400));
                }
                if (jwtError.name === 'JsonWebTokenError') {
                    return next(new ErrorHandler('Invalid activation token. Please register again.', 400));
                }
                return next(new ErrorHandler('Invalid activation token', 400));
            }

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler('Invalid activation code. Please check your email and try again.', 400));
            }

            const { email, username } = newUser.user;

            // Double-check if user already exists (before creating)
            const existUser = await UserModel.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existUser) {
                if (existUser.email === email) {
                    return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                }
                if (existUser.username === username) {
                    return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                }
            }

            // Create user with role 'user' and optional marketplace_role from registration
            const userToCreate: Record<string, any> = { ...newUser.user };
            userToCreate.role = 'user';
            if (newUser.user.marketplace_role === 'startup' || newUser.user.marketplace_role === 'contributor') {
                userToCreate.marketplace_role = newUser.user.marketplace_role;
            }
            if (newUser.user.marketplace_role === 'startup') {
                if (newUser.user.startupName) userToCreate.startupName = newUser.user.startupName;
                if (newUser.user.startupDescription) userToCreate.startupDescription = newUser.user.startupDescription;
            }

            try {
                await UserModel.create(userToCreate);
            } catch (createError: any) {
                // Handle MongoDB duplicate key error
                if (createError.code === 11000) {
                    const duplicateField = Object.keys(createError.keyValue || {})[0];
                    if (duplicateField === 'email') {
                        return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                    } else if (duplicateField === 'username') {
                        return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                    }
                    return next(new ErrorHandler('This account already exists. Please log in instead.', 400));
                }
                // Re-throw if it's not a duplicate key error
                throw createError;
            }

            res.status(200).json({
                success: true,
                message: 'Account Activated Successfully',
            });

        } catch (error: any) {
            // Handle any other errors with user-friendly messages
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue || {})[0];
                if (duplicateField === 'email') {
                    return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                } else if (duplicateField === 'username') {
                    return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                }
                return next(new ErrorHandler('This account already exists. Please log in instead.', 400));
            }
            return next(new ErrorHandler(error.message || 'Failed to activate account. Please try again.', 400));
        }
    });

    // Activate user account using token link (no code input)
    export const activateUserAccountByLink = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token } = req.body as ILinkActivationRequest;

            if (!activation_token) {
                return next(new ErrorHandler('Activation token is required', 400));
            }

            // Verify JWT token
            let newUser: { user: IUser, activationCode: string };
            try {
                newUser = jwt.verify(
                    activation_token,
                    process.env.ACTIVATION_SECRET as string
                ) as { user: IUser, activationCode: string };
            } catch (jwtError: any) {
                if (jwtError.name === 'TokenExpiredError') {
                    return next(new ErrorHandler('Activation link has expired. Please register again.', 400));
                }
                if (jwtError.name === 'JsonWebTokenError') {
                    return next(new ErrorHandler('Invalid activation link. Please register again.', 400));
                }
                return next(new ErrorHandler('Invalid activation token', 400));
            }

            const { email, username } = newUser.user;

            // Double-check if user already exists (before creating)
            const existUser = await UserModel.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existUser) {
                if (existUser.email === email) {
                    return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                }
                if (existUser.username === username) {
                    return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                }
            }

            // Create user with role 'user', optional marketplace_role, and startup fields (link activation)
            const userDataLink: Record<string, any> = { ...newUser.user };
            userDataLink.role = 'user';
            if (newUser.user.marketplace_role === 'startup' || newUser.user.marketplace_role === 'contributor') {
                userDataLink.marketplace_role = newUser.user.marketplace_role;
            }
            if (newUser.user.marketplace_role === 'startup') {
                if (newUser.user.startupName) userDataLink.startupName = newUser.user.startupName;
                if (newUser.user.startupDescription) userDataLink.startupDescription = newUser.user.startupDescription;
            }

            try {
                await UserModel.create(userDataLink);
            } catch (createError: any) {
                // Handle MongoDB duplicate key error
                if (createError.code === 11000) {
                    const duplicateField = Object.keys(createError.keyValue || {})[0];
                    if (duplicateField === 'email') {
                        return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                    } else if (duplicateField === 'username') {
                        return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                    }
                    return next(new ErrorHandler('This account already exists. Please log in instead.', 400));
                }
                // Re-throw if it's not a duplicate key error
                throw createError;
            }

            res.status(200).json({
                success: true,
                message: 'Account Activated Successfully',
            });
        } catch (error: any) {
            // Handle any other errors with user-friendly messages
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue || {})[0];
                if (duplicateField === 'email') {
                    return next(new ErrorHandler('This email is already registered. Please log in instead.', 400));
                } else if (duplicateField === 'username') {
                    return next(new ErrorHandler('This username is already taken. Please register with a different username.', 400));
                }
                return next(new ErrorHandler('This account already exists. Please log in instead.', 400));
            }
            return next(new ErrorHandler(error.message || 'Failed to activate account. Please try again.', 400));
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

            // Log role and marketplace_role for debugging / verification
            logger.info('User logged in', {
                userId: user._id,
                email: user.email,
                role: user.role,
                marketplace_role: user.marketplace_role ?? null,
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Login] role:', user.role, '| marketplace_role:', user.marketplace_role ?? null);
            }

            // One-time code for website → MVP redirect so MVP can set session via its own request (avoids cross-origin cookie issues)
            const loginCode = createLoginCode(user._id.toString());
            sendToken(user, 200, res, { loginCode });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    /** Exchange one-time login code (from website redirect) for session cookies. No auth required. */
    export const sessionFromCode = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const code = (req.query.code as string)?.trim();
            if (!code) return next(new ErrorHandler('Missing code', 400));
            const userId = consumeLoginCode(code);
            if (!userId) return next(new ErrorHandler('Invalid or expired code', 400));
            const user = await UserModel.findById(userId).select('-password -createdAt -updatedAt -__v');
            if (!user) return next(new ErrorHandler('User not found', 404));
            sendToken(user, 200, res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Logout user
    export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Clear cookies with same options used when setting them (must match jwt.ts)
            const opts = { ...clearCookieOptions };
            res.cookie('access_token', '', { ...opts, maxAge: 0, expires: new Date(0) });
            res.cookie('refresh_token', '', { ...opts, maxAge: 0, expires: new Date(0) });
            res.clearCookie('access_token', opts);
            res.clearCookie('refresh_token', opts);
            
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

    /** Phase 2: Mark startup onboarding complete. Optional body: startupName, startupDescription. */
    export const completeStartupOnboarding = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const user = await UserModel.findById(userId);
            if (!user) return next(new ErrorHandler('User not found', 404));
            if (user.marketplace_role !== 'startup') {
                return next(new ErrorHandler('Only startup users can complete startup onboarding', 403));
            }
            const { startupName, startupDescription } = req.body as { startupName?: string; startupDescription?: string };
            if (startupName != null && typeof startupName === 'string' && startupName.trim()) user.startupName = startupName.trim();
            if (startupDescription != null && typeof startupDescription === 'string') user.startupDescription = startupDescription.trim();
            user.startupOnboardingComplete = true;
            await user.save();
            // Phase 3: create or update StartupProfile when onboarding completes
            const existingStartupProfile = await StartupProfileModel.findOne({ userId: user._id });
            if (existingStartupProfile) {
                existingStartupProfile.companyName = user.startupName || existingStartupProfile.companyName;
                existingStartupProfile.description = user.startupDescription ?? existingStartupProfile.description;
                await existingStartupProfile.save();
            } else {
                await StartupProfileModel.create({
                    userId: user._id,
                    companyName: user.startupName || 'My Startup',
                    description: user.startupDescription || '',
                    status: 'approved',
                });
            }
            res.status(200).json({ success: true, user, message: 'Startup onboarding completed' });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    /** Phase 2: Mark contributor onboarding complete. Phase 3: create ContributorProfile if not exists. */
    export const completeContributorOnboarding = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            const user = await UserModel.findById(userId);
            if (!user) return next(new ErrorHandler('User not found', 404));
            if (user.marketplace_role !== 'contributor') {
                return next(new ErrorHandler('Only contributor users can complete contributor onboarding', 403));
            }
            user.contributorOnboardingComplete = true;
            await user.save();
            // Phase 3: create ContributorProfile if not exists
            const existingContributorProfile = await ContributorProfileModel.findOne({ userId: user._id });
            if (!existingContributorProfile) {
                await ContributorProfileModel.create({
                    userId: user._id,
                    skills: [],
                    portfolio: '',
                    paymentMethod: { methodType: '' },
                    earningsSummary: 0,
                    availability: '',
                });
            }
            res.status(200).json({ success: true, user, message: 'Contributor onboarding completed' });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

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

            // Upload avatar to Cloudinary
            const avatarUrl = await uploadUserAvatar(req.file.buffer, user._id.toString());

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

            // Upload banner to Cloudinary
            const bannerUrl = await uploadUserBanner(req.file.buffer, user._id.toString());

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

    // Forgot Password - Send reset email
    interface IForgotPasswordBody {
        email: string;
    }

    export const forgotPassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email }: IForgotPasswordBody = req.body;

            if (!email) {
                return next(new ErrorHandler('Please provide your email address', 400));
            }

            const user = await UserModel.findOne({ email });
            
            // For security, don't reveal if email exists or not
            // Always return success message
            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: 'If an account exists with this email, you will receive password reset instructions.',
                });
            }

            // Create reset token (expires in 15 minutes)
            const resetToken = jwt.sign(
                { userId: user._id },
                process.env.ACTIVATION_SECRET as Secret,
                { expiresIn: '15m' }
            );

            // Build reset link
            const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
            const normalizedClientUrl = clientUrl.endsWith("/") ? clientUrl.slice(0, -1) : clientUrl;
            const resetLink = `${normalizedClientUrl}/reset-password?token=${resetToken}`;

            const data = {
                user: { name: user.firstName || 'User' },
                resetLink,
            };

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Password Reset Request - Equalmint',
                    template: 'resetPassword.ejs',
                    data,
                });

                res.status(200).json({
                    success: true,
                    message: 'If an account exists with this email, you will receive password reset instructions.',
                });
            } catch (error: any) {
                logger.error('Error sending reset email:', { error: error.message, email });
                return next(new ErrorHandler('Failed to send reset email. Please try again later.', 500));
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    });

    // Reset Password - Handle password reset with token
    interface IResetPasswordBody {
        token: string;
        newPassword: string;
    }

    export const resetPassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, newPassword }: IResetPasswordBody = req.body;

            if (!token || !newPassword) {
                return next(new ErrorHandler('Token and new password are required', 400));
            }

            if (newPassword.length < 6) {
                return next(new ErrorHandler('Password must be at least 6 characters', 400));
            }

            // Verify reset token
            let decoded: { userId: string } | null = null;
            try {
                decoded = jwt.verify(token, process.env.ACTIVATION_SECRET as Secret) as { userId: string };
            } catch (jwtError: any) {
                if (jwtError.name === 'TokenExpiredError') {
                    return next(new ErrorHandler('Reset link has expired. Please request a new one.', 400));
                }
                if (jwtError.name === 'JsonWebTokenError') {
                    return next(new ErrorHandler('Invalid reset link. Please request a new one.', 400));
                }
                return next(new ErrorHandler('Invalid reset token', 400));
            }

            // Find user by ID from token
            const user = await UserModel.findById(decoded.userId).select('+password');
            
            if (!user) {
                return next(new ErrorHandler('User not found', 400));
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.',
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

    