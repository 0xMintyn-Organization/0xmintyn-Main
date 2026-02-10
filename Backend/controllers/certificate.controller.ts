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

  // Premium white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1400, 1000);

  // Sophisticated mint geometric background pattern
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  
  // Create hexagonal pattern
  for (let y = -50; y < 1050; y += 60) {
    for (let x = -50; x < 1450; x += 52) {
      const offsetX = (y / 60) % 2 === 0 ? 0 : 26;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + offsetX + Math.cos(angle) * 20;
        const hy = y + Math.sin(angle) * 20;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Stunning mint gradient overlay - left side
  const leftGradient = ctx.createLinearGradient(0, 0, 500, 1000);
  leftGradient.addColorStop(0, 'rgba(5, 150, 105, 0.08)');
  leftGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.04)');
  leftGradient.addColorStop(1, 'rgba(5, 150, 105, 0.02)');
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, 500, 1000);

  // Right side gradient
  const rightGradient = ctx.createLinearGradient(900, 0, 1400, 1000);
  rightGradient.addColorStop(0, 'rgba(16, 185, 129, 0.02)');
  rightGradient.addColorStop(0.5, 'rgba(5, 150, 105, 0.04)');
  rightGradient.addColorStop(1, 'rgba(5, 150, 105, 0.08)');
  ctx.fillStyle = rightGradient;
  ctx.fillRect(900, 0, 500, 1000);

  // Ultra-premium border system with shadows
  ctx.shadowColor = 'rgba(5, 150, 105, 0.15)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Outer golden ratio border
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, 1320, 920);
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Elegant inner border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 1280, 880);

  // Decorative mint accent border
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.strokeRect(70, 70, 1260, 860);
  ctx.setLineDash([]);

  // Luxurious corner designs with Art Deco influence
  const drawPremiumCorner = (x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Outer arc
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI / 2);
    ctx.stroke();

    // Middle arc
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI / 2);
    ctx.stroke();

    // Inner accent
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI / 2);
    ctx.stroke();

    // Decorative lines
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(55, 0);
    ctx.lineTo(80, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 55);
    ctx.lineTo(0, 80);
    ctx.stroke();

    // Mint diamonds
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(90, 0);
    ctx.lineTo(95, -5);
    ctx.lineTo(100, 0);
    ctx.lineTo(95, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(-5, 95);
    ctx.lineTo(0, 100);
    ctx.lineTo(5, 95);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  drawPremiumCorner(60, 60, 0);
  drawPremiumCorner(1340, 60, Math.PI / 2);
  drawPremiumCorner(1340, 940, Math.PI);
  drawPremiumCorner(60, 940, (Math.PI * 3) / 2);

  // Premium header with mint accent bar
  ctx.fillStyle = '#059669';
  ctx.fillRect(120, 140, 8, 80);
  
  ctx.fillStyle = '#10b981';
  ctx.fillRect(135, 140, 3, 80);

  // Equalmint branding - sophisticated
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 64px "Helvetica Neue", "Arial", sans-serif';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '2px';
  ctx.fillText('EQUALMINT', 160, 190);

  ctx.fillStyle = '#10b981';
  ctx.font = '16px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('LEARNING PLATFORM', 160, 215);

  // Verification badge - top right
  ctx.save();
  ctx.translate(1240, 160);
  
  // Outer circle with gradient
  const badgeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
  badgeGradient.addColorStop(0, '#10b981');
  badgeGradient.addColorStop(1, '#059669');
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fill();

  // Inner white circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 45, 0, Math.PI * 2);
  ctx.fill();

  // Mint inner circle
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-5, 12);
  ctx.lineTo(18, -15);
  ctx.stroke();

  // Badge text
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 11px "Helvetica Neue", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('VERIFIED', 0, 75);
  
  ctx.restore();

  // Main title - museum quality
  ctx.textAlign = 'center';
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 72px "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('CERTIFICATE', 700, 340);

  ctx.font = '42px "Playfair Display", "Georgia", serif';
  ctx.fillStyle = '#047857';
  ctx.letterSpacing = '12px';
  ctx.fillText('OF COMPLETION', 700, 390);

  // Elegant divider with center ornament
  const dividerY = 425;
  
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, dividerY);
  ctx.lineTo(665, dividerY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(735, dividerY);
  ctx.lineTo(1100, dividerY);
  ctx.stroke();

  // Center ornament
  ctx.fillStyle = '#10b981';
  ctx.save();
  ctx.translate(700, dividerY);
  
  // Diamond
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();

  // Small circles
  ctx.beginPath();
  ctx.arc(680, dividerY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(720, dividerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // "This certifies that"
  ctx.fillStyle = '#059669';
  ctx.font = '24px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('THIS CERTIFIES THAT', 700, 490);

  // Student name - hero element
  ctx.shadowColor = 'rgba(5, 150, 105, 0.2)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 68px "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(data.studentName, 700, 570);
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Elegant underline for name
  const nameWidth = ctx.measureText(data.studentName).width;
  const underlineGradient = ctx.createLinearGradient(
    700 - nameWidth / 2 - 40,
    590,
    700 + nameWidth / 2 + 40,
    590
  );
  underlineGradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
  underlineGradient.addColorStop(0.2, 'rgba(16, 185, 129, 0.6)');
  underlineGradient.addColorStop(0.5, 'rgba(5, 150, 105, 1)');
  underlineGradient.addColorStop(0.8, 'rgba(16, 185, 129, 0.6)');
  underlineGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
  
  ctx.strokeStyle = underlineGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(700 - nameWidth / 2 - 40, 590);
  ctx.lineTo(700 + nameWidth / 2 + 40, 590);
  ctx.stroke();

  // Completion text
  ctx.fillStyle = '#059669';
  ctx.font = '24px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('HAS SUCCESSFULLY COMPLETED', 700, 640);

  // Course name - featured
  ctx.fillStyle = '#065f46';
  ctx.font = 'italic 46px "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(`"${data.courseName}"`, 700, 710);

  // Achievement ribbon visual
  ctx.fillStyle = '#10b981';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(550, 740);
  ctx.lineTo(570, 760);
  ctx.lineTo(550, 780);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(850, 740);
  ctx.lineTo(830, 760);
  ctx.lineTo(850, 780);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Date with icon
  ctx.fillStyle = '#047857';
  ctx.font = '22px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('AWARDED ON ' + data.completionDate.toUpperCase(), 700, 780);

  // Signature section - luxury layout
  const sigY = 870;
  
  // Left: Instructor signature
  ctx.textAlign = 'center';
  ctx.fillStyle = '#047857';
  ctx.font = 'italic 38px "Playfair Display", "Georgia", serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(data.instructorName, 350, sigY);
  
  // Signature line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, sigY + 20);
  ctx.lineTo(480, sigY + 20);
  ctx.stroke();
  
  ctx.fillStyle = '#059669';
  ctx.font = '16px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('COURSE INSTRUCTOR', 350, sigY + 48);

  // Center: Mint seal
  ctx.save();
  ctx.translate(700, sigY - 15);
  
  // Seal outer ring
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner ring
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  // Star shape
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * 25;
    const y = Math.sin(angle) * 25;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 12px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.textAlign = 'center';
  ctx.fillText('EQUALMINT', 0, 70);
  
  ctx.restore();

  // Right: Date stamp
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 32px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(data.completionDate, 1050, sigY);
  
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(920, sigY + 20);
  ctx.lineTo(1180, sigY + 20);
  ctx.stroke();
  
  ctx.fillStyle = '#059669';
  ctx.font = '16px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DATE OF COMPLETION', 1050, sigY + 48);

  // Footer - ultra clean
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fillRect(80, 955, 1240, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#10b981';
  ctx.font = '14px "Helvetica Neue", "Arial", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(`CERTIFICATE ID: ${data.courseId.slice(-12).toUpperCase()}`, 80, 980);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px "Helvetica Neue", "Arial", sans-serif';
  ctx.fillText('EQUALMINT.COM/VERIFY', 1320, 980);

  return canvas.toBuffer('image/png');
}