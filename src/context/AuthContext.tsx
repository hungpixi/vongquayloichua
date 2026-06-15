import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session, Subscription } from '@supabase/supabase-js';
import { dbService } from '../services/db';
import type { Parish, LocalUser } from '../services/db';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | LocalUser | null;
  parish: Parish | null; // Tương thích ngược với code cũ, trỏ đến currentParish
  parishes: Parish[];
  currentParish: Parish | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, parishName: string, slug: string) => Promise<void>;
  signInWithOtp: (email: string, shouldCreateUser?: boolean) => Promise<void>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'magiclink') => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentParish: (parish: Parish | null) => void;
  refreshParishes: () => Promise<void>;
  createParish: (name: string, slug: string) => Promise<Parish>;
  sendOtpToEmail: (
    email: string,
    redirectUrl?: string,
    shouldCreateUser?: boolean
  ) => Promise<{ success: boolean; error: string | null }>;
  verifyOtpCode: (
    email: string,
    token: string,
    type: 'signup' | 'magiclink'
  ) => Promise<{ success: boolean; session: Session | null; error: string | null }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; isMock?: boolean; resetLink?: string }>;
  updatePassword: (password: string, email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [currentParish, setCurrentParishState] = useState<Parish | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hàm cập nhật giáo xứ hiện tại và lưu vào LocalStorage
  const setCurrentParish = (selectedParish: Parish | null) => {
    setCurrentParishState(selectedParish);
    if (selectedParish) {
      localStorage.setItem('active_parish_id', selectedParish.id);
    } else {
      localStorage.removeItem('active_parish_id');
    }
  };

  const refreshParishes = async () => {
    if (user) {
      try {
        const list = await dbService.getParishesByOwner(user.id);
        setParishes(list);
        
        // Cập nhật lại currentParish nếu cần
        const savedId = localStorage.getItem('active_parish_id');
        if (savedId && list.some(p => p.id === savedId)) {
          const found = list.find(p => p.id === savedId) || null;
          setCurrentParishState(found);
        } else if (list.length > 0) {
          setCurrentParishState(list[0]);
        } else {
          setCurrentParishState(null);
        }
      } catch (err: unknown) {
        console.error('Error refreshing parishes:', err instanceof Error ? err.message : String(err));
      }
    } else {
      setParishes([]);
      setCurrentParishState(null);
    }
  };

  const createParish = async (name: string, slug: string): Promise<Parish> => {
    if (!user) {
      throw new Error('Bạn cần đăng nhập để tạo giáo xứ mới.');
    }
    setLoading(true);
    try {
      const newParish = await dbService.createParish(user.id, name, slug);
      // Tải lại danh sách giáo xứ
      const list = await dbService.getParishesByOwner(user.id);
      setParishes(list);
      // Đặt giáo xứ mới làm giáo xứ hiện tại
      setCurrentParish(newParish);
      return newParish;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authListener: Subscription | null = null;

    const fetchUserData = async () => {
      try {
        let currentUser: User | LocalUser | null = null;
        
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          currentUser = session?.user || null;
        } else {
          const activeUser = localStorage.getItem('local_active_user');
          currentUser = activeUser ? JSON.parse(activeUser) : null;
        }

        if (currentUser === null && supabase) {
          try {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (!error && data?.user) {
              currentUser = data.user;
            }
          } catch (anonErr) {
            console.error('Failed to sign in anonymously (falling back to local user):', anonErr);
          }
        }
        
        setUser(currentUser);
        
        if (currentUser) {
          const list = await dbService.getParishesByOwner(currentUser.id);
          if (!isMounted) return;
          setParishes(list);
          
          const savedId = localStorage.getItem('active_parish_id');
          if (savedId && list.some(p => p.id === savedId)) {
            const found = list.find(p => p.id === savedId) || null;
            setCurrentParishState(found);
          } else if (list.length > 0) {
            setCurrentParishState(list[0]);
          } else {
            setCurrentParishState(null);
          }
        } else {
          if (!isMounted) return;
          setParishes([]);
          setCurrentParishState(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching auth data:', err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const supabaseUser = session?.user || null;
          if (supabaseUser) {
            setUser(supabaseUser);
            try {
              const list = await dbService.getParishesByOwner(supabaseUser.id);
              if (isMounted) {
                setParishes(list);
                const savedId = localStorage.getItem('active_parish_id');
                if (savedId && list.some(p => p.id === savedId)) {
                  const found = list.find(p => p.id === savedId) || null;
                  setCurrentParishState(found);
                } else if (list.length > 0) {
                  setCurrentParishState(list[0]);
                } else {
                  setCurrentParishState(null);
                }
              }
            } catch (err: unknown) {
              console.error('Error fetching parishes on auth state change:', err instanceof Error ? err.message : String(err));
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setParishes([]);
          setCurrentParishState(null);
          localStorage.removeItem('active_parish_id');

          try {
            if (supabase) {
              const { data: anonData, error } = await supabase.auth.signInAnonymously();
              if (!error && anonData?.user && isMounted) {
                setUser(anonData.user);
              }
            }
          } catch (anonErr: unknown) {
            console.error('Failed to sign in anonymously after sign out:', anonErr instanceof Error ? anonErr.message : String(anonErr));
          }
        }
      });
      authListener = data?.subscription || null;
    }

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const loggedUser = await dbService.signIn(email, password);
      setUser(loggedUser || null);
      
      const list = await dbService.getParishesByOwner(loggedUser.id);
      setParishes(list);
      
      const savedId = localStorage.getItem('active_parish_id');
      if (savedId && list.some(p => p.id === savedId)) {
        const found = list.find(p => p.id === savedId) || null;
        setCurrentParishState(found);
      } else if (list.length > 0) {
        setCurrentParishState(list[0]);
      } else {
        setCurrentParishState(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, parishName: string, slug: string) => {
    setLoading(true);
    try {
      const registeredUser = await dbService.signUp(email, password, parishName, slug);
      setUser(registeredUser || null);
      
      const list = await dbService.getParishesByOwner(registeredUser.id);
      setParishes(list);
      
      // signUp tự tạo 1 parish, nên list chắc chắn có ít nhất 1 phần tử
      if (list.length > 0) {
        setCurrentParishState(list[0]);
        localStorage.setItem('active_parish_id', list[0].id);
      }
    } finally {
      setLoading(false);
    }
  };
  const signOut = async () => {
    setLoading(true);
    try {
      await dbService.signOut();
      setUser(null);
      setParishes([]);
      setCurrentParishState(null);
      localStorage.removeItem('active_parish_id');
    } finally {
      setLoading(false);
    }
  };

  const sendOtpToEmail = async (
    email: string,
    redirectUrl: string = window.location.origin + '/admin/auth/callback',
    shouldCreateUser: boolean = false
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!supabase) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: shouldCreateUser
        }
      });

      if (error) {
        console.error('Lỗi gửi OTP/Magic Link:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg || 'Unknown error occurred' };
    }
  };

  const verifyOtpCode = async (
    email: string,
    token: string,
    type: 'signup' | 'magiclink'
  ): Promise<{ success: boolean; session: Session | null; error: string | null }> => {
    if (!supabase) {
      try {
        const data = await dbService.verifyOtp(email, token, type);
        const loggedUser = data.user;
        setUser(loggedUser || null);
        if (loggedUser) {
          const list = await dbService.getParishesByOwner(loggedUser.id);
          setParishes(list);
          
          const savedId = localStorage.getItem('active_parish_id');
          if (savedId && list.some(p => p.id === savedId)) {
            const found = list.find(p => p.id === savedId) || null;
            setCurrentParishState(found);
          } else if (list.length > 0) {
            setCurrentParishState(list[0]);
          } else {
            setCurrentParishState(null);
          }
        }
        return { success: true, session: null, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, session: null, error: msg || 'Unknown error occurred' };
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type
      });

      if (error) {
        console.error('Lỗi xác thực OTP:', error.message);
        return { success: false, session: null, error: error.message };
      }

      if (data?.session?.user) {
        const loggedUser = data.session.user;
        setUser(loggedUser);
        
        const list = await dbService.getParishesByOwner(loggedUser.id);
        setParishes(list);
        
        const savedId = localStorage.getItem('active_parish_id');
        if (savedId && list.some(p => p.id === savedId)) {
          const found = list.find(p => p.id === savedId) || null;
          setCurrentParishState(found);
        } else if (list.length > 0) {
          setCurrentParishState(list[0]);
        } else {
          setCurrentParishState(null);
        }
      }

      return { success: true, session: data.session, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, session: null, error: msg || 'Unknown error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithOtp = async (email: string, shouldCreateUser: boolean = false): Promise<void> => {
    setLoading(true);
    try {
      if (!supabase) {
        await dbService.signInWithOtp(email, window.location.origin + '/admin/auth/callback', shouldCreateUser);
        return;
      }

      const res = await sendOtpToEmail(email, window.location.origin + '/admin/auth/callback', shouldCreateUser);
      if (!res.success) {
        throw new Error(res.error || 'Gửi mã OTP thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'magiclink'): Promise<void> => {
    setLoading(true);
    try {
      if (!supabase) {
        const data = await dbService.verifyOtp(email, token, type);
        const loggedUser = data.user;
        setUser(loggedUser || null);
        if (loggedUser) {
          const list = await dbService.getParishesByOwner(loggedUser.id);
          setParishes(list);
          
          const savedId = localStorage.getItem('active_parish_id');
          if (savedId && list.some(p => p.id === savedId)) {
            const found = list.find(p => p.id === savedId) || null;
            setCurrentParishState(found);
          } else if (list.length > 0) {
            setCurrentParishState(list[0]);
          } else {
            setCurrentParishState(null);
          }
        }
        return;
      }

      const res = await verifyOtpCode(email, token, type);
      if (!res.success) {
        throw new Error(res.error || 'Mã OTP không chính xác hoặc đã hết hạn');
      }
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      return await dbService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string, email?: string) => {
    setLoading(true);
    try {
      await dbService.updatePassword(password, email);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      parish: currentParish, // Tương thích ngược
      parishes, 
      currentParish, 
      loading, 
      signIn, 
      signUp, 
      signInWithOtp,
      verifyOtp,
      signOut, 
      setCurrentParish,
      refreshParishes,
      createParish,
      sendOtpToEmail,
      verifyOtpCode,
      forgotPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

