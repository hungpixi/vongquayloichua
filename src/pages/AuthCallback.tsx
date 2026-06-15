import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { dbService } from '../services/db';
import { Church, Loader, CheckCircle2, XCircle } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error');
        setErrorMsg('Hệ thống Supabase chưa được cấu hình biến môi trường.');
        return;
      }

      try {
        // 1. Kiểm tra tham số PKCE Code trong URL query params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // Trao đổi mã code lấy Session thực sự (PKCE Flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('error');
            setErrorMsg(error.message);
            return;
          }
        }

        // 2. Kiểm tra nếu Session đã được tự động thiết lập (Implicit Flow qua Hash hoặc PKCE exchange thành công)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus('error');
          setErrorMsg(sessionError.message);
          return;
        }

        if (session) {
          // Create pending parish if exists in localStorage
          const pendingName = localStorage.getItem('pending_parish_name');
          const pendingSlug = localStorage.getItem('pending_parish_slug');
          if (pendingName && pendingSlug && session.user) {
            try {
              const list = await dbService.getParishesByOwner(session.user.id);
              if (list.length === 0) {
                await dbService.createParish(session.user.id, pendingName, pendingSlug);
              }
            } catch (err) {
              console.error('Error creating pending parish:', err);
            } finally {
              localStorage.removeItem('pending_parish_name');
              localStorage.removeItem('pending_parish_slug');
            }
          }

          setStatus('success');
          // Trì hoãn 1.5s tạo hiệu ứng chuyển tiếp mượt mà
          setTimeout(() => {
            navigate('/admin');
          }, 1500);
        } else {
          // Nếu không có session và không có code, có thể đây là một truy cập trực tiếp sai cách
          setStatus('error');
          setErrorMsg('Không tìm thấy phiên đăng nhập hợp lệ hoặc liên kết đã hết hạn.');
        }
      } catch (err: unknown) {
        console.error('Lỗi xảy ra trong quá trình callback xác thực:', err);
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra trong quá trình xác thực.';
        setErrorMsg(message);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--color-bg)', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Church size={48} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-serif" style={{ fontSize: '24px', color: 'var(--color-primary)', fontWeight: '800', margin: 0 }}>
            Vòng Quay Lời Chúa
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Cổng xác thực đăng nhập không mật khẩu
          </p>
        </div>

        <div style={{ 
          borderTop: '1px solid rgba(15, 61, 46, 0.08)', 
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {status === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Loader className="animate-spin" size={40} style={{ color: 'var(--color-gold)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-primary)', fontWeight: '700' }}>
                  Đang xác thực phiên đăng nhập...
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Xin vui lòng giữ kết nối và không đóng trình duyệt.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--color-success)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-success)', fontWeight: '700' }}>
                  Xác thực thành công!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Đang tự động chuyển hướng bạn đến trang Quản trị...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <XCircle size={44} style={{ color: 'var(--color-error)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-error)', fontWeight: '700' }}>
                  Đăng nhập thất bại
                </h3>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  color: 'var(--color-error)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  {errorMsg}
                </div>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-gold"
                style={{ width: '100%', height: '42px', marginTop: '8px' }}
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
