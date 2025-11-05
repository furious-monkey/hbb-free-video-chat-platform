"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUserStore } from '@/src/store/userStore';

export default function AuthLayout({ children }) {
  const router = useRouter();
  const { isAuth, isToken, tryAuth } = useUserStore((state: any) => ({
    isAuth: state.isAuth,
    isToken: state.isToken,
    tryAuth: state.tryAuth,
  }));


  const authCheck = async () => {
    try {
      await tryAuth();

      if (isAuth) {
        toast.success('Authentication successful! 🎉');
        router.push('/auth/dashboard');
      }
    } catch (error: any) {
      toast.error(`Error in user authentication: ${error.message} ❌`);
      router.push('/auth/log-in');
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      if (isToken && !isAuth) {
        await authCheck();
      } else {
        if (isAuth) {
          toast.success('Вы успешно вошли под своим аккаунтом');
        } else {
          router.push('/auth/log-in');
        }
      }
    };

    handleAuth();
  }, [isAuth, isToken, tryAuth]);

  return children;
}