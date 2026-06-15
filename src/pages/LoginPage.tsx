import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Church, Loader, ArrowLeft, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  // Progressive lock / rate limit states
  const [cooldown, setCooldown] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerifyOtp = React.useCallback(async (code: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setError(null);
    setShake(false);

    try {
      // Verify OTP with 'magiclink' first, then 'signup' if needed
      try {
        await verifyOtp(email, code, 'magiclink');
      } catch (err: unknown) {
        console.warn('Verify with magiclink failed, trying signup type...', err);
        await verifyOtp(email, code, 'signup');
      }

      // Remember email on success
      localStorage.setItem('remembered_email', email);
      
      // Clear rate limiting counter on successful login
      localStorage.removeItem(`otp_count_${email}`);
      localStorage.removeItem(`otp_lock_${email}`);
      
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Mã OTP không chính xác hoặc đã hết hạn.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, email, verifyOtp, navigate]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  // Progressive Lock Check Effect
  useEffect(() => {
    if (!email) return;
    const checkLock = () => {
      const lockUntil = parseInt(localStorage.getItem(`otp_lock_${email}`) || '0', 10);
      const now = Date.now();
      if (lockUntil && now < lockUntil) {
        setLockRemaining(Math.ceil((lockUntil - now) / 1000));
      } else {
        setLockRemaining(0);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [email]);

  // Auto-submit OTP
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6) {
      const timer = setTimeout(() => {
        handleVerifyOtp(code);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [otp, handleVerifyOtp]);

  // Rate Limiting Helpers
  const recordOtpRequest = (targetEmail: string) => {
    const count = parseInt(localStorage.getItem(`otp_count_${targetEmail}`) || '0', 10) + 1;
    localStorage.setItem(`otp_count_${targetEmail}`, count.toString());
    
    const now = Date.now();
    let cd = 60;
    
    if (count === 3) {
      cd = 180; // 3 minutes
    } else if (count >= 4) {
      cd = 15 * 60; // 15 minutes lock
      const lockTime = now + cd * 1000;
      localStorage.setItem(`otp_lock_${targetEmail}`, lockTime.toString());
      setLockRemaining(cd);
    }
    
    return { count, cooldown: cd };
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Double check progressive lock
    const lockUntil = parseInt(localStorage.getItem(`otp_lock_${email}`) || '0', 10);
    const now = Date.now();
    if (lockUntil && now < lockUntil) {
      const remainingMinutes = Math.ceil((lockUntil - now) / (60 * 1000));
      setError(`Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút hoặc liên hệ hỗ trợ kỹ thuật Zalo: 09xx.xxx.xxx`);
      return;
    }

    setLoading(true);
    try {
      await signInWithOtp(email, false);
      
      const { cooldown: nextCooldown } = recordOtpRequest(email);
      setCooldown(nextCooldown);
      setIsTimerActive(true);
      setIsOtpSent(true);
      
      // Reset OTP inputs
      setOtp(Array(6).fill(''));

      // Auto focus first OTP input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gửi mã OTP thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) return;

    const digit = cleaned[cleaned.length - 1];
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    for (let i = 0; i < 6; i++) {
      if (digits[i]) {
        newOtp[i] = digits[i];
      }
    }
    setOtp(newOtp);

    const focusIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Format countdown text helper
  const formatCooldownText = (seconds: number) => {
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes} phút ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .shake {
          animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both;
        }
        .otp-input:focus {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.1) !important;
        }
      `}</style>

      <div className={`card ${shake ? 'shake' : ''}`} style={{
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

        {!isOtpSent ? (
          <>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Church size={44} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-serif" style={{ fontSize: '26px', color: 'var(--color-primary)', fontWeight: '800' }}>
                Đăng nhập Quản trị
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Nhập email để nhận mã xác thực OTP đăng nhập nhanh
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  disabled={lockRemaining > 0}
                  style={{ height: '44px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              {lockRemaining > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau {formatCooldownText(lockRemaining)} hoặc liên hệ hỗ trợ kỹ thuật Zalo: 09xx.xxx.xxx
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-gold text-serif"
                style={{ width: '100%', height: '46px', fontSize: '14px', marginTop: '4px' }}
                disabled={loading || lockRemaining > 0}
              >
                {loading ? <Loader className="animate-spin" size={18} /> : 'Nhận mã OTP đăng nhập'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setIsOtpSent(false);
                setError(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <ShieldCheck size={44} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-serif" style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: '800' }}>
                Xác thực tài khoản
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '0 8px' }}>
                Chúng con đã gửi mã OTP 6 số đến email <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>. Mã có hiệu lực trong 5 phút.
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', width: '100%' }}>
              {!supabase && (
                <div style={{ fontSize: '13px', color: 'var(--color-primary-soft)', backgroundColor: 'rgba(15, 61, 46, 0.05)', padding: '10px 14px', borderRadius: '8px', textAlign: 'center', width: '100%', border: '1px solid rgba(15, 61, 46, 0.1)' }}>
                  Chế độ chạy thử: Nhập mã <strong>123456</strong> để kích hoạt.
                </div>
              )}
              {/* 6 OTP Inputs */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    disabled={isVerifying}
                    className="otp-input"
                    style={{
                      width: '46px',
                      height: '52px',
                      fontSize: '24px',
                      fontWeight: '800',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: error ? '2px solid var(--color-error)' : '1.5px solid rgba(15, 61, 46, 0.2)',
                      color: 'var(--color-primary)',
                      outline: 'none',
                      backgroundColor: error ? 'rgba(239, 68, 68, 0.02)' : '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(15, 61, 46, 0.03)',
                      transition: 'all 0.15s'
                    }}
                  />
                ))}
              </div>

              {isVerifying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-primary)' }}>
                  <Loader className="animate-spin" size={16} /> Đang xác thực...
                </div>
              )}

              {/* Resend Cooldown Section */}
              <div style={{ textAlign: 'center', width: '100%', fontSize: '13px' }}>
                {isTimerActive ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    Gửi lại mã xác thực sau:{' '}
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {formatCooldownText(cooldown)}
                    </strong>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendOtp()}
                    disabled={loading || isVerifying}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontWeight: '700',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Gửi lại mã OTP mới
                  </button>
                )}
              </div>
            </div>
          </>
        )}

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
