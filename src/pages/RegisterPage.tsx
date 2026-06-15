import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { Church, Loader, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp, signInWithOtp } = useAuth();
  const navigate = useNavigate();

  const [parishName, setParishName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Slug live validation states
  const [slugStatus, setSlugStatus] = useState<'valid' | 'duplicate' | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Automatically generate clean slug from parish name
  const handleParishNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setParishName(val);

    // convert to unsigned slug
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

  // Debounced Slug Uniqueness check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      Promise.resolve().then(() => {
        setSlugStatus(null);
        setSlugError(null);
      });
      return;
    }

    const handler = setTimeout(async () => {
      setCheckingSlug(true);
      setSlugError(null);
      setSlugStatus(null);
      try {
        const isUnique = await dbService.checkParishSlugUnique(slug);
        if (isUnique) {
          setSlugStatus('valid');
        } else {
          setSlugStatus('duplicate');
          setSlugError('Đường dẫn này đã có giáo xứ sử dụng. Đang gợi ý...');
          
          // Generate a suggested unique slug
          const originalSlug = slug;
          let counter = 1;
          let suggested = `${originalSlug}-${counter}`;
          let uniqueFound = false;
          while (!uniqueFound) {
            const check = await dbService.checkParishSlugUnique(suggested);
            if (check) {
              uniqueFound = true;
            } else {
              counter++;
              suggested = `${originalSlug}-${counter}`;
            }
          }
          // Update slug to suggested unique one
          setSlug(suggested);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [slug]);

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

      // Store registration data temporarily in LocalStorage for callback creation
      localStorage.setItem('pending_parish_name', parishName);
      localStorage.setItem('pending_parish_slug', slug);

      if (supabase) {
        // Online: Send passwordless signup OTP / Magic Link
        await signInWithOtp(email, true);
        setIsSubmitted(true);
      } else {
        // Offline: Just transition to simulated confirmation
        setIsSubmitted(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err 
        ? String((err as Record<string, unknown>).message) 
        : typeof err === 'string'
        ? err
        : 'Đăng ký tài khoản thất bại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Offline Activation Handler
  const handleOfflineActivate = async () => {
    setLoading(true);
    try {
      // Offline signUp will directly create user and parish in localStorage and sign in
      await signUp(email, '123456', parishName, slug);
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err 
        ? String((err as Record<string, unknown>).message) 
        : typeof err === 'string'
        ? err
        : 'Lỗi kích hoạt thử nghiệm.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Smart links for mail clients
  const getGmailUrl = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'googlegmail://' : 'intent://#Intent;scheme=googlegmail;package=com.google.android.gm;end';
    }
    return 'https://mail.google.com';
  };

  const getOutlookUrl = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ms-outlook://' : 'intent://#Intent;scheme=ms-outlook;package=com.microsoft.office.outlook;end';
    }
    return 'https://outlook.live.com';
  };

  if (isSubmitted) {
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
          padding: '40px 32px',
          position: 'relative',
          backgroundColor: '#FFFFFF',
          textAlign: 'center'
        }}>
          {/* Corner Ornaments */}
          <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', top: '12px', left: '12px' }}></div>
          <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', top: '12px', right: '12px' }}></div>
          <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', bottom: '12px', left: '12px' }}></div>
          <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '12px', height: '12px', bottom: '12px', right: '12px' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 61, 46, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              animation: 'pulse 2s infinite'
            }}>
              <Mail size={32} />
            </div>
            <h2 className="text-serif" style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: '800' }}>
              Kiểm tra hộp thư của Cha
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', lineHeight: '1.6' }}>
              Chúng con đã gửi một liên kết kích hoạt đến email <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              Cha vui lòng click vào liên kết trong email để kích hoạt quyền quản trị Giáo xứ của mình.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <a
              href={getGmailUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', textDecoration: 'none' }}
            >
              Mở ứng dụng Gmail
            </a>
            <a
              href={getOutlookUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', height: '44px', textDecoration: 'none' }}
            >
              Mở Outlook
            </a>

            {!supabase && (
              <button
                onClick={handleOfflineActivate}
                disabled={loading}
                className="btn btn-gold"
                style={{ width: '100%', height: '44px', marginTop: '12px' }}
              >
                {loading ? <Loader className="animate-spin" size={18} /> : 'Kích hoạt ngay (Offline Dev)'}
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '16px', marginTop: '8px' }}>
            <button
              onClick={() => setIsSubmitted(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Quay lại trang đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '480px',
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
            Đăng ký Tài khoản Giáo xứ
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Khởi tạo hệ thống vòng quay Lộc Chúa miễn phí 100%
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label htmlFor="parishName" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Tên Giáo xứ / Cộng đoàn
            </label>
            <input
              id="parishName"
              type="text"
              className="form-control"
              placeholder="Ví dụ: Giáo xứ Châu Sơn"
              value={parishName}
              onChange={handleParishNameChange}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Đường dẫn chia sẻ (Slug URL)
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'stretch', 
              borderRadius: '8px', 
              border: slugStatus === 'valid' 
                ? '1.5px solid var(--color-success)' 
                : slugStatus === 'duplicate' 
                ? '1.5px solid var(--color-warning)' 
                : '1.5px solid rgba(15, 61, 46, 0.15)', 
              overflow: 'hidden' 
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(15, 61, 46, 0.05)',
                padding: '0 12px',
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                fontWeight: '500',
                borderRight: '1.5px solid rgba(15, 61, 46, 0.15)',
                whiteSpace: 'nowrap'
              }}>
                vongquayloichua.com/giao-xu/
              </span>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input
                  id="slug"
                  type="text"
                  className="form-control"
                  placeholder="giao-xu-chau-son"
                  value={slug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setSlug(val);
                  }}
                  required
                  style={{
                    height: '42px',
                    border: 'none',
                    borderRadius: 0,
                    paddingRight: '36px',
                    backgroundColor: slugStatus === 'valid'
                      ? 'rgba(21, 154, 91, 0.02)'
                      : slugStatus === 'duplicate'
                      ? 'rgba(245, 158, 11, 0.02)'
                      : '#FFFFFF'
                  }}
                />
                <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center' }}>
                  {checkingSlug && <Loader className="animate-spin" size={16} style={{ color: 'var(--color-gold)' }} />}
                  {!checkingSlug && slugStatus === 'valid' && <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />}
                  {!checkingSlug && slugStatus === 'duplicate' && <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
                </div>
              </div>
            </div>
            {slugError && (
              <span style={{
                fontSize: '11px',
                color: slugStatus === 'duplicate' ? 'var(--color-warning)' : 'var(--color-error)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {slugError}
              </span>
            )}
            {slugStatus === 'valid' && (
              <span style={{
                fontSize: '11px',
                color: 'var(--color-success)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                Đường dẫn hợp lệ & sẵn sàng!
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Email quản trị viên
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="nhap@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-gold text-serif"
            style={{ width: '100%', height: '48px', marginTop: '12px', fontSize: '15px', letterSpacing: '0.5px' }}
            disabled={loading || checkingSlug}
          >
            {loading ? <Loader className="animate-spin" size={20} /> : 'Đăng ký & Kích hoạt miễn phí'}
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

export default RegisterPage;
