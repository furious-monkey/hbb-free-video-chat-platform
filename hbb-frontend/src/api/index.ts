// frontend/src/api/index.ts
import axios from "axios";
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { QueryClient } from "@tanstack/react-query";

export const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;
axios.defaults.withCredentials = true;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    
    failedQueue = [];
};

export const api = axios.create({
    baseURL: API_URL,
    timeout: 25000,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    let accessToken = getCookie('accessToken');
    const csrfToken = getCookie('csrftoken');

    console.log("AccessToken from cookie:", accessToken);

    // Fallback to localStorage if no access token in cookies
    if (!accessToken) {
        console.log("AccessToken not found in cookies. Checking local storage...");
        try {
            const userStorageString = localStorage.getItem('user-storage');
            if (userStorageString) {
                const userStorage = JSON.parse(userStorageString);
                
                if (userStorage?.state?.user?.token?.accessToken) {
                    accessToken = userStorage.state.user.token.accessToken;
                    const refreshToken = userStorage.state.user.token.refreshToken;

                    console.log("Setting cookies from local storage state...");
                    setCookie('accessToken', accessToken);
                    if (refreshToken) {
                        setCookie('refreshToken', refreshToken);
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing localStorage:", error);
        }
    }

    if (accessToken) {
        config.headers.Authorization = `JWT ${accessToken}`;
    }
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
}, (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
    
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `JWT ${token}`;
                    return api.request(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            console.log("401 error encountered. Attempting to refresh token...");
            
            try {
                // ✅ Use cookies since backend now sets them
                const refreshResponse = await axios.post(`${API_URL}auth/refresh-token`, {}, {
                    withCredentials: true, // This sends cookies automatically
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken') || ''
                    }
                });

                const newAccessToken = refreshResponse.data?.data?.accessToken;

                if (!newAccessToken) {
                    throw new Error("Invalid token refresh response - no access token");
                }

                // ✅ Cookies are now set by the backend automatically
                // No need to manually set them here

                // Update localStorage if it exists (for backward compatibility)
                try {
                    const userStorageString = localStorage.getItem('user-storage');
                    if (userStorageString) {
                        const userStorage = JSON.parse(userStorageString);
                        if (userStorage?.state?.user?.token) {
                            userStorage.state.user.token.accessToken = newAccessToken;
                            if (refreshResponse.data?.data?.refreshToken) {
                                userStorage.state.user.token.refreshToken = refreshResponse.data.data.refreshToken;
                            }
                            localStorage.setItem('user-storage', JSON.stringify(userStorage));
                        }
                    }
                } catch (storageError) {
                    console.warn("Could not update localStorage:", storageError);
                }

                // Process queued requests
                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Retry original request with new token
                originalRequest.headers.Authorization = `JWT ${newAccessToken}`;
                return api.request(originalRequest);

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                isRefreshing = false;
                clearAndRedirect();
                return Promise.reject(refreshError);
            }
        }
    
        return Promise.reject(error);
    }
);

const clearAndRedirect = () => {
    try {
        console.log("Clearing localStorage and cookies...");
        localStorage.clear();
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        deleteCookie('userRole');
        deleteCookie('csrftoken');
        console.log("Redirecting to '/'...");
        window.location.href = '/';
    } catch (clearError) {
        console.error("Error during clear and redirect:", clearError);
    }
};

const queryClient = new QueryClient();
export { queryClient };