import express from "express";
import { generateCertificate, checkCertificateEligibility } from "../controllers/certificate.controller";
import { isAthenticated } from "../utils/auth";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";

const router = express.Router();

// Certificate routes
router.get("/generate/:courseId", updateAccessTokenMiddleware, isAthenticated, generateCertificate);
router.get("/eligibility/:courseId", updateAccessTokenMiddleware, isAthenticated, checkCertificateEligibility);

export default router;
