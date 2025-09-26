import { Document } from 'mongoose';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        role: 'user' | 'instructor' | 'seller' | 'admin';
        email: string;
        name: string;
        [key: string]: any;
      };
    }
  }
}

export {};
