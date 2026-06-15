import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Church, Share2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#081B15' }}>
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="container">
          <Link to="/" className="nav-logo">
            <Church className="logo-icon" style={{ color: 'var(--color-gold)' }} />
            <h1>Vòng Quay Lộc Chúa</h1>
          </Link>
          <nav className="nav-links">
            <a href="#about" className="nav-link">Giới thiệu</a>
            <a href="#features" className="nav-link">Tính năng</a>
            {user ? (
              <Link to="/admin" className="btn btn-gold" style={{ fontSize: '13px', padding: '6px 16px' }}>
                Trang Quản Trị
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Đăng nhập</Link>
                <Link to="/register" className="btn btn-gold" style={{ fontSize: '13px', padding: '6px 16px' }}>
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <Church size={64} style={{ color: 'var(--color-gold)', marginBottom: '20px' }} />
          <h2 className="text-serif" style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2' }}>
            Nền Tảng Vòng Quay Lộc Chúa<br />
            <span style={{ color: 'var(--color-gold)' }}>Số Hóa Phụng Vụ Giáo Xứ</span>
          </h2>
          <p style={{ fontSize: '17px', opacity: 0.9, maxWidth: '680px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            Giải pháp số hóa giúp lưu truyền Lộc Lời Chúa và Bảy Ơn Chúa Thánh Thần trong các dịp lễ Tết, Quan Thầy.
            Giảm thiểu rác thải giấy, lưu niệm thiêng liêng dưới dạng ảnh thiệp đẹp mắt, tích hợp app đức tin.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/admin" className="btn btn-gold" style={{ padding: '12px 28px', fontSize: '16px' }}>
                Quản lý Vòng quay Giáo xứ
              </Link>
            ) : (
              <Link to="/register" className="btn btn-gold" style={{ padding: '12px 28px', fontSize: '16px' }}>
                Bắt đầu tạo Vòng quay ngay
              </Link>
            )}
            <a href="#about" className="btn btn-outline" style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)', padding: '12px 28px', fontSize: '16px' }}>
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="feature-grid">
        <div className="container" style={{ gridColumn: 'span 3', textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: '800' }}>Tính Năng Vượt Trội</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>Xây dựng dựa trên trải nghiệm tôn trọng đức tin Công giáo.</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(216, 180, 63, 0.3)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(15, 61, 46, 0.08)', color: 'var(--color-primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Church size={26} />
          </div>
          <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Thương hiệu White-label</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            Mỗi giáo xứ sở hữu trang riêng dạng `/giao-xu/:slug`. Giao diện hoàn toàn không có bảng điều khiển kỹ thuật của admin, giữ sự tôn kính riêng biệt cho giáo dân.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(216, 180, 63, 0.3)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(216, 180, 63, 0.08)', color: 'var(--color-gold)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={26} />
          </div>
          <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Nạp Preset Nhanh Chóng</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            Nạp sẵn bộ 7 Ơn Chúa Thánh Thần hoặc 100 câu Lộc Lời Chúa ngày Tết được dịch và trích dẫn chuẩn xác chỉ với 1 lượt bấm chuột.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(216, 180, 63, 0.3)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)', transition: 'transform 0.2s' }}>
          <div style={{ background: 'rgba(15, 61, 46, 0.08)', color: 'var(--color-primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={26} />
          </div>
          <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Tải Thiệp Lộc PNG</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            Cho phép giáo dân kết xuất câu Lộc trúng thành dạng hình ảnh thiệp lụa nghệ thuật cực đẹp về điện thoại để làm hình nền hoặc chia sẻ Zalo/Facebook.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '80px 16px', background: 'var(--color-bg)', borderTop: '1px solid rgba(15, 61, 46, 0.08)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '20px', fontWeight: '800' }}>Đồng Hành Cùng Ứng Dụng "Giờ Cha Chờ"</h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-dark)', lineHeight: '1.7', marginBottom: '32px' }}>
            Nền tảng Vòng Quay Lộc Chúa là một sản phẩm phi thương mại, đồng bộ cùng hệ sinh thái ứng dụng <strong>Giờ Cha Chờ</strong>.
            Giờ Cha Chờ hỗ trợ giáo dân tìm nhà thờ gần nhất, tra cứu nhanh giờ thánh lễ, tòa giải tội trên thiết bị di động.
            Sử dụng công cụ này là bạn đang góp phần lan tỏa tiện ích đức tin hữu dụng đến cộng đoàn giáo dân Việt Nam.
          </p>
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', border: '1.5px double var(--color-gold)', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--color-primary)', borderRadius: '16px', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 'bold' }}>
              GCC
            </div>
            <div style={{ textAlign: 'left', flex: '1', minWidth: '200px' }}>
              <h4 style={{ color: 'var(--color-primary)', fontSize: '16px', fontWeight: '700' }}>Tải ứng dụng Giờ Cha Chờ</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>Hoàn toàn miễn phí - Hỗ trợ đời sống hiệp thông Công giáo mỗi ngày.</p>
            </div>
            <a href="https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative" target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ fontSize: '13px', padding: '10px 20px' }}>
              Tải cho Android
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#05100c', padding: '24px 16px', color: '#FFFFFF', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '12px', textAlign: 'center' }}>
        <div className="container">
          <p style={{ opacity: 0.6 }}>© 2026 Nền tảng Vòng Quay Lộc Chúa. Đồng bộ và phát triển bởi dự án Giờ Cha Chờ. Miễn phí 100%.</p>
        </div>
      </footer>
    </div>
  );
};
