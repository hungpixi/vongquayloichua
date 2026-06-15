import sys

sys.stdout.reconfigure(encoding='utf-8')

code = """import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import type { Parish, Wheel, Blessing } from '../services/db';
import { Church, Download, Copy, RefreshCw, X, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

// Component vẽ hoa văn góc cho thiệp Lộc Lời Chúa dạng vector sắc nét, chất lượng cao
const CornerOrnamentSVG: React.FC<{ style?: React.CSSProperties; isChristmas?: boolean }> = ({ style, isChristmas }) => {
  if (isChristmas) {
    return (
      <svg 
        viewBox="0 0 24 24" 
        style={{
          position: 'absolute',
          width: '26px',
          height: '26px',
          color: 'inherit',
          pointerEvents: 'none',
          ...style
        }}
      >
        <path 
          d="M2 2h14M2 2v14M5 5h8M5 5v8" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round"
        />
        <path 
          d="M8 2.5 L9.2 6 L12.7 7.2 L9.2 8.4 L8 11.9 L6.8 8.4 L3.3 7.2 L6.8 6 Z" 
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg 
      viewBox="0 0 24 24" 
      style={{
        position: 'absolute',
        width: '22px',
        height: '22px',
        color: 'inherit',
        pointerEvents: 'none',
        ...style
      }}
    >
      <path 
        d="M2 2h16M2 2v16M5 5h10M5 5v10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round"
      />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    </svg>
  );
};

interface LockedBlessing {
  id: string;
  itemSpun: string;
  quote?: string;
  text: string;
  timestamp: number;
}

// Hàm tính toán màu chữ tương phản cao dựa trên độ sáng nền (Màu Chữ/Màu Gold)
const getTextContrastColor = (bgColor: string, fallbackColor: string) => {
  const hex = bgColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 165 ? fallbackColor : '#FFFFFF';
};

export const ParishionerWheel: React.FC = () => {
  const { parishSlug, wheelSlug, wheelId } = useParams<{ parishSlug?: string; wheelSlug?: string; wheelId?: string }>();
  const [parish, setParish] = useState<Parish | null>(null);
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerBlessing, setWinnerBlessing] = useState<Blessing | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [lockedBlessing, setLockedBlessing] = useState<LockedBlessing | null>(null);
  const [isAdClosed, setIsAdClosed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Responsiveness checks
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinAngleRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isSpinningRef = useRef(false);
  const animationCallbackRef = useRef<((colors: string[], targetAngle: number) => void) | null>(null);
  const exportCardRef = useRef<HTMLDivElement | null>(null);

  const getThemeColors = (preset?: string) => {
    switch (preset) {
      case 'christmas':
        return ['#D8B43F', '#9E1B1B', '#0F5E3D', '#FFFFFF', '#0E4B75'];
      case 'red':
        return ['#7F1D1D', '#D8B43F', '#450a0a', '#FFF8E8', '#991b1b', '#E6B93D'];
      case 'blue':
        return ['#0E4B75', '#D8B43F', '#072a44', '#FFF8E8', '#1A5F7A', '#E6B93D'];
      case 'green':
        return ['#0F5E3D', '#D8B43F', '#0a3d28', '#FFF8E8', '#1F8A55', '#E6B93D'];
      default:
        return ['#0F3D2E', '#D8B43F', '#1F6B4A', '#FFF8E8', '#2F6B4F', '#E6B93D'];
    }
  };

  const getLayoutBackground = (preset?: string) => {
    switch (preset) {
      case 'christmas':
        return {};
      case 'red':
        return {
          background: '#2A0505',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #5C1515 0%, #2A0505 100%)'
        };
      case 'blue':
        return {
          background: '#051C2C',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #0E4B75 0%, #051C2C 100%)'
        };
      case 'green':
        return {
          background: '#052618',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #0F5E3D 0%, #052618 100%)'
        };
      default:
        return {
          background: '#081B15',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #164D3B 0%, #081B15 100%)'
        };
    }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchWheelData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res = null;
      if (wheelId) {
        res = await dbService.getWheelById(wheelId);
      } else if (parishSlug && wheelSlug) {
        res = await dbService.getWheelBySlugs(parishSlug, wheelSlug);
      }

      if (!res) {
        if (isMountedRef.current) setError('Không tìm thấy Vòng quay hoặc đường dẫn đã hết hạn.');
        return;
      }

      if (!isMountedRef.current) return;
      setParish(res.parish);
      setWheel(res.wheel);

      const blessingsList = await dbService.getBlessings(res.wheel.id);
      if (!isMountedRef.current) return;
      setBlessings(blessingsList);

      // Check locked spun blessing
      let spun = null;
      if (res.wheel.lock_duration !== 'none') {
        const sessionSpun = sessionStorage.getItem(`session_spun_blessing_${res.wheel.id}`);
        if (sessionSpun) {
          const parsed = JSON.parse(sessionSpun);
          const now = Date.now();
          if (
            res.wheel.lock_duration === 'forever' ||
            (res.wheel.lock_duration === '24h' && now - parsed.timestamp < 24 * 60 * 60 * 1000)
          ) {
            spun = parsed;
          } else {
            sessionStorage.removeItem(`session_spun_blessing_${res.wheel.id}`);
          }
        }

        if (!spun) {
          const localSpun = localStorage.getItem(`spun_blessing_${res.wheel.id}`);
          if (localSpun) {
            const parsed = JSON.parse(localSpun);
            const now = Date.now();
            if (res.wheel.lock_duration === 'forever') {
              spun = parsed;
            } else if (res.wheel.lock_duration === '24h' && now - parsed.timestamp < 24 * 60 * 60 * 1000) {
              spun = parsed;
            } else {
              localStorage.removeItem(`spun_blessing_${res.wheel.id}`);
            }
          }
        }
      }

      if (spun) {
        setLockedBlessing(spun);
        setWinnerBlessing(
          blessingsList.find(b => b.id === spun.id) || {
            id: spun.id,
            wheel_id: res.wheel.id,
            category: spun.itemSpun,
            quote: spun.quote,
            text: spun.text,
            is_custom: true
          }
        );
        setShowWinnerModal(true);

        const idx = blessingsList.findIndex(b => b.id === spun.id);
        if (idx !== -1 && blessingsList.length > 0) {
          const anglePerSegment = (2 * Math.PI) / blessingsList.length;
          spinAngleRef.current = 2 * Math.PI - (idx + 0.5) * anglePerSegment;
        }
      }
    } catch (e) {
      console.error(e);
      if (isMountedRef.current) setError('Lỗi kết nối máy chủ.');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [parishSlug, wheelSlug, wheelId]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.warn('AudioContext resume failed:', e));
    }
  }, []);

  const playTickSound = useCallback(() => {
    if (!wheel?.enable_sound || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [wheel]);

  const playFanfareSound = useCallback(() => {
    if (!wheel?.enable_sound || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;
    [280, 420, 560, 700].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(idx === 0 ? 0.15 : 0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === 0 ? 2.5 : 1.5));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 3);
    });
  }, [wheel]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wheel) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 10;
    ctx.clearRect(0, 0, w, h);
    const len = blessings.length;
    if (len === 0) return;
    const anglePerSegment = (2 * Math.PI) / len;
    const colors = getThemeColors(wheel.theme_preset);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinAngleRef.current);

    for (let i = 0; i < len; i++) {
      const startAng = i * anglePerSegment;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, startAng, startAng + anglePerSegment);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = '#D8B43F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text rendering
      ctx.save();
      ctx.fillStyle = getTextContrastColor(colors[i % colors.length], 'var(--color-primary)');
      ctx.rotate(startAng + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      let text = blessings[i].category || `Mục ${i + 1}`;
      let fontSize = '13px';
      if (len > 30) {
        const numMatch = text.match(/\\d+/);
        text = numMatch ? numMatch[0] : `${i + 1}`;
        fontSize = len > 80 ? '9px' : len > 50 ? '11px' : '12px';
      } else {
        fontSize = len > 20 ? '11px' : '13px';
      }
      ctx.font = `bold ${fontSize} 'Be Vietnam Pro', sans-serif`;
      ctx.fillText(text, r - 20, 0);
      ctx.restore();
    }
    ctx.restore();

    // Draw center pin hub
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#D8B43F';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--color-primary)';
    ctx.fill();
  }, [blessings, wheel]);

  useEffect(() => {
    isMountedRef.current = true;
    setTimeout(() => {
      fetchWheelData();
    }, 0);
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.warn('Failed to close AudioContext:', e));
        audioContextRef.current = null;
      }
    };
  }, [fetchWheelData]);

  useEffect(() => {
    if (!isLoading && canvasRef.current && blessings.length > 0 && wheel) {
      drawWheel();
    }
  }, [isLoading, blessings, wheel, drawWheel]);

  const handleWinningBlessing = useCallback((item: Blessing) => {
    if (!wheel) return;
    playFanfareSound();
    if (wheel.enable_confetti) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    dbService.recordSpin(wheel.id, item.category, item.id);
    const spunData = {
      id: item.id,
      itemSpun: item.category,
      quote: item.quote,
      text: item.text,
      timestamp: Date.now()
    };
    if (isMountedRef.current) {
      sessionStorage.setItem(`session_spun_blessing_${wheel.id}`, JSON.stringify(spunData));
      if (wheel.lock_duration !== 'none') {
        localStorage.setItem(`spun_blessing_${wheel.id}`, JSON.stringify(spunData));
        setLockedBlessing(spunData);
      }
      setShowWinnerModal(true);
    }
  }, [wheel, playFanfareSound]);

  const animateSpin = useCallback((colors: string[], targetAngle: number) => {
    if (!isMountedRef.current) return;
    spinAngleRef.current += spinSpeedRef.current;
    const len = blessings.length;
    const anglePerSegment = (2 * Math.PI) / len;

    // Click sound when crossing segments
    if (
      Math.floor((spinAngleRef.current - spinSpeedRef.current) / anglePerSegment) !==
      Math.floor(spinAngleRef.current / anglePerSegment)
    ) {
      playTickSound();
    }

    // Deceleration
    spinSpeedRef.current *= 0.982;

    if (spinSpeedRef.current < 0.002) {
      if (isMountedRef.current) {
        setIsSpinning(false);
        isSpinningRef.current = false;
      }
      spinSpeedRef.current = 0;
      const normalizedAngle = (2 * Math.PI - (spinAngleRef.current % (2 * Math.PI))) % (2 * Math.PI);
      const winningIdx = Math.floor(normalizedAngle / anglePerSegment) % len;
      const item = blessings[winningIdx];
      if (isMountedRef.current) {
        setWinnerBlessing(item);
        handleWinningBlessing(item);
      }
    } else {
      drawWheel();
      animationFrameRef.current = requestAnimationFrame(() => {
        if (animationCallbackRef.current) animationCallbackRef.current(colors, targetAngle);
      });
    }
  }, [blessings, playTickSound, drawWheel, handleWinningBlessing]);

  useEffect(() => {
    animationCallbackRef.current = animateSpin;
  }, [animateSpin]);

  const handleStartSpin = useCallback(() => {
    if (isSpinningRef.current || isSpinning || blessings.length < 2 || !wheel) return;
    initAudio();
    isSpinningRef.current = true;
    setIsSpinning(true);
    setShowWinnerModal(false);

    const extraSpins = (8 + Math.floor(Math.random() * 5)) * (2 * Math.PI);
    spinSpeedRef.current = 0.25 + Math.random() * 0.15;
    animateSpin(getThemeColors(wheel.theme_preset), extraSpins);
  }, [isSpinning, blessings, wheel, initAudio, animateSpin]);

  const handleCopyBlessing = useCallback((text: string, quote?: string) => {
    const copyText = `🙏 LỘC LỜI CHÚA 🙏\\n\\n“ ${text} ”${
      quote ? `\\n— ${quote}` : ''
    }\\n\\nChúc mừng bạn đã nhận được Lộc Thánh từ ${
      parish?.name || 'Giáo xứ'
    }!\\nNguyện xin Lời Chúa soi sáng, nâng đỡ và tuôn đổ hồng ân trên quý vị cùng gia quyến.\\n\\n✨ Đón nhận Lộc Lời Chúa của bạn tại:\\n🔗 ${
      window.location.href
    }`;
    navigator.clipboard.writeText(copyText);
    showToast('Đã sao chép Lộc Lời Chúa!');
  }, [parish, showToast]);

  const handleDownloadPNG = useCallback(async () => {
    const el = exportCardRef.current;
    if (el) {
      showToast('Đang tạo ảnh thiệp sắc nét...');
      try {
        await document.fonts.ready;
        const origWidth = el.style.width;
        const origMaxWidth = el.style.maxWidth;
        el.style.width = '430px';
        el.style.maxWidth = '430px';

        const canvas = await html2canvas(el, {
          useCORS: true,
          backgroundColor: null,
          scale: 3,
          logging: false,
          windowWidth: 430,
          windowHeight: el.offsetHeight
        });
        el.style.width = origWidth;
        el.style.maxWidth = origMaxWidth;

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Loc_Loi_Chua_${parish?.slug || 'giao_xu'}.png`;
        link.href = dataUrl;
        link.click();
        showToast('Đã tải thiệp Lộc Lời Chúa thành công!');
      } catch (e) {
        console.error(e);
        showToast('Không thể xuất ảnh thiệp. Vui lòng thử lại.');
      }
    }
  }, [parish, showToast]);

  const handleOpenLockedModal = useCallback(() => {
    if (!lockedBlessing || !wheel) return;
    setWinnerBlessing(
      blessings.find(b => b.id === lockedBlessing.id) || {
        id: lockedBlessing.id,
        wheel_id: wheel.id,
        category: lockedBlessing.itemSpun,
        quote: lockedBlessing.quote,
        text: lockedBlessing.text,
        is_custom: true
      }
    );
    setShowWinnerModal(true);
  }, [lockedBlessing, blessings, wheel]);

  const renderBlessingCard = (isModal: boolean) => {
    if (!winnerBlessing || !wheel) return null;
    const textLength = winnerBlessing.text?.length || 0;
    const fontSize = textLength > 150 ? '14px' : textLength > 100 ? '15.5px' : '17.5px';
    const presetColors = getThemeColors(wheel.theme_preset);

    const cardContent = (
      <div
        className="winner-card"
        onClick={isModal ? (e) => e.stopPropagation() : undefined}
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '430px',
          position: isModal ? 'relative' : undefined,
          flexShrink: isModal ? undefined : 0
        }}
      >
        {(!lockedBlessing || isModal) && (
          <button
            onClick={() => {
              setShowWinnerModal(false);
              if (!isModal) setWinnerBlessing(null);
            }}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `1.5px solid ${wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]}`,
              color: presetColors[0],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              zIndex: 1010,
              transition: 'transform 0.1s ease',
              padding: 0
            }}
            onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}

        {/* Captured content for image export (high quality prayer card) */}
        <div
          ref={exportCardRef}
          className="winner-export-container"
          style={{
            background: 'linear-gradient(135deg, #FFFDF6 0%, #FFF9EC 50%, #FFF4DE 100%)',
            padding: '20px',
            position: 'relative',
            borderRadius: '24px',
            border: `1.5px solid ${wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
            width: '100%'
          }}
        >
          {/* Inner border style with 4px margin to create double frame */}
          <div
            style={{
              border: `1px solid ${wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]}a0`,
              borderRadius: '16px',
              padding: '4px',
              boxSizing: 'border-box',
              width: '100%'
            }}
          >
            <div
              style={{
                border: `1.5px solid ${wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]}`,
                borderRadius: '12px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                boxSizing: 'border-box',
                width: '100%',
                minHeight: '380px',
                justifyContent: 'center'
              }}
            >
              {/* Decorative Corner Ornaments */}
              <CornerOrnamentSVG
                style={{ top: '8px', left: '8px', color: wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1] }}
                isChristmas={wheel.theme_preset === 'christmas'}
              />
              <CornerOrnamentSVG
                style={{
                  top: '8px',
                  right: '8px',
                  transform: 'scaleX(-1)',
                  color: wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]
                }}
                isChristmas={wheel.theme_preset === 'christmas'}
              />
              <CornerOrnamentSVG
                style={{
                  bottom: '8px',
                  left: '8px',
                  transform: 'scaleY(-1)',
                  color: wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]
                }}
                isChristmas={wheel.theme_preset === 'christmas'}
              />
              <CornerOrnamentSVG
                style={{
                  bottom: '8px',
                  right: '8px',
                  transform: 'scaleX(-1) scaleY(-1)',
                  color: wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1]
                }}
                isChristmas={wheel.theme_preset === 'christmas'}
              />

              {/* Cross SVG icon */}
              <svg
                viewBox="0 0 24 24"
                width="40"
                height="40"
                style={{ color: presetColors[1], marginBottom: '12px' }}
                fill="currentColor"
              >
                <path d="M12,5 A1.2,1.2 0 1,1 12,2.6 A1.2,1.2 0 1,1 12,5 Z" />
                <path d="M5,12 A1.2,1.2 0 1,1 2.6,12 A1.2,1.2 0 1,1 5,12 Z" />
                <path d="M21.4,12 A1.2,1.2 0 1,1 19,12 A1.2,1.2 0 1,1 21.4,12 Z" />
                <path d="M11,5 L13,5 L13,11 L19,11 L19,13 L13,13 L13,19 C13,19.6 12.6,20.1 12,20.1 C11.4,20.1 10.9,19.6 10.9,19 L10.9,13 L5,13 L5,11 L11,11 Z" />
                <path d="M12,8.5 L15.5,12 L12,15.5 L8.5,12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
              </svg>

              <div
                style={{
                  color: presetColors[0],
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {parish?.name}
              </div>

              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '24px',
                  fontWeight: 800,
                  color: presetColors[0],
                  margin: '0 0 12px 0',
                  letterSpacing: '0.5px'
                }}
              >
                LỘC LỜI CHÚA
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', width: '70%', margin: '0 auto 16px auto', gap: '8px' }}>
                <div
                  style={{
                    height: '1px',
                    flex: 1,
                    background: `linear-gradient(to right, transparent, ${presetColors[1]}, transparent)`
                  }}
                ></div>
                <span style={{ color: presetColors[1], fontSize: '10px' }}>✦</span>
                <div
                  style={{
                    height: '1px',
                    flex: 1,
                    background: `linear-gradient(to left, transparent, ${presetColors[1]}, transparent)`
                  }}
                ></div>
              </div>

              {/* Category Badge */}
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFF8E8',
                  background: presetColors[0],
                  padding: '6px 16px',
                  borderRadius: '20px',
                  marginBottom: '20px',
                  border: `1.5px solid ${presetColors[1]}`,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {winnerBlessing.category}
              </div>

              {/* Holy scripture passage */}
              <p
                className="text-serif"
                style={{
                  fontSize,
                  lineHeight: '1.65',
                  color: '#1A202C',
                  fontStyle: 'italic',
                  margin: '8px 0 12px 0',
                  padding: '0 10px',
                  fontWeight: 500
                }}
              >
                “ {winnerBlessing.text} ”
              </p>

              {winnerBlessing.quote && (
                <p
                  className="text-serif"
                  style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: presetColors[0],
                    marginTop: '4px',
                    marginBottom: '20px',
                    fontStyle: 'italic'
                  }}
                >
                  — {winnerBlessing.quote}
                </p>
              )}

              <div
                style={{
                  height: '1px',
                  width: '35%',
                  background: `linear-gradient(to right, transparent, ${presetColors[1]}80, transparent)`,
                  margin: '0 auto 16px auto'
                }}
              ></div>

              {/* Warm Pastoral New Year Greeting */}
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-dark)',
                  fontWeight: '500',
                  fontStyle: 'italic',
                  lineHeight: '1.5',
                  margin: 0,
                  opacity: 0.85
                }}
              >
                Kính chúc quý cộng đoàn một năm mới bình an,
                <br />
                đầy tràn ân sủng của Thiên Chúa!
              </p>

              {/* Subtle branding signature inside card */}
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '9px',
                  color: `${presetColors[1]}a0`,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  opacity: 0.8
                }}
              >
                Vòng Quay Lời Chúa • giochacho.vn
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls (Not captured in image) */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: `1px solid ${presetColors[0]}14`
          }}
        >
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => handleCopyBlessing(winnerBlessing.text, winnerBlessing.quote)}
              className="copy-blessing-btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                height: '44px',
                borderRadius: '12px',
                background: `${presetColors[0]}0D`,
                border: `1px solid ${presetColors[0]}1C`,
                color: presetColors[0],
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <Copy size={15} />
              <span>Sao chép chữ</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="btn btn-primary"
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '12px',
                background: presetColors[0],
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: `0 4px 12px ${presetColors[0]}25`
              }}
            >
              <Download size={15} />
              Lưu ảnh Lộc
            </button>
          </div>

          <button
            onClick={() => {
              setShowWinnerModal(false);
              if (!isModal) setWinnerBlessing(null);
            }}
            className="btn btn-secondary"
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background: '#F3F4F6',
              color: '#4B5563',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    );

    return isModal ? (
      <div className="modal-overlay" onClick={() => setShowWinnerModal(false)}>
        {cardContent}
      </div>
    ) : (
      cardContent
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          gap: '8px'
        }}
      >
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
        <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Đang nhận diện Giáo xứ...</span>
      </div>
    );
  }

  if (error || !wheel) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <AlertTriangle size={48} style={{ color: 'var(--color-error)' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--color-text-dark)', fontWeight: '700' }}>
          {error || 'Đường dẫn không tồn tại.'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Vui lòng liên hệ với Ban Truyền Thông Giáo xứ để nhận đường dẫn chính xác.
        </p>
        <Link to="/" className="btn btn-primary">
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  const borderGold = wheel.theme_preset === 'christmas' ? '#F59E0B' : getThemeColors(wheel.theme_preset)[1];

  return (
    <div
      className={wheel.theme_preset === 'christmas' ? 'public-layout theme-christmas-layout' : 'public-layout'}
      style={{
        ...getLayoutBackground(wheel.theme_preset),
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 12px',
        color: '#FFFFFF'
      }}
    >
      {/* Outer Row/Column Layout wrapper */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '540px',
          margin: '0 auto',
          paddingBottom: isAdClosed ? '0' : '60px'
        }}
      >
        {/* Wheel Card wrapper (Holy Card) */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${borderGold}`,
            borderRadius: isSmallScreen ? '16px' : '20px',
            padding: isSmallScreen ? '16px' : '24px 20px',
            background: 'radial-gradient(circle at center, #FFFDF6 0%, #FFF5DB 100%)',
            color: 'var(--color-text-dark)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 40px rgba(216, 180, 63, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative double borders corners */}
          <div
            className="corner-ornament top-left"
            style={{
              borderColor: borderGold,
              borderTopStyle: 'solid',
              borderLeftStyle: 'solid',
              borderTopWidth: '2.5px',
              borderLeftWidth: '2.5px',
              top: isSmallScreen ? '8px' : '12px',
              left: isSmallScreen ? '8px' : '12px',
              width: '16px',
              height: '16px',
              position: 'absolute'
            }}
          />
          <div
            className="corner-ornament top-right"
            style={{
              borderColor: borderGold,
              borderTopStyle: 'solid',
              borderRightStyle: 'solid',
              borderTopWidth: '2.5px',
              borderRightWidth: '2.5px',
              top: isSmallScreen ? '8px' : '12px',
              right: isSmallScreen ? '8px' : '12px',
              width: '16px',
              height: '16px',
              position: 'absolute'
            }}
          />
          <div
            className="corner-ornament bottom-left"
            style={{
              borderColor: borderGold,
              borderBottomStyle: 'solid',
              borderLeftStyle: 'solid',
              borderBottomWidth: '2.5px',
              borderLeftWidth: '2.5px',
              bottom: isSmallScreen ? '8px' : '12px',
              left: isSmallScreen ? '8px' : '12px',
              width: '16px',
              height: '16px',
              position: 'absolute'
            }}
          />
          <div
            className="corner-ornament bottom-right"
            style={{
              borderColor: borderGold,
              borderBottomStyle: 'solid',
              borderRightStyle: 'solid',
              borderBottomWidth: '2.5px',
              borderRightWidth: '2.5px',
              bottom: isSmallScreen ? '8px' : '12px',
              right: isSmallScreen ? '8px' : '12px',
              width: '16px',
              height: '16px',
              position: 'absolute'
            }}
          />

          <header
            className="public-header"
            style={{
              padding: isSmallScreen ? '8px 4px 4px 4px' : '16px 12px 8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isSmallScreen ? '4px' : '6px'
            }}
          >
            <div
              className="public-logo"
              style={{
                background: `linear-gradient(135deg, ${getThemeColors(wheel.theme_preset)[0]} 0%, ${
                  getThemeColors(wheel.theme_preset)[4]
                } 100%)`,
                color: getThemeColors(wheel.theme_preset)[1],
                border: `2px solid ${getThemeColors(wheel.theme_preset)[1]}`,
                boxShadow: '0 4px 12px rgba(15, 61, 46, 0.15)',
                width: isSmallScreen ? '44px' : '56px',
                height: isSmallScreen ? '44px' : '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isSmallScreen ? '0px' : '4px'
              }}
            >
              <Church size={isSmallScreen ? 20 : 26} />
            </div>

            <div
              className="public-parish-name"
              style={{
                fontSize: isSmallScreen ? '12px' : '13.5px',
                fontWeight: 800,
                color: getThemeColors(wheel.theme_preset)[0],
                textTransform: 'uppercase',
                letterSpacing: isSmallScreen ? '1.5px' : '2px',
                textAlign: 'center',
                lineHeight: 1.3
              }}
            >
              {parish?.name}
            </div>

            <h2
              className="public-event-title"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: isSmallScreen ? '22px' : '28px',
                fontWeight: 800,
                color: getThemeColors(wheel.theme_preset)[0],
                textAlign: 'center',
                margin: '2px 0 6px 0',
                lineHeight: 1.25,
                textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)'
              }}
            >
              {wheel.title}
            </h2>

            <p
              className="public-description"
              style={{
                fontSize: isSmallScreen ? '14px' : '15.5px',
                color: '#2D3748',
                fontWeight: 500,
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: isSmallScreen ? '1.45' : '1.6',
                textAlign: 'center'
              }}
            >
              {lockedBlessing
                ? 'Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.'
                : wheel.description || 'Xin nhấn nút dưới đây để đón nhận ân sủng Lộc Lời Chúa dành riêng cho quý vị.'}
            </p>
          </header>

          <div
            className="wheel-wrapper"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: isSmallScreen ? '8px 0' : '16px 0',
              flex: 1
            }}
          >
            <div
              className="wheel-container"
              style={{
                position: 'relative',
                width: '440px',
                height: '440px',
                maxWidth: '85vw',
                maxHeight: '85vw',
                borderRadius: '50%',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(216, 180, 63, 0.25)',
                background: '#FFFFFF',
                padding: '8px',
                borderColor: wheel.theme_preset === 'christmas' ? '#F59E0B' : getThemeColors(wheel.theme_preset)[1],
                borderWidth: '8px',
                borderStyle: 'double'
              }}
            >
              <canvas
                ref={canvasRef}
                id="wheel-canvas"
                width="600"
                height="600"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  display: 'block'
                }}
              />

              {/* Pin Indicator Pointer */}
              <div
                className="wheel-pointer"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-16px',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: '48px',
                  height: '48px',
                  pointerEvents: 'none'
                }}
              >
                {wheel.theme_preset === 'christmas' ? (
                  <svg viewBox="0 0 40 40" width="48" height="48">
                    <defs>
                      <linearGradient id="goldMetallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFEFA6" />
                        <stop offset="35%" stopColor="#D8B43F" />
                        <stop offset="100%" stopColor="#8A6F1C" />
                      </linearGradient>
                      <filter id="goldPointerShadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.4" />
                      </filter>
                    </defs>
                    <path
                      d="M 4 20 L 22 17 L 18 12 L 25 14 L 28 4 L 31 14 L 38 12 L 34 17 L 37 20 L 34 23 L 38 28 L 31 26 L 28 36 L 25 26 L 18 28 L 22 23 Z"
                      fill="url(#goldMetallicGradient)"
                      filter="url(#goldPointerShadow)"
                      stroke="#FFF5D1"
                      strokeWidth="1.2"
                    />
                    <circle cx="28" cy="20" r="3" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 2px #FFEFA6)' }} />
                  </svg>
                ) : (
                  <svg viewBox="0 0 40 40" width="48" height="48">
                    <defs>
                      <linearGradient id="goldMetallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFEFA6" />
                        <stop offset="35%" stopColor="#D8B43F" />
                        <stop offset="100%" stopColor="#8A6F1C" />
                      </linearGradient>
                      <filter id="goldPointerShadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.4" />
                      </filter>
                    </defs>
                    <path
                      d="M 6 20 L 24 9 C 30 6, 36 11, 36 20 C 36 29, 30 34, 24 31 Z"
                      fill="url(#goldMetallicGradient)"
                      filter="url(#goldPointerShadow)"
                      stroke="#FFF5D1"
                      strokeWidth="1.2"
                    />
                    <path d="M 26 14 H 28 V 26 H 26 Z M 23 18 H 31 V 20 H 23 Z" fill="#5C470D" />
                  </svg>
                )}
              </div>

              {/* Center Spin Trigger Button */}
              {lockedBlessing ? (
                <button
                  onClick={handleOpenLockedModal}
                  className="spin-center-btn"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background:
                      wheel.theme_preset === 'christmas'
                        ? 'radial-gradient(circle at 30% 30%, #FFFDF6 0%, #F59E0B 45%, #D97706 75%, #78350F 100%)'
                        : 'radial-gradient(circle at 30% 30%, #FFEFA6 0%, #D8B43F 50%, #A37F1A 100%)',
                    color: wheel.theme_preset === 'christmas' ? '#9E1B1B' : getThemeColors(wheel.theme_preset)[0],
                    borderColor: wheel.theme_preset === 'christmas' ? '#FFFBEB' : '#FFF5D1',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow:
                      wheel.theme_preset === 'christmas'
                        ? '0 0 0 3px #F59E0B, 0 6px 20px rgba(245, 158, 11, 0.4), inset 0 3px 6px rgba(255, 255, 255, 0.8)'
                        : '0 0 0 3px #D8B43F, 0 6px 16px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                    fontSize: '11px',
                    fontWeight: '800',
                    lineHeight: '1.25',
                    cursor: 'pointer',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
                    padding: '4px',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  XEM LỘC
                  <br />
                  ĐÃ NHẬN
                </button>
              ) : (
                <button
                  onClick={handleStartSpin}
                  className="spin-center-btn"
                  disabled={isSpinning || blessings.length < 2}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background:
                      wheel.theme_preset === 'christmas'
                        ? 'radial-gradient(circle at 30% 30%, #FFFDF6 0%, #F59E0B 45%, #D97706 75%, #78350F 100%)'
                        : 'radial-gradient(circle at 30% 30%, #FFEFA6 0%, #D8B43F 50%, #A37F1A 100%)',
                    color: wheel.theme_preset === 'christmas' ? '#9E1B1B' : getThemeColors(wheel.theme_preset)[0],
                    borderColor: wheel.theme_preset === 'christmas' ? '#FFFBEB' : '#FFF5D1',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow:
                      wheel.theme_preset === 'christmas'
                        ? '0 0 0 3px #F59E0B, 0 6px 20px rgba(245, 158, 11, 0.4), inset 0 3px 6px rgba(255, 255, 255, 0.8)'
                        : '0 0 0 3px #D8B43F, 0 6px 16px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  {isSpinning ? 'ĐANG QUAY' : 'QUAY LỘC'}
                </button>
              )}
            </div>
          </div>

          {/* Warning/Info display for Locked user */}
          {lockedBlessing && (
            <div style={{ textAlign: 'center', margin: '8px 0 16px 0', padding: '0 16px' }}>
              <button
                onClick={handleOpenLockedModal}
                className="btn"
                style={{
                  background: `linear-gradient(135deg, ${getThemeColors(wheel.theme_preset)[0]} 0%, ${
                    getThemeColors(wheel.theme_preset)[4]
                  } 100%)`,
                  color: '#FFFFFF',
                  border: `1.5px solid ${getThemeColors(wheel.theme_preset)[1]}`,
                  gap: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  borderRadius: '30px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <Church size={16} style={{ color: getThemeColors(wheel.theme_preset)[1] }} />
                Xem lại Lộc Thánh của bạn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render winner modal overlay directly when spun */}
      {showWinnerModal && winnerBlessing && renderBlessingCard(true)}

      {/* Footer Banner Promotion (Graceful footer banner) */}
      {!isAdClosed && (
        <div className="footer-ad-banner" style={{ borderTopColor: getThemeColors(wheel.theme_preset)[1] }}>
          <div className="ad-content">
            <span className="ad-logo-badge">Giờ Cha Chờ</span>
            <span className="ad-text">Đồng hành cùng đức tin Công giáo. Tìm nhanh giờ Thánh Lễ & Giờ Xưng Tội gần nhất.</span>
            <a
              href="https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative"
              target="_blank"
              rel="noopener noreferrer"
              className="ad-link-btn"
            >
              Tải miễn phí
            </a>
            <button onClick={() => setIsAdClosed(true)} className="ad-close-btn" title="Đóng quảng cáo">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
};
"""

with open("src/pages/ParishionerWheel.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("ParishionerWheel.tsx updated successfully.")
