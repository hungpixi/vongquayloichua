import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Church, Loader, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mockLink, setMockLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMockLink(null);
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSuccess('Yêu cầu đặt lại mật khẩu đã được gửi đi! Vui lòng kiểm tra hộp thư email của Cha.');
      
      if (res && res.isMock && res.resetLink) {
        setMockLink(res.resetLink);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Yêu cầu thất bại. Vui lòng kiểm tra lại email.';
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
            Quên mật khẩu
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Nhập email tài khoản của Cha để nhận liên kết đặt lại mật khẩu
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

        {success && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.15)', 
            color: 'var(--color-success)', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
              <span>{success}</span>
            </div>
            
            {mockLink && (
              <div style={{ marginTop: '12px', padding: '8px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', width: '100%' }}>
                <span style={{ color: '#0369a1', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>[Offline Dev Mode] Link đặt lại mật khẩu:</span>
                <Link to={mockLink} style={{ color: 'var(--color-primary)', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: '700' }}>
                  Click vào đây để đặt lại mật khẩu
                </Link>
              </div>
            )}
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

          <button
            type="submit"
            className="btn btn-primary btn-gold text-serif"
            style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Gửi liên kết đặt lại'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '16px', marginTop: '8px' }}>
          Quay lại trang{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
