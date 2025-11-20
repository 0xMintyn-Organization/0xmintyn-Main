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

// Initialize auth state from localStorage on app start (before API call)
if (typeof window !== 'undefined') {
    const cachedUser = localStorage.getItem('user');
    const cachedToken = localStorage.getItem('accessToken');
    
    if (cachedUser && cachedToken) {
        try {
            const user = JSON.parse(cachedUser);
            // Set initial state from localStorage (optimistic)
            store.dispatch(userLoggedIn({
                accessToken: cachedToken,
                user: user
            }));
        } catch (error) {
            console.error('Error parsing cached user:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
        }
    }
}

// call the load User function on every page load to verify and refresh
const initializeApp = async () => {
    try {
        await store.dispatch(apiSlice.endpoints.loadUser.initiate(undefined, { 
            forceRefetch: false // Don't force refetch, use cache if available
        }));
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Only initialize if we're in the browser
if (typeof window !== 'undefined') {
    initializeApp();
}    