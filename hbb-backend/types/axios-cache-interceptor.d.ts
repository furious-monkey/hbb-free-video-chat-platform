import 'axios';
import { CacheAxiosResponse } from 'axios-cache-interceptor';

declare module 'axios' {
  // Extend AxiosResponse to include the cached properties
  export interface AxiosResponse<T = any, D = any> extends CacheAxiosResponse<T, D> {}

  // Extend AxiosInstance to be compatible with AxiosCacheInstance
  export interface AxiosInstance {
    interceptors: {
      request: {
        use: (
          onFulfilled?: (
            value: any
          ) => any | Promise<any>,
          onRejected?: (error: any) => any
        ) => any;
      };
      response: {
        use: (
          onFulfilled?: (
            value: CacheAxiosResponse<any, any>
          ) => CacheAxiosResponse<any, any> | Promise<CacheAxiosResponse<any, any>>,
          onRejected?: (error: any) => any
        ) => any;
      };
    };
  }
}
