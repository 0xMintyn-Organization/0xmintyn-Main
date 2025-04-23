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
    email: string;
    username: string;
    contactNumber: string;
    password: string;
    role: string;
    avatar: string;
    banner: string;
    bio: string;
    isVerified: boolean;
    products: mongoose.Types.ObjectId[];
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
        enum: ['user', 'admin'],
        default: 'user',
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    bio : {
        type: String,
        default: 'No bio available',
    },
    avatar : {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg',
    },
    banner : {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg',
    },
    
    
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
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", { expiresIn: '5m' });
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
