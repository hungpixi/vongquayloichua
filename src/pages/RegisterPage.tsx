import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { Church, Loader } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [parishName, setParishName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSlugUniqueness = async (val: string) => {
    if (!val || val.length < 3) return;
    setCheckingSlug(true);
    setSlugError(null);
    try {
      const isUnique = await dbService.checkParishSlugUnique(val);
      if (!isUnique) {
        setSlugError('Đường dẫn này đã được sử dụng bởi giáo xứ khác.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSlug(false);
    }
  };

  // Automatically generate clean slug from parish name
  const handleParishNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setParishName(val);

    // convert to unsign slug
    const clean = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setSlug(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSlugError(null);

    if (slug.length < 3) {
      setError('Đường dẫn Giáo xứ phải chứa ít nhất 3 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const isUnique = await dbService.checkParishSlugUnique(slug);
      if (!isUnique) {
        setError('Đường dẫn Giáo xứ đã tồn tại. Vui lòng chọn đường dẫn khác.');
        setLoading(false);
        return;
      }
      await signUp(email, password, parishName, slug);
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '460px',
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
          <h2 className="text-serif" style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: '800' }}>Đăng ký Tài khoản Giáo xứ</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Khởi tạo hệ thống vòng quay Lộc Chúa miễn phí 100%</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="parishName" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên Giáo xứ / Cộng đoàn</label>
            <input
              id="parishName"
              type="text"
              className="form-control"
              placeholder="Ví dụ: Giáo xứ Châu Sơn"
              value={parishName}
              onChange={handleParishNameChange}
              required
              style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Đường dẫn chia sẻ (Slug URL)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>/giao-xu/</span>
              <input
                id="slug"
                type="text"
                className="form-control"
                placeholder="giao-xu-chau-son"
                value={slug}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  setSlug(val);
                  setSlugError(null);
                }}
                onBlur={(e) => checkSlugUniqueness(e.target.value)}
                required
                style={{ height: '42px', border: slugError ? '1.5px solid var(--color-error)' : '1.5px solid rgba(15, 61, 46, 0.15)' }}
              />
            </div>
            {checkingSlug && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Đang kiểm tra...</span>}
            {slugError && <span style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>{slugError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Email quản trị viên</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="nhap@email.com"
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
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
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
            {loading ? <Loader className="animate-spin" size={18} /> : 'Đăng ký & Kích hoạt'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '16px' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'underline' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
