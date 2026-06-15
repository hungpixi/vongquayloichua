import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Church, Share2, ChevronDown, ChevronUp, Download, 
  ArrowRight, Smartphone, CheckCircle2, Layers, Settings, 
  Quote, Eye, X 
} from 'lucide-react';

const FAQ_DATA = [
  {
    question: "Nền tảng 'Vòng Quay Lộc Chúa' có thu phí hay chèn quảng cáo thương mại không?",
    answer: "Hoàn toàn MIỄN PHÍ 100% và KHÔNG chèn quảng cáo thương mại. Đây là dự án phụng sự phi thương mại được đồng bộ phát triển bởi hệ sinh thái đức tin 'Giờ Cha Chờ' (GCC), nhằm số hóa và nâng cao trải nghiệm phụng vụ cho cộng đoàn Dân Chúa mà không tạo ra bất kỳ gánh nặng tài chính hay sự phiền toái kỹ thuật nào cho Giáo xứ."
  },
  {
    question: "Nguồn Lời Chúa và các Preset Lộc được biên soạn từ đâu?",
    answer: "Các câu Lời Chúa (Kinh Thánh Cựu Ước & Tân Ước) và Bảy Ơn Chúa Thánh Thần đều được trích dẫn chuẩn xác từ các bản dịch Công giáo chính thống. Ban mục vụ kỹ thuật rà soát kỹ lưỡng từng ký tự để đảm bảo đúng đắn về mặt thần học và tôn nghiêm phụng vụ trước khi đưa vào hệ thống Preset nạp nhanh."
  },
  {
    question: "Tính năng 'Thương hiệu White-label' hoạt động như thế nào?",
    answer: "Khi Giáo xứ tạo vòng quay, hệ thống sẽ cấp một đường dẫn riêng biệt dạng '/giao-xu/:slug' (ví dụ: vongquaylocchua.com/giao-xu/ten-giao-xu). Trang này hoàn toàn ẩn đi các nút điều khiển kỹ thuật của admin hay các thông tin thừa, chỉ hiển thị tên Giáo xứ, hình thánh bổn mạng, vòng quay và phần thiệp lộc lộng lẫy nhất để giữ trọn vẹn sự tôn nghiêm cho giáo dân."
  },
  {
    question: "Làm thế nào để lưu lại bức thiệp Lộc Chúa sau khi quay trúng?",
    answer: "Sau khi vòng quay dừng lại và hiển thị câu Lộc Chúa, giáo dân chỉ cần nhấn nút 'Tải ảnh thiệp PNG'. Hệ thống sẽ tự động vẽ và kết xuất một bức ảnh thiệp nghệ thuật độ phân giải cao bao gồm tên Giáo xứ, hoa văn viền vàng đồng cổ điển, câu Lời Chúa và lời chúc thiêng liêng trực tiếp về máy điện thoại của giáo dân để làm hình nền hoặc chia sẻ lên các mạng xã hội."
  },
  {
    question: "Vòng quay có hỗ trợ tự tạo bộ Lộc Lời Chúa tùy chỉnh không?",
    answer: "Có. Ngoài việc nạp nhanh các Preset được chuẩn bị sẵn, Giáo xứ hoàn toàn có thể tự nhập danh sách các câu Lời Chúa, lời nguyện hoặc thông điệp mục vụ riêng của Giáo xứ để phù hợp với các ngày lễ Quan thầy, lễ bổn mạng các đoàn thể hay dịp kỷ niệm đặc biệt."
  }
];

const TEMPLATES_DATA = [
  {
    id: 0,
    title: "Xuân An Bình",
    category: "Lộc Tết Truyền Thống",
    quote: "Hãy ký thác đường đời cho Chúa, Người sẽ ra tay nâng đỡ.",
    source: "Thánh Vịnh 37, 5",
    description: "Tông màu đỏ son truyền thống kết hợp hoa văn cát tường viền vàng đồng quý phái, mang lại không khí xuân ấm áp và thánh đức.",
    parish: "Giáo xứ Đức Mẹ Lộ Đức",
    themeBg: "linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)",
    accentColor: "#F59E0B"
  },
  {
    id: 1,
    title: "Ơn Thiêng Ngôi Ba",
    category: "Chúa Thánh Thần",
    quote: "Thần khí Chúa ban cho ta sức mạnh, tình yêu thương và sự tự chủ.",
    source: "2 Timôthê 1, 7",
    description: "Tông màu đỏ lửa rực rỡ tượng trưng cho ngọn lửa mến yêu của Ngôi Ba Thiên Chúa, phù hợp dịp lễ Hiện Xuống, Bí tích Thêm Sức.",
    parish: "Giáo xứ Thánh Thể",
    themeBg: "linear-gradient(135deg, #7C2D12 0%, #431407 100%)",
    accentColor: "#F97316"
  },
  {
    id: 2,
    title: "Hạt Giống Đức Tin",
    category: "Lời Chúa Hằng Sống",
    quote: "Lời Chúa là ngọn đèn soi cho con bước, là ánh sáng chỉ đường con đi.",
    source: "Thánh Vịnh 119, 105",
    description: "Tông màu xanh ngọc lục bảo nhã nhặn, tôn nghiêm, mang đậm tính chất phụng vụ thường niên để giáo dân nuôi dưỡng đức tin mỗi ngày.",
    parish: "Giáo hạt Emmanuel",
    themeBg: "linear-gradient(135deg, #064E3B 0%, #022C22 100%)",
    accentColor: "#10B981"
  }
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const selectedTemplate = previewTemplate !== null ? TEMPLATES_DATA[previewTemplate] : null;

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
            <a href="#templates" className="nav-link">Mẫu thiệp</a>
            <a href="#features" className="nav-link">Tính năng</a>
            <a href="#steps" className="nav-link">Cách làm</a>
            <a href="#faq" className="nav-link">Hỏi đáp</a>
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
      <section className="landing-hero" style={{ padding: '90px 16px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(216, 180, 63, 0.1)', border: '1px solid rgba(216, 180, 63, 0.3)', padding: '6px 16px', borderRadius: '30px', marginBottom: '24px' }}>
            <Sparkles size={16} style={{ color: 'var(--color-gold)' }} />
            <span style={{ color: 'var(--color-gold)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Giải pháp số hóa đức tin</span>
          </div>
          
          <h2 className="text-serif" style={{ fontSize: 'clamp(28px, 6vw, 46px)', fontWeight: '800', marginBottom: '20px', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
            Nền Tảng Vòng Quay Lộc Chúa<br />
            <span className="sparkle-text" style={{ color: 'var(--color-gold)' }}>Số Hóa Phụng Vụ Giáo Xứ</span>
          </h2>
          
          <p style={{ fontSize: '17px', opacity: 0.9, maxWidth: '720px', margin: '0 auto 36px auto', lineHeight: '1.6', color: '#E5E7EB' }}>
            Giải pháp số hóa giúp lưu truyền Lộc Lời Chúa và Bảy Ơn Chúa Thánh Thần trong các dịp Tết Nguyên Đán, lễ Quan Thầy.
            Giảm thiểu rác thải giấy, kết xuất ảnh thiệp tuyệt đẹp làm kỷ niệm lâu dài trên điện thoại, đồng bộ cùng hệ sinh thái đức tin.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/admin" className="btn btn-gold" style={{ padding: '14px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Quản lý Vòng quay Giáo xứ <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/register" className="btn btn-gold" style={{ padding: '14px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Bắt đầu tạo Vòng quay ngay <ArrowRight size={16} />
              </Link>
            )}
            <a href="#templates" className="btn btn-outline" style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)', padding: '14px 32px', fontSize: '15px' }}>
              Khám phá mẫu thiệp
            </a>
          </div>
        </div>
        
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(15, 61, 46, 0.4) 0%, transparent 60%)', zIndex: 1, pointerEvents: 'none' }}></div>
      </section>

      {/* Statistics & Social Proof */}
      <section style={{ padding: '50px 16px', background: '#05100c', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'rgba(8, 27, 21, 0.6)', border: '1px solid rgba(216, 180, 63, 0.2)' }}>
              <div className="stat-number" style={{ color: 'var(--color-gold)' }}>85+</div>
              <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700' }}>Giáo xứ & Đoàn thể</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '6px' }}>Đã triển khai vòng quay trực tuyến thành công.</p>
            </div>
            <div className="stat-card" style={{ background: 'rgba(8, 27, 21, 0.6)', border: '1px solid rgba(216, 180, 63, 0.2)' }}>
              <div className="stat-number" style={{ color: 'var(--color-gold)' }}>450,000+</div>
              <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700' }}>Lượt quay nhận Lộc</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '6px' }}>Giáo dân hân hoan đón nhận thông điệp thiêng liêng.</p>
            </div>
            <div className="stat-card" style={{ background: 'rgba(8, 27, 21, 0.6)', border: '1px solid rgba(216, 180, 63, 0.2)' }}>
              <div className="stat-number" style={{ color: 'var(--color-gold)' }}>100%</div>
              <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700' }}>Miễn phí & Tôn nghiêm</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '6px' }}>Không phi thương mại, không chèn quảng cáo rác.</p>
            </div>
          </div>
          
          <div style={{ marginTop: '40px', textAlign: 'center', maxWidth: '800px', margin: '40px auto 0 auto', padding: '24px', borderLeft: '3px solid var(--color-gold)', background: 'rgba(15, 61, 46, 0.3)', borderRadius: '0 12px 12px 0' }}>
            <Quote size={24} style={{ color: 'var(--color-gold)', marginBottom: '8px' }} />
            <p style={{ fontStyle: 'italic', color: '#E5E7EB', fontSize: '14.5px', lineHeight: '1.6' }}>
              "Vòng Quay Lộc Chúa mang lại trải nghiệm rất mới mẻ nhưng vẫn giữ được sự thánh thiêng và tôn kính cần có. Việc giáo dân có thể tải trực tiếp ảnh thiệp Lộc về điện thoại giúp Lời Chúa được ghi nhớ và chia sẻ lâu dài hơn trong đời sống thường nhật."
            </p>
            <p style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: '700', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              — Một Linh mục phụ trách Giáo xứ tại Tổng Giáo Phận Sài Gòn
            </p>
          </div>
        </div>
      </section>

      {/* Visual Card Template Gallery */}
      <section id="templates" style={{ padding: '80px 16px', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: '800' }}>
              Thư Viện Thiệp Mẫu Trực Quan
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '10px', fontSize: '15px', maxWidth: '600px', margin: '10px auto 0 auto' }}>
              Các mẫu thiệp được thiết kế tỉ mỉ, kết hợp nghệ thuật Công giáo và thư pháp hiện đại. Giáo dân có thể tải về dưới dạng PNG chất lượng cao.
            </p>
          </div>

          <div className="template-gallery-grid">
            {TEMPLATES_DATA.map((template) => (
              <div key={template.id} className="template-card" onClick={() => setPreviewTemplate(template.id)}>
                <div className="template-image-container">
                  <span className="template-badge">{template.category}</span>
                  {/* Virtual Card Preview inside */}
                  <div className="template-mock-card" style={{ border: `2.5px solid var(--color-gold)` }}>
                    <div className="corner-ornament top-left"></div>
                    <div className="corner-ornament top-right"></div>
                    <div className="corner-ornament bottom-left"></div>
                    <div className="corner-ornament bottom-right"></div>
                    
                    <div style={{ fontSize: '8px', color: 'var(--color-primary-soft)', fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {template.parish}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: 'auto 0' }}>
                      <Church size={20} style={{ color: 'var(--color-gold)' }} />
                      <p style={{ fontSize: '10px', fontStyle: 'italic', textAlign: 'center', color: '#1F2933', lineHeight: '1.4', padding: '0 4px' }}>
                        "{template.quote}"
                      </p>
                      <span style={{ fontSize: '8px', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                        — {template.source}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '7px', color: 'var(--color-gold)', fontWeight: '700', textAlign: 'center' }}>
                      BÌNH AN TRONG CHÚA
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {template.title}
                    <Eye size={16} style={{ color: 'var(--color-gold)' }} />
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', minHeight: '60px' }}>
                    {template.description}
                  </p>
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', fontSize: '12px', padding: '8px 12px' }}>
                    Xem trước thiệp mẫu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '80px 16px', background: '#FAF6EE', borderTop: '1px solid rgba(15, 61, 46, 0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: '800' }}>Tính Năng Vượt Trội</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>Xây dựng dựa trên sự tôn trọng sâu sắc đời sống đức tin Kitô giáo.</p>
          </div>

          <div className="feature-grid-inner">
            <div className="card gold-brass-border" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ background: 'rgba(15, 61, 46, 0.08)', color: 'var(--color-primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Church size={26} />
              </div>
              <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Thương hiệu White-label</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Mỗi giáo xứ sở hữu trang riêng dạng `/giao-xu/:slug`. Giao diện hoàn toàn không có bảng điều khiển kỹ thuật của admin, giữ sự trang trọng và tôn kính cao nhất.
              </p>
            </div>

            <div className="card gold-brass-border" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ background: 'rgba(216, 180, 63, 0.08)', color: 'var(--color-gold)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={26} />
              </div>
              <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Nạp Preset Nhanh Chóng</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Nạp sẵn bộ 7 Ơn Chúa Thánh Thần hoặc 100+ câu Lộc Lời Chúa ngày Tết được dịch và trích dẫn chương/câu chuẩn xác chỉ với duy nhất một lượt bấm chuột.
              </p>
            </div>

            <div className="card gold-brass-border" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', background: '#FFFFFF' }}>
              <div style={{ background: 'rgba(15, 61, 46, 0.08)', color: 'var(--color-primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={26} />
              </div>
              <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '700' }}>Tải Thiệp Lộc PNG</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Cho phép giáo dân kết xuất câu Lộc trúng thành dạng hình ảnh thiệp lụa nghệ thuật độ nét cao trực tiếp về điện thoại để làm hình nền hoặc chia sẻ Zalo/Facebook.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick 3-step Guide */}
      <section id="steps" style={{ padding: '80px 16px', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: '800' }}>Hướng Dẫn Nhanh 3 Bước</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>Chỉ mất 2 phút để thiết lập một trang Vòng quay hoàn hảo cho Giáo xứ của bạn.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <Settings size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="text-serif" style={{ fontSize: '19px', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '10px' }}>Khởi tạo tài khoản</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Đăng ký tài khoản Giáo xứ của bạn, điền tên Giáo xứ và đường dẫn slug mong muốn để tạo thương hiệu White-label riêng biệt.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num">2</div>
              <Layers size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="text-serif" style={{ fontSize: '19px', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '10px' }}>Nạp hoặc Tùy chỉnh Lộc</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Chọn nạp nhanh preset Lộc Lời Chúa Tết hoặc Lộc Chúa Thánh Thần chuẩn dịch thuật Công giáo, hoặc tự biên soạn danh sách riêng.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num">3</div>
              <Share2 size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="text-serif" style={{ fontSize: '19px', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '10px' }}>Chia sẻ link Giáo xứ</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Gửi liên kết hoặc trình chiếu QR Code tại khuôn viên nhà thờ để giáo dân dùng điện thoại quét quay lộc và nhận ảnh thiệp PNG.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium GCC Companion Block */}
      <section id="about" style={{ padding: '80px 16px', background: '#FAF6EE', borderTop: '1px solid rgba(15, 61, 46, 0.08)' }}>
        <div className="container">
          <div className="gcc-premium-card">
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(216, 180, 63, 0.15)', border: '1px solid rgba(216, 180, 63, 0.4)', padding: '4px 12px', borderRadius: '20px', width: 'fit-content', marginBottom: '20px' }}>
                <Smartphone size={14} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hệ sinh thái Đức tin Công giáo</span>
              </div>
              
              <div className="gcc-premium-grid">
                <div>
                  <h2 className="text-serif" style={{ fontSize: '30px', color: 'var(--color-gold)', marginBottom: '16px', fontWeight: '800' }}>
                    Đồng Hành Cùng Ứng Dụng "Giờ Cha Chờ"
                  </h2>
                  <p style={{ fontSize: '14.5px', color: '#E5E7EB', lineHeight: '1.7', marginBottom: '24px' }}>
                    Nền tảng Vòng Quay Lộc Chúa là một sản phẩm phi thương mại, đồng bộ cùng hệ sinh thái ứng dụng di động <strong>Giờ Cha Chờ (GCC)</strong>.
                    Giờ Cha Chờ hỗ trợ giáo dân tìm kiếm nhà thờ gần nhất, tra cứu nhanh giờ thánh lễ, giờ giải tội của hàng ngàn giáo xứ trên khắp Việt Nam. 
                    Bằng việc sử dụng công cụ này, bạn đang cùng chúng tôi lan tỏa các tiện ích đức tin hữu dụng đến cộng đồng Dân Chúa.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href="https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ padding: '10px 20px', fontSize: '13px' }}>
                      Tải cho Android (Google Play)
                    </a>
                    <a href="https://apps.apple.com/vn/app/gi%E1%BB%9D-cha-ch%E1%BB%9D/id6760563537" target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ padding: '10px 20px', fontSize: '13px' }}>
                      Tải cho iOS (App Store)
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--color-gold)' }} />
                      <span>Hoàn toàn miễn phí</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img 
                    src="/logo-giochacho.webp" 
                    alt="Giờ Cha Chờ App" 
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '18px', 
                      objectFit: 'contain',
                      border: '1px solid var(--color-gold)', 
                      boxShadow: '0 8px 20px rgba(0,0,0,0.3)' 
                    }} 
                  />
                  <div style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--color-gold)', fontWeight: '700', letterSpacing: '1px' }}>
                    Giờ Cha Chờ App
                  </div>
                  <span style={{ fontSize: '11px', color: '#D1D5DB', textAlign: 'center' }}>
                    Đồng hành hiệp thông đời sống Kitô hữu mỗi ngày.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed FAQ Section */}
      <section id="faq" style={{ padding: '80px 16px', background: 'var(--color-bg)', borderTop: '1px solid rgba(15, 61, 46, 0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 className="text-serif" style={{ fontSize: '32px', color: 'var(--color-primary)', fontWeight: '800' }}>Hỏi Đáp Chi Tiết</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>Giải đáp các thắc mắc thường gặp về việc thiết lập và vận hành Vòng quay Giáo xứ.</p>
          </div>

          <div className="faq-grid">
            {FAQ_DATA.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="faq-item-card">
                  <button className="faq-trigger" onClick={() => toggleFaq(idx)}>
                    <span className="faq-title">{faq.question}</span>
                    {isOpen ? <ChevronUp size={18} style={{ color: 'var(--color-primary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />}
                  </button>
                  {isOpen && (
                    <div className="faq-content-area">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#05100c', padding: '36px 16px', color: '#FFFFFF', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <Church size={20} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>Vòng Quay Lộc Chúa</span>
          </div>
          <p style={{ opacity: 0.7, lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Dự án phụng sự đức tin Công giáo phi lợi nhuận. Đồng bộ phát triển và tài trợ bởi ứng dụng Giờ Cha Chờ (GCC). 
            Cam kết miễn phí trọn đời và không chèn quảng cáo thương mại.
          </p>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }}></div>
          <p style={{ opacity: 0.5, fontSize: '11px' }}>
            © 2026 Nền tảng Vòng Quay Lộc Chúa. Đã đăng ký bản quyền sản phẩm phụng sự đức tin.
          </p>
        </div>
      </footer>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="winner-card" style={{ maxWidth: '440px', background: '#FFFDF9' }} onClick={(e) => e.stopPropagation()}>
            <div className="winner-header" style={{ background: selectedTemplate.themeBg, borderBottom: '2px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-gold)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {selectedTemplate.category}
                </span>
                <button 
                  onClick={() => setPreviewTemplate(null)} 
                  style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="winner-main-title" style={{ fontSize: '20px', marginTop: '12px' }}>{selectedTemplate.title}</h3>
            </div>
            
            <div className="winner-body" style={{ padding: '30px 20px' }}>
              {/* Actual Art Card Render */}
              <div className="blessing-quote-card" style={{ background: '#FFFFFF', border: '2px double var(--color-gold)', padding: '36px 20px', position: 'relative' }}>
                <div className="corner-ornament top-left"></div>
                <div className="corner-ornament top-right"></div>
                <div className="corner-ornament bottom-left"></div>
                <div className="corner-ornament bottom-right"></div>
                
                <div className="winner-parish-info" style={{ color: 'var(--color-primary)', fontSize: '11px', letterSpacing: '1px', fontWeight: '800' }}>
                  {selectedTemplate.parish}
                </div>
                
                <div style={{ margin: '24px 0' }}>
                  <Church size={28} style={{ color: 'var(--color-gold)', margin: '0 auto 16px auto' }} />
                  <p className="blessing-text text-serif" style={{ fontSize: '17px', color: '#111827', fontStyle: 'italic', lineHeight: '1.6', padding: '0 8px' }}>
                    "{selectedTemplate.quote}"
                  </p>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-muted)', display: 'block', marginTop: '8px' }}>
                    — {selectedTemplate.source}
                  </span>
                </div>
                
                <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: '700', letterSpacing: '1px' }}>
                  BÌNH AN TRONG CHÚA KÝ THÁC
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
                Đây là bức thiệp giáo dân sẽ nhận được sau khi quay trúng ô lộc này. Thiệp có hoa văn vàng đồng tinh tế ở các góc và có thể được tải về điện thoại ngay tức khắc dưới định dạng PNG.
              </p>

              <button 
                onClick={() => alert("Đây là ảnh thiệp mẫu minh họa. Tính năng tải thiệp chính thức sẽ hoạt động sau khi bạn quay vòng quay thực tế tại trang của Giáo xứ.")}
                className="btn btn-gold" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                <Download size={16} /> Tải ảnh thiệp mẫu (PNG)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
