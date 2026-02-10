require('dotenv').config();
import mongoose, { Model, Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    nationality: string;
    age: number;
    purchasedProducts: {
        productId: string;
    }[];
    purchasedServices: {
        serviceId: string;
    }[];
    purchasedItems: {
        itemId: string;
        itemType: 'product' | 'service';
        purchaseDate: Date;
        orderId: string;
    }[];
    email: string;
    username: string;
    contactNumber: string;
    password: string;
    role: string;
    /** Marketplace identity: 'startup' | 'contributor' | 'user'. 'user' = no marketplace participation (student/instructor). */
    marketplace_role?: 'startup' | 'contributor' | 'user' | null;
    /** Only for marketplace_role === 'startup'. */
    startupName?: string;
    startupDescription?: string;
    /** Startup logo/image URL (Cloudinary) – synced from startup profile. */
    startupImageUrl?: string;
    /** Phase 2: true when startup has completed onboarding (e.g. confirmed profile). */
    startupOnboardingComplete?: boolean;
    /** Phase 2: true when contributor has completed onboarding. */
    contributorOnboardingComplete?: boolean;
    /** Solana wallet public key (base58) for on-chain milestone integration. */
    solanaWallet?: string;
    /** Stripe Connect Express account ID for receiving payments (instructor, startup, contributor). */
    stripeConnectAccountId?: string;
    /** Stripe Connect onboarding status: pending | active. */
    stripeConnectStatus?: 'pending' | 'active';
    /** False when user was created via Auth0 and has not yet chosen role/marketplace (Startup/Contributor/Student/Instructor). Default true for backward compatibility. */
    roleProfileCompleted?: boolean;
    /** Platform points. 1 EqualUSD = $1 USD. Used for course discounts, earned via registration, course completion, proposal approval. */
    equalUsdBalance?: number;
    avatar: string;
    banner: string;
    bio: string;
    instructorHeadline: string;
    instructorBio: string;
    instructorStatus: string;
    isVerified: boolean;
    isSeller: boolean;
    testuser: boolean;
    products: mongoose.Types.ObjectId[];
    socialAccounts: {
        platform: string;
        username: string;
        isVerified: boolean;
    }[];
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please enter your first name'],
    },
    lastName: {
        type: String,
        required: [true, 'Please enter your last name'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Please enter your date of birth'],
    },
    nationality: {
        type: String,
        required: [true, 'Please enter your nationality'],
    },
    age: {
        type: Number,
        required: [true, 'Please enter your age'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        validate: {
            validator: function (email: string) {
                return emailRegexPattern.test(email);
            },
            message: 'Please enter a valid email address',
        },
        unique: true,
    },
    username: {
        type: String,
        required: [true, 'Please enter your username'],
        unique: true,
    },
    contactNumber: {
        type: String,
        required: [true, 'Please enter your contact number'],
    },
    password: {
        type: String,
        select: false,
        minlength: [6, 'Your password must be longer than 6 characters'],
        required: [true, 'Please enter your password'],
    },
    role: {
        type: String,
        enum: ['user', 'instructor', 'admin', 'influencer'],
        default: 'user',
        required: true,
    },
    marketplace_role: {
        type: String,
        default: 'user',
        enum: ['startup', 'contributor', 'user'],
        required: false,
    },
    startupName: { type: String, required: false, trim: true },
    startupDescription: { type: String, required: false, trim: true },
    /** Startup logo/image URL (Cloudinary) – synced from startup profile */
    startupImageUrl: { type: String, required: false, trim: true },
    startupOnboardingComplete: { type: Boolean, default: false },
    contributorOnboardingComplete: { type: Boolean, default: false },
    solanaWallet: { type: String, required: false, trim: true },
    stripeConnectAccountId: { type: String, required: false, trim: true },
    stripeConnectStatus: { type: String, enum: ['pending', 'active'], default: 'pending' },
    roleProfileCompleted: { type: Boolean, default: true },
    equalUsdBalance: { type: Number, default: 0, min: 0 },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isSeller: {
        type: Boolean,
        default: false,
    },
    testuser: {
        type: Boolean,
        default: false,
    },
    bio : {
        type: String,
        default: 'No bio available',
    },
    instructorHeadline: {
        type: String,
        default: '',
    },
    instructorBio: {
        type: String,
        default: '',
    },
    instructorStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    avatar : {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg',
    },
    banner : {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg',
    },
    socialAccounts: [
        {
            platform: {
                type: String,
                required: true,
            },
            username: {
                type: String,
                required: true,
            },
            isVerified: {
                type: Boolean,
                default: false,
            }
        }
    ],
    
    purchasedProducts: [
        {
            productId: String,
        }
    ],
    purchasedServices: [
        {
            serviceId: String,
        }
    ],
    purchasedItems: [
        {
            itemId: {
                type: String,
                required: true
            },
            itemType: {
                type: String,
                enum: ['product', 'service'],
                required: true
            },
            purchaseDate: {
                type: Date,
                default: Date.now
            },
            orderId: {
                type: String,
                required: true
            }
        }
    ],
}, { timestamps: true });

userSchema.virtual("products", {
    ref: "Product",              
    localField: "_id",           
    foreignField: "createdBy",  
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });


// Hash password before saving user
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

// Sign JWT access token
userSchema.methods.SignAccessToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", { expiresIn: '1h' });
};


// Sign JWT refresh token
userSchema.methods.SignRefreshToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", { expiresIn: '3d' });
};

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel: Model<IUser> = mongoose.model('User', userSchema);

export default UserModel;
