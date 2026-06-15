import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
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
  signOut: () => Promise<void>;
  setCurrentParish: (parish: Parish | null) => void;
  refreshParishes: () => Promise<void>;
  createParish: (name: string, slug: string) => Promise<Parish>;
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
      } catch (err) {
        console.error('Error refreshing parishes:', err);
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
    const fetchUserData = async () => {
      try {
        let currentUser = await dbService.getSessionUser();
        if (!isMounted) return;

        // Nếu không có người dùng đăng nhập, thực hiện đăng nhập ẩn danh bằng Supabase (nếu có sẵn)
        if (currentUser === null) {
          try {
            if (supabase) {
              const { data, error } = await supabase.auth.signInAnonymously();
              if (!error && data?.user) {
                currentUser = data.user;
              }
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
      } catch (err) {
        console.error('Error fetching auth data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const loggedUser = await dbService.signIn(email, password);
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
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, parishName: string, slug: string) => {
    setLoading(true);
    try {
      const registeredUser = await dbService.signUp(email, password, parishName, slug);
      setUser(registeredUser);
      
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      parish: currentParish, // Tương thích ngược
      parishes, 
      currentParish, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      setCurrentParish,
      refreshParishes,
      createParish
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

