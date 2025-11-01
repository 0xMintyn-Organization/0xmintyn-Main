require('dotenv').config();

export const auth0Config = {
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'https://appbackend.0xmintyn.com/api/v1/auth/callback',
    audience: process.env.AUTH0_AUDIENCE || '',
    scope: 'openid profile email',
};

// Social provider configurations
export const socialProviders = {
    google: {
        name: 'Google',
        connection: 'google-oauth2',
    },
    github: {
        name: 'GitHub',
        connection: 'github',
    },
    twitter: {
        name: 'Twitter',
        connection: 'twitter',
    },
    discord: {
        name: 'Discord',
        connection: 'discord',
    },
    linkedin: {
        name: 'LinkedIn',
        connection: 'linkedin',
    },
};

export default auth0Config;


