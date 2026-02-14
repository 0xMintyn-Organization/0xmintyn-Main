import axios from 'axios';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model';
import { CourseModel } from '../models/course.model';
import UserModel from '../models/user.mode';
import mongoose from 'mongoose';

dotenv.config();

const API_BASE_URL = process.env.SERVER_URL || 'http://localhost:8000/api/v1';
const AUTH_USER = process.env.DIRECT_REGISTER_AUTH_USER || 'admin_equalmint';
const AUTH_PASSWORD = process.env.DIRECT_REGISTER_AUTH_PASSWORD || 'equalmint$$804';
const DB_URI = process.env.DB_URI;

// Course IDs provided
const COURSE_IDS = [
  '698fb312948a4a9fc03ed279',
  '698e676a948a4a9fc03ec536',
  '698e4765948a4a9fc03ec3fc',
  '698dce30948a4a9fc03ec0ec',
  '698d790d34e1b9d3090f3547'
];

// Professional UK-based name prefixes
const FIRST_NAMES = [
  'Alexander', 'Benjamin', 'Christopher', 'David', 'Edward',
  'Frederick', 'George', 'Henry', 'Isaac', 'James',
  'Katherine', 'Lucy', 'Margaret', 'Olivia', 'Patricia',
  'Sophia', 'Thomas', 'Victoria', 'William', 'Xavier'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Martinez', 'Taylor',
  'Anderson', 'Thomas', 'Moore', 'Jackson', 'Martin',
  'Lee', 'White', 'Harris', 'Thompson', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Allen', 'Young',
  'Hernandez', 'King', 'Wright', 'Lopez', 'Hill'
];

const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'protonmail.com'
];

const UK_PHONE_PREFIXES = ['07', '02', '01'];

interface CreatedUser {
  userId: string;
  email: string;
  username: string;
}

// Generate unique username
function generateUsername(index: number): string {
  const prefixes = ['uk', 'pro', 'lead', 'elite', 'prime', 'core', 'nexus', 'apex'];
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefixes[index % prefixes.length]}_${suffix}_${index}`.toLowerCase();
}

// Generate professional email
function generateEmail(firstName: string, lastName: string, index: number): string {
  const domain = EMAIL_DOMAINS[index % EMAIL_DOMAINS.length];
  const emailProviders = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${index}`,
    `${lastName.toLowerCase()}.${firstName.charAt(0)}`,
  ];
  return `${emailProviders[index % emailProviders.length]}${index}@${domain}`;
}

// Generate UK phone number
function generatePhoneNumber(index: number): string {
  const prefix = UK_PHONE_PREFIXES[index % UK_PHONE_PREFIXES.length];
  const middleNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const lastNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `+44${prefix}${middleNum}${lastNum}`;
}

// Create Basic Auth header
function getBasicAuthHeader(): string {
  const credentials = Buffer.from(`${AUTH_USER}:${AUTH_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

// Register user via direct-register API
async function registerUser(index: number): Promise<CreatedUser | null> {
  try {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const username = generateUsername(index);
    const email = generateEmail(firstName, lastName, index);
    const contactNumber = generatePhoneNumber(index);
    const dateOfBirth = new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

    const response = await axios.post(
      `${API_BASE_URL}/user/register-direct`,
      {
        firstName,
        lastName,
        email,
        username,
        password: 'TempPassword123!@#',
        contactNumber,
        dateOfBirth: dateOfBirth.toISOString(),
        nationality: 'United Kingdom',
        marketplace_role: Math.random() > 0.5 ? 'startup' : 'contributor',
      },
      {
        headers: {
          Authorization: getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.userId) {
      return {
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username,
      };
    }
    return null;
  } catch (error: any) {
    console.error(`❌ Failed to register user ${index}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Create enrollment order in database
async function createEnrollmentOrder(userId: string, courseId: string, courseDetails: any): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return false;
    }

    const course = await CourseModel.findById(courseId).populate('createdBy', 'firstName lastName');
    if (!course) {
      console.error(`Course ${courseId} not found`);
      return false;
    }

    // Check if already enrolled
    const existingOrder = await OrderModel.findOne({
      courseId,
      userId,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingOrder) {
      console.log(`   ⚠️  User already enrolled in course ${courseId}`);
      return true;
    }

    const orderData = {
      courseId,
      userId,
      courseName: course.name,
      coursePrice: course.price,
      courseThumbnail: course.thumbnail,
      instructorId: (course.createdBy as any)._id.toString(),
      instructorName: `${(course.createdBy as any).firstName} ${(course.createdBy as any).lastName}`,
      status: 'completed' as const,
      payment_info: {
        paymentMethod: course.price > 0 ? 'stripe' : 'free_enrollment',
        paymentStatus: 'completed',
        amount: course.price,
        currency: 'USD'
      },
      enrolledAt: new Date(),
      completedAt: new Date(),
    };

    const order = await OrderModel.create(orderData);
    console.log(`   ✅ Order created for course ${course.name}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Failed to create order for user ${userId}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    if (!DB_URI) {
      throw new Error('DB_URI not configured in .env');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Validate courses exist
    console.log('📚 Validating courses...');
    const courses = [];
    for (const courseId of COURSE_IDS) {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        console.warn(`⚠️  Course ${courseId} not found`);
      } else {
        courses.push({ _id: courseId, name: course.name });
        console.log(`   ✅ Found course: ${course.name}`);
      }
    }

    if (courses.length === 0) {
      throw new Error('No valid courses found!');
    }
    console.log(`\n📋 Using ${courses.length} courses for enrollment\n`);

    // Create users and enroll them
    const BATCH_SIZE = 50; // Create in batches for better performance
    const TOTAL_USERS = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let batch = 0; batch < TOTAL_USERS; batch += BATCH_SIZE) {
      const batchEnd = Math.min(batch + BATCH_SIZE, TOTAL_USERS);
      console.log(`\n📊 Batch ${Math.floor(batch / BATCH_SIZE) + 1}: Creating users ${batch + 1}-${batchEnd}...`);

      const batchPromises = [];
      for (let i = batch; i < batchEnd; i++) {
        batchPromises.push(registerUser(i));
      }

      const users = await Promise.all(batchPromises);

      // Process each created user
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userIndex = batch + i;

        if (!user) {
          failureCount++;
          continue;
        }

        successCount++;

        console.log(`\n👤 User ${userIndex + 1}/500: ${user.username} (${user.email})`);

        // Enroll in each course
        for (const courseId of COURSE_IDS) {
          const course = courses.find(c => c._id === courseId);
          if (course) {
            await createEnrollmentOrder(user.userId, courseId, course);
            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    }

    console.log(`\n\n✨ BULK ENROLLMENT COMPLETED ✨`);
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Successfully created users: ${successCount}`);
    console.log(`❌ Failed to create users: ${failureCount}`);
    console.log(`📚 Courses enrolled per user: ${COURSE_IDS.length}`);
    console.log(`📝 Total orders created: ${successCount * COURSE_IDS.length}`);
    console.log(`${'='.repeat(50)}\n`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();
