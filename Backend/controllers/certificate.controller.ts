import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import OrderModel from "../models/order.model";
import UserModel from "../models/user.mode";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { createCanvas, loadImage, registerFont } from "canvas";
import https from "https";
import fs from "fs";
import path from "path";

// Generate certificate for completed course
export const generateCertificate = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check if user is enrolled and has completed the course
      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: 'completed'
      });

      if (!enrollment) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }

      // Get course details
      const course = await CourseModel.findById(courseId).populate("createdBy", "firstName lastName username");
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Get user details
      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if course is 100% completed
      const totalLectures = course.courseData
        .flatMap(section => section.videos)
        .length;

      const completedLectures = enrollment.completedLectures?.length || 0;
      const completionPercentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

      if (completionPercentage < 100) {
        return next(new ErrorHandler("Course must be 100% completed to generate certificate", 400));
      }

      // Generate certificate
      const certificateBuffer = await generateCertificateImage({
        studentName: `${user.firstName} ${user.lastName}`,
        courseName: course.name,
        instructorName: `${course.createdBy.firstName} ${course.createdBy.lastName}`,
        completionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        courseId: course._id.toString()
      });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="Equalmint-Certificate-${course.name.replace(/[^a-zA-Z0-9]/g, '-')}.png"`);
      res.setHeader('Content-Length', certificateBuffer.length);

      res.send(certificateBuffer);

    } catch (error: any) {
      console.error("Generate Certificate Error:", error);
      return next(new ErrorHandler("Failed to generate certificate", 500));
    }
  }
);

// Check certificate eligibility
export const checkCertificateEligibility = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // Check enrollment and completion
      const enrollment = await OrderModel.findOne({
        courseId: courseId,
        userId: userId,
        status: 'completed'
      });

      if (!enrollment) {
        return res.status(200).json({
          success: true,
          eligible: false,
          message: "You are not enrolled in this course"
        });
      }

      // Get course details
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Calculate completion percentage
      const totalLectures = course.courseData
        .flatMap(section => section.videos)
        .length;

      const completedLectures = enrollment.completedLectures?.length || 0;
      const completionPercentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

      res.status(200).json({
        success: true,
        eligible: completionPercentage >= 100,
        completionPercentage: Math.round(completionPercentage),
        totalLectures,
        completedLectures
      });

    } catch (error: any) {
      console.error("Check Certificate Eligibility Error:", error);
      return next(new ErrorHandler("Failed to check certificate eligibility", 500));
    }
  }
);

// Download Google Fonts function
async function downloadGoogleFont(fontName: string, fontWeight: string = '400'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`;
    
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        // Extract font URL from CSS
        const fontUrlMatch = data.match(/url\((https:\/\/[^)]+\.woff2?)\)/);
        if (fontUrlMatch) {
          https.get(fontUrlMatch[1], (fontResponse) => {
            const chunks: Buffer[] = [];
            fontResponse.on('data', (chunk) => chunks.push(chunk));
            fontResponse.on('end', () => resolve(Buffer.concat(chunks)));
            fontResponse.on('error', reject);
          });
        } else {
          reject(new Error('Font URL not found'));
        }
      });
    }).on('error', reject);
  });
}

// Generate modern certificate image with Google Fonts
async function generateCertificateImage(data: {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  courseId: string;
}): Promise<Buffer> {
  const canvas = createCanvas(1400, 1000);
  const ctx = canvas.getContext('2d');

  // Modern gradient background - matches your UI theme
  const gradient = ctx.createRadialGradient(700, 500, 0, 700, 500, 800);
  gradient.addColorStop(0, '#0f172a'); // Dark slate
  gradient.addColorStop(0.3, '#1e293b'); // Slate
  gradient.addColorStop(0.7, '#334155'); // Light slate
  gradient.addColorStop(1, '#1e293b'); // Back to slate
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1400, 1000);

  // Animated border with multiple layers
  const borderGradient = ctx.createLinearGradient(0, 0, 1400, 1000);
  borderGradient.addColorStop(0, '#3b82f6'); // Blue
  borderGradient.addColorStop(0.25, '#8b5cf6'); // Purple
  borderGradient.addColorStop(0.5, '#ec4899'); // Pink
  borderGradient.addColorStop(0.75, '#f59e0b'); // Amber
  borderGradient.addColorStop(1, '#10b981'); // Emerald

  // Outer border
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, 1360, 960);

  // Middle border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, 1320, 920);

  // Inner border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, 1280, 880);

  // Decorative corner elements with modern design
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 6;
  
  // Top-left corner - modern L shape
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.lineTo(60, 60);
  ctx.lineTo(120, 60);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(1340, 60);
  ctx.lineTo(1340, 120);
  ctx.lineTo(1280, 60);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(60, 940);
  ctx.lineTo(60, 880);
  ctx.lineTo(120, 940);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(1340, 940);
  ctx.lineTo(1340, 880);
  ctx.lineTo(1280, 940);
  ctx.stroke();

  // Add geometric patterns
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 1400;
    const y = Math.random() * 1000;
    const size = Math.random() * 4 + 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Equalmint Logo with modern typography
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 64px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Equalmint', 700, 180);

  // Add subtle glow effect
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 20;
  ctx.fillText('Equalmint', 700, 180);
  ctx.shadowBlur = 0;

  // Certificate title with elegant typography
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 48px "Playfair Display", "Times New Roman", serif';
  ctx.fillText('Certificate of Completion', 700, 280);

  // Decorative line with gradient
  const lineGradient = ctx.createLinearGradient(400, 320, 1000, 320);
  lineGradient.addColorStop(0, 'transparent');
  lineGradient.addColorStop(0.2, '#3b82f6');
  lineGradient.addColorStop(0.5, '#8b5cf6');
  lineGradient.addColorStop(0.8, '#3b82f6');
  lineGradient.addColorStop(1, 'transparent');
  
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(400, 320);
  ctx.lineTo(1000, 320);
  ctx.stroke();

  // "This certifies that" text
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '28px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('This certifies that', 700, 400);

  // Student name with emphasis
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 56px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(data.studentName, 700, 480);

  // "has successfully completed" text
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '28px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('has successfully completed the course', 700, 540);

  // Course name with special styling
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 40px "Playfair Display", "Times New Roman", serif';
  ctx.fillText(`"${data.courseName}"`, 700, 600);

  // Add a decorative element
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.beginPath();
  ctx.arc(700, 650, 30, 0, Math.PI * 2);
  ctx.fill();

  // Signature section with modern layout
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Instructor Signature:', 200, 750);
  ctx.textAlign = 'right';
  ctx.fillText('Date of Completion:', 1200, 750);

  // Instructor name
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 32px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.instructorName, 200, 800);

  // Completion date
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 32px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(data.completionDate, 1200, 800);

  // Signature lines
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 820);
  ctx.lineTo(500, 820);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(900, 820);
  ctx.lineTo(1200, 820);
  ctx.stroke();

  // Certificate ID with modern styling
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Certificate ID: ${data.courseId.slice(-12).toUpperCase()}`, 100, 950);

  // Equalmint footer with modern design
  ctx.textAlign = 'right';
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 20px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Powered by Equalmint', 1300, 950);

  // Add verification badge
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(1300, 100, 25, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓', 1300, 110);

  return canvas.toBuffer('image/png');
}
