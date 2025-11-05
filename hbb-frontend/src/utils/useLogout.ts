import { useCallback, useState } from 'react';

// Helper function to delete a cookie by name
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      // Delete cookies
      deleteCookie('refreshToken');
      deleteCookie('accessToken');


      // Redirect to login page or homepage
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { logout, isLoading };
};

export default useLogout;
