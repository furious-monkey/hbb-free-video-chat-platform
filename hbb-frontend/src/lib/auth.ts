// frontend/src/lib/auth.ts
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface User {
  id: string;
  email: string;
  userRole: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  token: AuthTokens;
}

// ✅ Updated to handle redirect URLs
export const handleAuthSuccess = (authResponse: AuthResponse, router?: AppRouterInstance) => {
  try {
    // Store in localStorage for persistence
    const userStorage = {
      state: {
        user: {
          ...authResponse.user,
          token: authResponse.token
        }
      }
    };
    localStorage.setItem('user-storage', JSON.stringify(userStorage));

    // Set cookies (these should already be set by backend, but as fallback)
    setCookie('accessToken', authResponse.token.accessToken, {
      maxAge: 60 * 60, // 1 hour
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    setCookie('refreshToken', authResponse.token.refreshToken, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    setCookie('userRole', authResponse.user.userRole.toLowerCase(), {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('✅ Auth success - tokens and user data stored');
    
    // Check for redirect URL in query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    console.log('🔍 Checking for redirect URL:', redirectUrl);
    
    // If there's a valid redirect URL, use it
    if (redirectUrl && redirectUrl.startsWith('/')) {
      console.log('🔄 Redirecting to intended URL:', redirectUrl);
      
      // Use window.location.href to ensure query params are preserved
      window.location.href = redirectUrl;
      return;
    }
    
    // Otherwise, redirect to the user's dashboard
    const userRole = authResponse.user.userRole.toLowerCase();
    const dashboardUrl = `/dashboard/${userRole}/live`;
    
    if (router) {
      router.push(dashboardUrl);
    } else {
      // Fallback: force page reload to trigger middleware
      window.location.href = dashboardUrl;
    }
    
  } catch (error) {
    console.error('Error handling auth success:', error);
  }
};

// ✅ Helper to clear all authentication data
export const clearAuthData = () => {
  try {
    localStorage.removeItem('user-storage');
    localStorage.clear();
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('userRole');
    deleteCookie('csrftoken');
    console.log('✅ Auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// ✅ Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const accessToken = getCookie('accessToken');
  const userRole = getCookie('userRole');
  return !!(accessToken && userRole);
};

// ✅ Helper to get current user from storage
export const getCurrentUser = (): User | null => {
  try {
    const userStorageString = localStorage.getItem('user-storage');
    if (userStorageString) {
      const userStorage = JSON.parse(userStorageString);
      return userStorage?.state?.user || null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return null;
};

// ✅ Updated logout function with redirect support
export const logout = async (router?: AppRouterInstance, redirectTo?: string) => {
  try {
    const currentUser = getCurrentUser();
    
    if (currentUser?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    clearAuthData();
    
    // Build login URL with redirect if provided
    let loginUrl = '/login';
    if (redirectTo) {
      loginUrl = `/login?redirect=${encodeURIComponent(redirectTo)}`;
    }
    
    if (router) {
      router.push(loginUrl);
    } else {
      window.location.href = loginUrl;
    }
  }
};