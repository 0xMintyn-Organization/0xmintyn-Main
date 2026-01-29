import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandler';

/**
 * Basic Auth for the secret direct-registration API.
 * Expects env: DIRECT_REGISTER_AUTH_USER, DIRECT_REGISTER_AUTH_PASSWORD
 * Client sends: Authorization: Basic base64(username:password)
 */
export const basicAuthDirectRegister = (req: Request, _res: Response, next: NextFunction) => {
    const expectedUser = process.env.DIRECT_REGISTER_AUTH_USER;
    const expectedPassword = process.env.DIRECT_REGISTER_AUTH_PASSWORD;

    if (!expectedUser || !expectedPassword) {
        return next(new ErrorHandler('Direct register API is not configured (missing auth env)', 503));
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return next(new ErrorHandler('Missing or invalid Authorization header (Basic auth required)', 401));
    }

    try {
        const base64Credentials = authHeader.slice(6);
        const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [username, password] = decoded.split(':');
        if (!username || !password) {
            return next(new ErrorHandler('Invalid Basic auth credentials', 401));
        }
        if (username !== expectedUser || password !== expectedPassword) {
            return next(new ErrorHandler('Invalid credentials', 401));
        }
        next();
    } catch {
        return next(new ErrorHandler('Invalid Authorization header', 401));
    }
};
