import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Church, Loader } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        border: '2.5px double var(--color-gold)',
        boxShadow: '0 16px 48px rgba(15, 61, 46, 0.08)',
        padding: '32px 24px',
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
          <h2 className="text-serif" style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: '800' }}>Đăng nhập Quản trị</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Cấu hình vòng quay riêng cho Giáo xứ của bạn</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="email" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Email tài khoản</label>
            <input
              id="email"
              type="text"
              className="form-control"
              placeholder="nhap@email.com hoặc tên đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-gold"
            style={{ width: '100%', height: '44px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '16px' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}>
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    </div>
  );
};
