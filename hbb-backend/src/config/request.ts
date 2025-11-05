import Axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosInstance,
} from 'axios';
import { logger } from './logger';
import { jsonStringify } from '../utils/object.util';
import axiosRetry, {
  type IAxiosRetryConfig,
  exponentialDelay,
  isNetworkOrIdempotentRequestError,
} from 'axios-retry';
import {
  setupCache,
  type AxiosCacheInstance,
  type InternalCacheRequestConfig,
} from 'axios-cache-interceptor';

// Create an AxiosCacheInstance
const cacheAxiosInstance = setupCache(Axios.create()) as AxiosCacheInstance;

// Create a type-compatible Axios instance for axios-retry
const axiosInstanceForRetry = cacheAxiosInstance as unknown as AxiosInstance;

// Configure retry with the compatible Axios instance
axiosRetry(axiosInstanceForRetry, {
  retries: 10,
  retryDelay: exponentialDelay,
  retryCondition: (err: AxiosError) =>
    isNetworkOrIdempotentRequestError(err) || err.response?.status === 429,
});

// Request interceptor to log outgoing requests
cacheAxiosInstance.interceptors.request.use(
  (requestConfig: InternalCacheRequestConfig<unknown, unknown>) => {
    const url = cacheAxiosInstance.getUri(requestConfig);
    logger.debug(
      `${requestConfig.method?.toUpperCase() ?? ''} ${url}${
        requestConfig.data
          ? ` | Data: ${jsonStringify(requestConfig.data)}`
          : ''
      }`,
    );
    return requestConfig;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor to log responses and handle errors
cacheAxiosInstance.interceptors.response.use(
  (response) => {
    logger.debug(
      `${response.status} ${response.statusText} ${
        response.config.method?.toUpperCase() ?? 'HTTP'
      } ${response.config.url ?? 'Unknown URL'} - ${
        response.config.cache ? 'Cache hit' : 'Cache miss'
      }`,
    );
    return response;
  },
  async (error) => {
    if (Axios.isAxiosError(error)) {
      logger.error(
        `${error.name}: ${error.message}, (${
          error.config?.method?.toUpperCase() ?? 'HTTP'
        } ${error.config?.url ?? 'Unknown URL'})`,
      );
    } else {
      logger.error(error);
    }

    return await Promise.reject(error);
  },
);

// Utility to extract Axios request configuration
const extractConfig = (config?: AxiosRequestConfig): AxiosRequestConfig => {
  const baseHeaders = {
    'Accept-Encoding': 'gzip,deflate,compress',
  };

  return {
    ...config,
    headers: { ...baseHeaders, ...config?.headers },
  };
};

// Exported HTTP GET method
export const get = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  return await cacheAxiosInstance.get<T>(url, extractConfig(config));
};

// Exported HTTP POST method
export const post = async <T>(
  url: string,
  data: object,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  return await cacheAxiosInstance.post<T>(url, data, extractConfig(config));
};
