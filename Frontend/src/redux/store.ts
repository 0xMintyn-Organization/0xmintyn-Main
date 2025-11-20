"use client"
import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './features/api/apiSlice'
import authSlice, { userLoggedIn } from './features/auth/authSlice'
import walletSlice from './features/wallet/walletSlice'

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authSlice,
        wallet: walletSlice
    },
    devTools: false,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware)

})

// Initialize auth state from localStorage on app start (synchronously, before any components render)
// This must happen immediately when the store is created
if (typeof window !== 'undefined') {
    try {
        const cachedUser = localStorage.getItem('user');
        const cachedToken = localStorage.getItem('accessToken');
        
        // If we have user data, restore state even if token is missing (token might be in httpOnly cookie)
        // The API call will verify and refresh the token
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser);
                // Set initial state from localStorage (optimistic) - this happens synchronously
                // Use empty string for token if not found - it might be in httpOnly cookie
                store.dispatch(userLoggedIn({
                    accessToken: cachedToken || '',
                    user: user
                }));
            } catch (error) {
                console.error('Error parsing cached user:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
            }
        }
    } catch (error) {
        console.error('Error initializing auth from localStorage:', error);
    }
}

// call the load User function on every page load to verify and refresh
// This happens asynchronously after the store is created
const initializeApp = async () => {
    try {
        // Small delay to ensure store is ready
        await new Promise(resolve => setTimeout(resolve, 50));
        await store.dispatch(apiSlice.endpoints.loadUser.initiate(undefined, { 
            forceRefetch: false // Don't force refetch, use cache if available
        }));
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Only initialize if we're in the browser
if (typeof window !== 'undefined') {
    // Run initialization asynchronously to not block store creation
    initializeApp();
}    