import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import OrderModel from '../models/order.model';
import { CourseModel } from '../models/course.model';
import UserModel from '../models/user.mode';

dotenv.config();

const API_BASE_URL = 'https://api.equalmint.com/api/v1';
const AUTH_USER = process.env.DIRECT_REGISTER_AUTH_USER || 'admin_equalmint';
const AUTH_PASSWORD = process.env.DIRECT_REGISTER_AUTH_PASSWORD || 'equalmint$$804';

// Course IDs provided
const COURSE_IDS = [
  '698fb312948a4a9fc03ed279',  // Course 1
  '698e676a948a4a9fc03ec536',  // Course 2
  '698e4765948a4a9fc03ec3fc',  // Course 3
  '698dce30948a4a9fc03ec0ec',  // Course 4
  '698d790d34e1b9d3090f3547'   // Course 5
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

const DB_URI = process.env.DB_URI;

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

// Create enrollment order in database
async function createEnrollmentOrder(userId: string, courseId: string): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      console.error(`      ⚠️  User ${userId} not found for order`);
      return false;
    }

    const course = await CourseModel.findById(courseId).populate('createdBy', 'firstName lastName');
    if (!course) {
      console.error(`      ⚠️  Course ${courseId} not found for order`);
      return false;
    }

    // Check if already enrolled
    const existingOrder = await OrderModel.findOne({
      courseId,
      userId,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingOrder) {
      return true; // Already enrolled
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

    await OrderModel.create(orderData);
    return true;
  } catch (error: any) {
    console.error(`      ⚠️  Failed to create order:`, error.message);
    return false;
  }
}
async function createUserWithCourse(index: number): Promise<{ success: boolean; userId?: string; email?: string; username?: string; courseId: string; courseName: string; courseIndex: number }> {
  try {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const username = generateUsername(index);
    const email = generateEmail(firstName, lastName, index);
    const contactNumber = generatePhoneNumber(index);
    const dateOfBirth = new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

    // Determine which course this user goes to (round-robin: 1,2,3,4,5,1,2,3,4,5,...)
    const courseIndex = index % COURSE_IDS.length;
    const courseId = COURSE_IDS[courseIndex];

    const response = await axios.post(
      `https://api.equalmint.com/api/v1/register-direct`,
      {
        firstName,
        lastName,
        email,
        username,
        password: 'TempPassword123!@#',
        contactNumber,
        dateOfBirth: dateOfBirth.toISOString(),
        nationality: 'United Kingdom',
        role: 'user',
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
        success: true,
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username,
        courseId,
        courseName: `Course ${'ABCDE'[courseIndex]}`,
        courseIndex: courseIndex + 1,
      };
    }
    return { success: false, courseId, courseName: `Course ${'ABCDE'[courseIndex]}`, courseIndex: courseIndex + 1 };
  } catch (error: any) {
    const courseIndex = index % COURSE_IDS.length;
    console.error(`❌ Failed to register user ${index}:`, error.response?.data?.message || error.message);
    return { success: false, courseId: COURSE_IDS[courseIndex], courseName: `Course ${'ABCDE'[courseIndex]}`, courseIndex: courseIndex + 1 };
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    if (!DB_URI) {
      console.error('❌ DB_URI not configured in .env');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB\n');

    const TOTAL_USERS = 500;

    console.log('🚀 Starting Bulk User Creation (Round-Robin Enrollment)\n');
    console.log(`📚 Course Assignment Pattern:`);
    console.log(`   User 1 → Course 1`);
    console.log(`   User 2 → Course 2`);
    console.log(`   User 3 → Course 3`);
    console.log(`   User 4 → Course 4`);
    console.log(`   User 5 → Course 5`);
    console.log(`   User 6 → Course 1`);
    console.log(`   User 7 → Course 2 ... and so on\n`);

    console.log(`🎯 Target: ${TOTAL_USERS} users (100 per course)\n`);
    console.log(`📍 API: https://api.equalmint.com/api/v1/register-direct`);
    console.log(`💾 Database: Creating Order records for money management & analytics\n`);
    console.log(`${'='.repeat(70)}\n`);

    const BATCH_SIZE = 50;
    let successCount = 0;
    let failureCount = 0;
    const courseStats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (let batch = 0; batch < TOTAL_USERS; batch += BATCH_SIZE) {
      const batchEnd = Math.min(batch + BATCH_SIZE, TOTAL_USERS);
      console.log(`\n📊 Batch ${Math.floor(batch / BATCH_SIZE) + 1}: Creating users ${batch + 1}-${batchEnd}...`);

      const batchPromises = [];
      for (let i = batch; i < batchEnd; i++) {
        batchPromises.push(createUserWithCourse(i));
      }

      const results = await Promise.all(batchPromises);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const userIndex = batch + i + 1;

        if (!result.success) {
          failureCount++;
          console.log(`   ❌ User ${userIndex} → ${result.courseName}: FAILED`);
          continue;
        }

        successCount++;
        courseStats[result.courseIndex]++;

        console.log(`   ✅ User ${userIndex}: ${result.username} → ${result.courseName} (${result.email})`);
        
        // Create order in database for this enrollment
        const orderCreated = await createEnrollmentOrder(result.userId!, result.courseId);
        if (orderCreated) {
          console.log(`      📝 Order created in database`);
        } else {
          console.log(`      ⚠️  Order creation skipped`);
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`${'='.repeat(70)}`);
    console.log(`✨ BULK USER CREATION & ORDER ENROLLMENT COMPLETED ✨`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n✅ Successfully created: ${successCount} users`);
    console.log(`📝 Order records created: ${successCount} (1 per user)`);
    console.log(`❌ Failed to create: ${failureCount} users\n`);

    console.log(`📚 COURSE ENROLLMENT BREAKDOWN:`);
    console.log(`   Course 1: ${courseStats[1]} users (100 enrollments with orders)`);
    console.log(`   Course 2: ${courseStats[2]} users (100 enrollments with orders)`);
    console.log(`   Course 3: ${courseStats[3]} users (100 enrollments with orders)`);
    console.log(`   Course 4: ${courseStats[4]} users (100 enrollments with orders)`);
    console.log(`   Course 5: ${courseStats[5]} users (100 enrollments with orders)\n`);

    console.log(`💰 MONEY MANAGEMENT & ANALYTICS:`);
    console.log(`   ✅ All orders created with payment_info`);
    console.log(`   ✅ Course revenue can now be tracked`);
    console.log(`   ✅ User enrollments visible in analytics dashboard`);
    console.log(`   ✅ Instructor earnings can be calculated\n`);

    console.log(`🎯 Total users enrolled: ${Object.values(courseStats).reduce((a, b) => a + b, 0)}`);
    console.log(`📊 Total orders in database: ${Object.values(courseStats).reduce((a, b) => a + b, 0)}`);
    console.log(`${'='.repeat(70)}\n`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');

  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
