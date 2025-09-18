import { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.mode";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import bcrypt from "bcryptjs";

// Create bulk users for testing (Admin only)
export const createBulkUsers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sampleUsers = [
            {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                password: "password123",
                role: "user",
                username: "johndoe",
                contactNumber: "+1234567890",
                age: 25,
                nationality: "American",
                dateOfBirth: new Date("1998-01-15"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Jane",
                lastName: "Smith",
                email: "jane.smith@example.com",
                password: "password123",
                role: "user",
                username: "janesmith",
                contactNumber: "+1234567891",
                age: 28,
                nationality: "Canadian",
                dateOfBirth: new Date("1995-03-22"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Mike",
                lastName: "Johnson",
                email: "mike.johnson@example.com",
                password: "password123",
                role: "instructor",
                username: "mikejohnson",
                contactNumber: "+1234567892",
                age: 32,
                nationality: "British",
                dateOfBirth: new Date("1991-07-10"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "Senior Web Developer & Instructor",
                instructorBio: "I'm a passionate developer with over 8 years of experience in web development. I've worked with companies like Google and Microsoft, and now I'm dedicated to teaching the next generation of developers."
            },
            {
                firstName: "Sarah",
                lastName: "Wilson",
                email: "sarah.wilson@example.com",
                password: "password123",
                role: "user",
                username: "sarahwilson",
                contactNumber: "+1234567893",
                age: 24,
                nationality: "Australian",
                dateOfBirth: new Date("1999-05-18"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "David",
                lastName: "Brown",
                email: "david.brown@example.com",
                password: "password123",
                role: "instructor",
                username: "davidbrown",
                contactNumber: "+1234567894",
                age: 35,
                nationality: "German",
                dateOfBirth: new Date("1988-12-03"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "Full Stack Developer & Tech Lead",
                instructorBio: "Experienced full-stack developer with expertise in React, Node.js, and cloud technologies. I love sharing knowledge and helping others grow in their coding journey."
            },
            {
                firstName: "Emily",
                lastName: "Davis",
                email: "emily.davis@example.com",
                password: "password123",
                role: "user",
                username: "emilydavis",
                contactNumber: "+1234567895",
                age: 26,
                nationality: "French",
                dateOfBirth: new Date("1997-09-14"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Chris",
                lastName: "Miller",
                email: "chris.miller@example.com",
                password: "password123",
                role: "user",
                username: "chrismiller",
                contactNumber: "+1234567896",
                age: 29,
                nationality: "Italian",
                dateOfBirth: new Date("1994-11-27"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Lisa",
                lastName: "Garcia",
                email: "lisa.garcia@example.com",
                password: "password123",
                role: "instructor",
                username: "lisagarcia",
                contactNumber: "+1234567897",
                age: 31,
                nationality: "Spanish",
                dateOfBirth: new Date("1992-04-08"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "UI/UX Designer & Frontend Developer",
                instructorBio: "Creative designer and developer with a passion for creating beautiful, user-friendly interfaces. I specialize in modern design principles and responsive web development."
            },
            {
                firstName: "Tom",
                lastName: "Anderson",
                email: "tom.anderson@example.com",
                password: "password123",
                role: "user",
                username: "tomanderson",
                contactNumber: "+1234567898",
                age: 27,
                nationality: "Dutch",
                dateOfBirth: new Date("1996-08-12"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Anna",
                lastName: "Taylor",
                email: "anna.taylor@example.com",
                password: "password123",
                role: "user",
                username: "annataylor",
                contactNumber: "+1234567899",
                age: 23,
                nationality: "Swedish",
                dateOfBirth: new Date("2000-02-25"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "James",
                lastName: "Thomas",
                email: "james.thomas@example.com",
                password: "password123",
                role: "instructor",
                username: "jamesthomas",
                contactNumber: "+1234567800",
                age: 33,
                nationality: "Irish",
                dateOfBirth: new Date("1990-06-19"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "Backend Developer & Database Expert",
                instructorBio: "Backend specialist with deep knowledge of databases, APIs, and server architecture. I enjoy teaching complex concepts in simple, understandable ways."
            },
            {
                firstName: "Maria",
                lastName: "Rodriguez",
                email: "maria.rodriguez@example.com",
                password: "password123",
                role: "user",
                username: "mariarodriguez",
                contactNumber: "+1234567801",
                age: 30,
                nationality: "Mexican",
                dateOfBirth: new Date("1993-10-07"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Kevin",
                lastName: "Lee",
                email: "kevin.lee@example.com",
                password: "password123",
                role: "user",
                username: "kevinlee",
                contactNumber: "+1234567802",
                age: 28,
                nationality: "Korean",
                dateOfBirth: new Date("1995-01-30"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Rachel",
                lastName: "White",
                email: "rachel.white@example.com",
                password: "password123",
                role: "instructor",
                username: "rachelwhite",
                contactNumber: "+1234567803",
                age: 29,
                nationality: "Japanese",
                dateOfBirth: new Date("1994-12-15"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "Mobile App Developer & React Native Expert",
                instructorBio: "Mobile development specialist with expertise in React Native, Flutter, and native iOS/Android development. I love creating cross-platform mobile experiences."
            },
            {
                firstName: "Alex",
                lastName: "Harris",
                email: "alex.harris@example.com",
                password: "password123",
                role: "user",
                username: "alexharris",
                contactNumber: "+1234567804",
                age: 26,
                nationality: "Brazilian",
                dateOfBirth: new Date("1997-03-28"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Sophie",
                lastName: "Clark",
                email: "sophie.clark@example.com",
                password: "password123",
                role: "user",
                username: "sophieclark",
                contactNumber: "+1234567805",
                age: 25,
                nationality: "Russian",
                dateOfBirth: new Date("1998-07-11"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Ryan",
                lastName: "Lewis",
                email: "ryan.lewis@example.com",
                password: "password123",
                role: "instructor",
                username: "ryanlewis",
                contactNumber: "+1234567806",
                age: 34,
                nationality: "Indian",
                dateOfBirth: new Date("1989-05-04"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "DevOps Engineer & Cloud Specialist",
                instructorBio: "DevOps expert with extensive experience in AWS, Docker, Kubernetes, and CI/CD pipelines. I help teams build scalable and reliable infrastructure."
            },
            {
                firstName: "Emma",
                lastName: "Walker",
                email: "emma.walker@example.com",
                password: "password123",
                role: "user",
                username: "emmawalker",
                contactNumber: "+1234567807",
                age: 24,
                nationality: "Chinese",
                dateOfBirth: new Date("1999-09-20"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Daniel",
                lastName: "Hall",
                email: "daniel.hall@example.com",
                password: "password123",
                role: "user",
                username: "danielhall",
                contactNumber: "+1234567808",
                age: 31,
                nationality: "South African",
                dateOfBirth: new Date("1992-11-13"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg"
            },
            {
                firstName: "Olivia",
                lastName: "Young",
                email: "olivia.young@example.com",
                password: "password123",
                role: "instructor",
                username: "oliviayoung",
                contactNumber: "+1234567809",
                age: 30,
                nationality: "New Zealand",
                dateOfBirth: new Date("1993-08-26"),
                avatar: "https://static.vecteezy.com/system/resources/previews/005/129/844/original/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg",
                instructorHeadline: "Data Scientist & Machine Learning Engineer",
                instructorBio: "Data science professional with expertise in Python, machine learning, and statistical analysis. I'm passionate about turning data into actionable insights."
            }
        ];

        const createdUsers = [];
        const errors = [];

        for (const userData of sampleUsers) {
            try {
                // Check if user already exists
                const existingUser = await UserModel.findOne({ 
                    $or: [
                        { email: userData.email },
                        { username: userData.username }
                    ]
                });

                if (existingUser) {
                    errors.push(`User with email ${userData.email} or username ${userData.username} already exists`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                // Create user
                const newUser = new UserModel({
                    ...userData,
                    password: hashedPassword,
                    isVerified: true, // Auto-verify for testing
                    instructorStatus: userData.role === 'instructor' ? 'approved' : 'pending'
                });

                const savedUser = await newUser.save();
                createdUsers.push({
                    _id: savedUser._id,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    email: savedUser.email,
                    username: savedUser.username,
                    role: savedUser.role,
                    instructorHeadline: savedUser.instructorHeadline,
                    instructorBio: savedUser.instructorBio
                });

            } catch (error: any) {
                errors.push(`Failed to create user ${userData.email}: ${error.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully created ${createdUsers.length} users`,
            createdUsers,
            errors: errors.length > 0 ? errors : undefined,
            totalCreated: createdUsers.length,
            totalErrors: errors.length
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
