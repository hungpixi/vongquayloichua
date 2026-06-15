import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Church, Loader, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      localStorage.setItem('remembered_email', email);
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err 
        ? String((err as Record<string, unknown>).message) 
        : typeof err === 'string'
        ? err
        : 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        border: '2.5px double var(--color-gold)',
        boxShadow: '0 16px 48px rgba(15, 61, 46, 0.08)',
        padding: '32px 28px',
        position: 'relative',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Corner Ornaments */}
        <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', top: '12px', left: '12px' }}></div>
        <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', top: '12px', right: '12px' }}></div>
        <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', bottom: '12px', left: '12px' }}></div>
        <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', bottom: '12px', right: '12px' }}></div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Church size={44} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-serif" style={{ fontSize: '26px', color: 'var(--color-primary)', fontWeight: '800' }}>
            Đăng nhập Quản trị
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Nhập email và mật khẩu của Cha để quản lý vòng quay
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.15)', 
            color: 'var(--color-error)', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label htmlFor="email" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Email tài khoản
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="cha-xu@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          {!supabase && (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--color-primary-soft)', 
              backgroundColor: 'rgba(15, 61, 46, 0.05)', 
              padding: '10px', 
              borderRadius: '8px', 
              textAlign: 'center', 
              border: '1px solid rgba(15, 61, 46, 0.1)' 
            }}>
              Chế độ chạy thử: Dùng tài khoản <strong>devadmin</strong> để đăng nhập.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-gold text-serif"
            style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '16px', marginTop: '8px' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}>
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
