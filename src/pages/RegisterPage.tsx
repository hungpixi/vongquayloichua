import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { supabase } from '../services/supabaseClient';
import { Church, Loader } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [parishName, setParishName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [pastorPhone, setPastorPhone] = useState('');
  const [pastorTitle, setPastorTitle] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [regType, setRegType] = useState<'parish' | 'group'>('parish');
  
  // Slug live validation states
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const [loading, setLoading] = useState(false);

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
      return;
    }

    const handler = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const isUnique = await dbService.checkParishSlugUnique(slug);
        if (!isUnique) {
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

    if (slug.length < 3) {
      setError('Đường dẫn Giáo xứ phải chứa ít nhất 3 ký tự.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (!pastorName.trim()) {
      setError(regType === 'parish' ? 'Vui lòng nhập Họ và tên Linh mục.' : 'Vui lòng nhập Họ và tên Người đại diện / Cá nhân.');
      return;
    }

    if (!pastorPhone.trim()) {
      setError('Vui lòng nhập Số điện thoại liên hệ.');
      return;
    }

    if (!pastorTitle.trim()) {
      setError(regType === 'parish' ? 'Vui lòng nhập Chức vụ tôn giáo.' : 'Vui lòng nhập Chức vụ / Vai trò.');
      return;
    }

    if (!invitationCode.trim()) {
      setError('Vui lòng nhập mã mời xác thực.');
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

      // Step A: Call backend to verify invitation code
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !supabase;
      if (isLocal) {
        if (invitationCode.trim() !== 'vqlc2026') {
          throw new Error('Mã mời cục bộ không chính xác (Mặc định: vqlc2026).');
        }
      } else if (supabase) {
        const verifyRes = await fetch('/api/verify-invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: invitationCode }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Mã mời không chính xác hoặc đã hết hạn.');
        }
      }

      // Store registration data temporarily in LocalStorage
      localStorage.setItem('pending_parish_name', parishName);
      localStorage.setItem('pending_parish_slug', slug);

      // Register using Email & Password (no OTP email confirmation required)
      await signUp(email, password, parishName, slug, pastorName, pastorPhone, pastorTitle);
      navigate('/admin');
      
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
            {regType === 'parish' ? 'Đăng ký Giáo xứ & Cha xứ' : 'Đăng ký Hội đoàn & Cá nhân'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Khởi tạo hệ thống vòng quay Lộc Chúa miễn phí 100%
          </p>
        </div>

        {/* Account Type Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(15, 61, 46, 0.03)',
          padding: '4px',
          borderRadius: '10px',
          border: '1.5px solid rgba(15, 61, 46, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setRegType('parish')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              backgroundColor: regType === 'parish' ? 'var(--color-primary)' : 'transparent',
              color: regType === 'parish' ? '#FFFFFF' : 'var(--color-text-muted)',
              boxShadow: regType === 'parish' ? '0 2px 6px rgba(15, 61, 46, 0.15)' : 'none'
            }}
          >
            Giáo xứ / Cha xứ
          </button>
          <button
            type="button"
            onClick={() => setRegType('group')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              backgroundColor: regType === 'group' ? 'var(--color-primary)' : 'transparent',
              color: regType === 'group' ? '#FFFFFF' : 'var(--color-text-muted)',
              boxShadow: regType === 'group' ? '0 2px 6px rgba(15, 61, 46, 0.15)' : 'none'
            }}
          >
            Hội đoàn & Cá nhân
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label htmlFor="parishName" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              {regType === 'parish' ? 'Tên Giáo xứ / Cộng đoàn' : 'Tên Hội đoàn / Nhóm / Tổ chức / Cá nhân'}
            </label>
            <input
              id="parishName"
              type="text"
              className="form-control"
              placeholder={regType === 'parish' ? 'Ví dụ: Giáo xứ Châu Sơn' : 'Ví dụ: Ca đoàn Cecilia, TNTT X, Cá nhân Giuse A...'}
              value={parishName}
              onChange={handleParishNameChange}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group" style={{ display: 'none' }}>
            <label htmlFor="slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Đường dẫn chia sẻ (Slug URL)
            </label>
            <input
              id="slug"
              type="hidden"
              value={slug}
            />
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

          <div className="form-group">
            <label htmlFor="password" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Mật khẩu truy cập
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Nhập ít nhất 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pastorName" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              {regType === 'parish' ? 'Họ và tên Linh mục' : 'Họ và tên Người đại diện / Cá nhân'}
            </label>
            <input
              id="pastorName"
              type="text"
              className="form-control"
              placeholder={regType === 'parish' ? 'Ví dụ: Lm. Giuse Nguyễn Văn A' : 'Ví dụ: Nguyễn Văn A'}
              value={pastorName}
              onChange={(e) => setPastorName(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pastorPhone" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Số điện thoại liên hệ
            </label>
            <input
              id="pastorPhone"
              type="tel"
              className="form-control"
              placeholder="Ví dụ: 0912345678"
              value={pastorPhone}
              onChange={(e) => setPastorPhone(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pastorTitle" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              {regType === 'parish' ? 'Chức vụ tôn giáo' : 'Chức danh / Vai trò'}
            </label>
            <input
              id="pastorTitle"
              type="text"
              className="form-control"
              placeholder={regType === 'parish' ? 'Ví dụ: Linh mục Quản xứ' : 'Ví dụ: Ca trưởng, Trưởng ban, Cá nhân...'}
              value={pastorTitle}
              onChange={(e) => setPastorTitle(e.target.value)}
              required
              style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="invitationCode" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
              Mã mời xác thực
            </label>
            <input
              id="invitationCode"
              type="text"
              className="form-control"
              placeholder="Nhập mã mời của Giáo phận (Ví dụ: vqlc2026)"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.trim())}
              required
              style={{
                height: '44px',
                border: '1.5px solid rgba(15, 61, 46, 0.18)',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--color-primary)',
                backgroundColor: 'rgba(216, 180, 63, 0.02)',
                letterSpacing: '1px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
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
