import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dbService } from '../services/db';
import type { Parish, Wheel, Blessing } from '../services/db';
import { Church, Download, Copy, RefreshCw, X, AlertTriangle, Share2, Gift, Volume2, VolumeX } from 'lucide-react';
import { BGM_OPTIONS, playSynthesizedSpinSFX, playSynthesizedWinSFX, RELIGIOUS_ICONS } from '../utils/audioHelper';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { supabase } from '../services/supabaseClient';
import { getDeviceFingerprint } from '../utils/fingerprint';

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

// Hàm lấy màu tối tương phản tốt cho chữ/viền trên nền sáng (hoặc giữ nguyên nếu nền đã tối)
const getDarkContrastColor = (color: string, themePreset?: string) => {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return '#0F3D2E';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (brightness >= 165) {
    switch (themePreset) {
      case 'easter':
        return '#3E2723'; // Màu nâu đậm phù hợp với tone Easter vàng/sáng
      case 'eucharist':
        return '#4E2A0F'; // Màu nâu đồng đậm cho Mình Thánh Chúa
      case 'christmas':
        return '#0A3B24'; // Màu xanh lá thông rất đậm
      case 'tet':
      case 'pentecost':
        return '#5C0606'; // Màu đỏ rượu vang sẫm
      default:
        return '#0F3D2E'; // Xanh phụng vụ đậm mặc định
    }
  }
  return color;
};

// Hàm tính toán màu chữ tương phản cao dựa trên độ sáng nền
const getTextContrastColor = (bgColor: string, themePreset?: string) => {
  const hex = bgColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (brightness >= 165) {
    switch (themePreset) {
      case 'easter':
        return '#3E2723';
      case 'eucharist':
        return '#4E2A0F';
      case 'christmas':
        return '#0A3B24';
      case 'tet':
      case 'pentecost':
        return '#5C0606';
      default:
        return '#0F3D2E';
    }
  } else {
    return '#FFF8E8'; // Trả về màu kem sáng để có độ ấm áp và dễ đọc tối đa trên nền tối
  }
};

// Hàm điều chỉnh độ sáng/tối của màu hex (tích cực là sáng hơn, tiêu cực là tối hơn)
const adjustColorBrightness = (hex: string, percent: number) => {
  let cleanedHex = hex.replace('#', '');
  if (cleanedHex.length === 3) {
    cleanedHex = cleanedHex.split('').map(char => char + char).join('');
  }
  if (cleanedHex.length !== 6) return hex;
  
  const num = parseInt(cleanedHex, 16);
  const amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = (num >> 8 & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;
  
  R = Math.max(0, Math.min(255, R));
  G = Math.max(0, Math.min(255, G));
  B = Math.max(0, Math.min(255, B));
  
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
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

  // DIY Audio States
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isBgmMuted, setIsBgmMuted] = useState(true); // Mặc định câm để tránh bị chặn
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const spinClickCountRef = useRef(0);

  // Share lộc động cá nhân hóa states
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareSenderName, setShareSenderName] = useState('');
  const [shareTemplate, setShareTemplate] = useState<'friend' | 'family' | 'group' | 'parish'>('friend');

  // Nhận lộc được tặng states
  const [sharedBlessingData, setSharedBlessingData] = useState<{ b: string; n: string; t: string } | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  const SHARE_TEMPLATES = {
    friend: {
      label: 'Bạn bè',
      text: (sender: string) => `Chào bạn thương mến! Nhân dịp đầu xuân năm mới, ${sender ? `${sender} ` : ''}muốn gửi tặng bạn một Lộc Lời Chúa vô cùng ý nghĩa làm kim chỉ nam cho cả năm. Hãy đón nhận Lộc Thánh tại đây nhé:`
    },
    family: {
      label: 'Gia đình',
      text: (sender: string) => `Kính chúc gia đình chúng ta một năm mới bình an, đầy tràn hồng ân Thiên Chúa. ${sender ? `Từ ${sender} - ` : ''}Xin gửi tặng cả nhà Lộc Lời Chúa soi sáng gia đình ta:`
    },
    group: {
      label: 'Đội nhóm',
      text: (sender: string) => `Thân gửi anh chị em! Chúc ban ngành/đội nhóm chúng ta một năm mới đầy tràn nhiệt huyết tông đồ. ${sender ? `${sender} ` : ''}xin gửi tặng anh chị em Lộc Lời Chúa để cùng suy niệm:`
    },
    parish: {
      label: 'Giáo xứ',
      text: (_sender: string) => `Kính chúc quý cha và quý cộng đoàn giáo xứ một năm mới khang an, thánh đức. Kính gửi Lộc Lời Chúa chúc xuân:`
    }
  };

  const encodeSharePayload = (blessingId: string, senderName: string, templateKey: string) => {
    try {
      const obj = { b: blessingId, n: senderName, t: templateKey };
      const jsonStr = JSON.stringify(obj);
      const utf8Bytes = new TextEncoder().encode(jsonStr);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64 = window.btoa(binary);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('Error encoding payload:', e);
      return '';
    }
  };

  const decodeSharePayload = (payload: string) => {
    try {
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr) as { b: string; n: string; t: string };
    } catch (e) {
      console.error('Error decoding payload:', e);
      return null;
    }
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parse s query parameter on load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sParam = searchParams.get('s');
    if (sParam) {
      const decoded = decodeSharePayload(sParam);
      if (decoded && decoded.b) {
        setSharedBlessingData(decoded);
        setIsSharedMode(true);
      }
    }
  }, []);

  const isMobile = windowWidth < 600;
  const isDesktop = windowWidth >= 1024;
  const isSmallScreen = windowWidth < 500;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isSpinningRef = useRef(false);
  const exportCardRef = useRef<HTMLDivElement | null>(null);

  // Time-based ease-out spin animation refs
  const spinStartTimeRef = useRef(0);
  const spinStartAngleRef = useRef(0);
  const spinEndAngleRef = useRef(0);
  const spinDurationRef = useRef(6000); // Configurable 6 seconds duration
  const prevAngleRef = useRef(0);
  const selectedBlessingRef = useRef<Blessing | null>(null);
  const isServerSpunRef = useRef(false);
  const animateSpinRef = useRef<() => void>(() => {});

  const getThemeColors = (preset?: string) => {
    switch (preset) {
      case 'christmas': // Giáng Sinh: Đỏ Crimson sẫm, Xanh lá thông cổ điển, Vàng Gold sang, Trắng kem tuyết, Xanh dương đêm
        return ['#A81D22', '#0D4A30', '#D4A33B', '#F7F7F7', '#0F2C59'];
      case 'tet': // Tết Nguyên Đán: Đỏ cờ hội, Vàng Hoàng kim nhạt, Hồng Đào ấm, Trắng kem sữa, Cam quýt ngọt
        return ['#B81D24', '#E5A93B', '#F3A0A7', '#FFFDF2', '#D96B27'];
      case 'easter': // Phục Sinh: Vàng nắng sớm, Trắng huệ thanh sạch, Vàng pastel dịu, Xanh lá non, Tím Phục Sinh vương giả
        return ['#F2C94C', '#FFFFFF', '#FFF3CD', '#6FCF97', '#9B51E0'];
      case 'pentecost': // Hiện Xuống (7 Ơn): Đỏ lửa rực, Cam lửa ấm, Vàng hoa cúc, Trắng kem gió thánh
        return ['#C0392B', '#D35400', '#F39C12', '#FFFDF5'];
      case 'lent': // Mùa Chay: Tím phụng vụ trầm, Tím sẫm hối cải, Oải hương tro buồn, Xám tro bụi
        return ['#6D28D9', '#4C1D95', '#A78BFA', '#9CA3AF'];
      case 'advent': // Mùa Vọng: Tím hoa cà đậm, Hồng Gaudete, Tím vương quyền, Xanh hy vọng
        return ['#701A75', '#EC4899', '#4A044E', '#047857'];
      case 'marian': // Đức Mẹ: Xanh trời dịu mát, Trắng dâng Mẹ tinh tuyền, Xanh Navy sâu thẳm, Xanh ngọc nhẹ
        return ['#3A86C8', '#FFFFFF', '#1D3557', '#A8DADC'];
      case 'joseph': // Thánh Giuse: Nâu đất sét, Nâu gỗ óc chó của thợ mộc, Vàng rơm nhạt, Trắng sữa cổ điển
        return ['#8B5A2B', '#5C3A21', '#D2B48C', '#FDF5E6'];
      case 'eucharist': // Thánh Thể: Vàng bánh thánh, Trắng ngà Mình Thánh, Vàng đồng cổ Chén Thánh, Đỏ rượu vang
        return ['#FFD700', '#FFFFFA', '#CD7F32', '#8B0000'];
      case 'gold': // Cổ Điển / Mặc Định: Xanh phụng vụ trầm & Vàng thau đánh bóng
      default:
        return ['#0E3A2F', '#D4AF37', '#1E5E4E', '#FFFBF0', '#164E3E', '#F3C63F'];
    }
  };

  const getLayoutBackground = (preset?: string) => {
    let bgUrl = wheel?.background_url || parish?.background_url || '/parish_bg.png';
    if (!wheel?.background_url && !parish?.background_url && preset && preset !== 'gold') {
      bgUrl = `/themes/bg_${preset}.png`;
    }
    return {
      backgroundImage: `url('${bgUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    };
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

      // Check for developer reset parameter
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('reset') === 'true') {
        sessionStorage.removeItem(`session_spun_blessing_${res.wheel.id}`);
        localStorage.removeItem(`spun_blessing_${res.wheel.id}`);
        
        // Clean URL
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('reset');
        const searchStr = urlParams.toString();
        const newUrl = window.location.pathname + (searchStr ? `?${searchStr}` : '');
        window.history.replaceState({}, '', newUrl);
      }

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
          const displayLen = res.wheel.display_slots && res.wheel.display_slots > 0 
            ? res.wheel.display_slots 
            : blessingsList.length;
          const slotIdx = idx % displayLen;
          const anglePerSegment = (2 * Math.PI) / displayLen;
          spinAngleRef.current = 2 * Math.PI - (slotIdx + 0.5) * anglePerSegment;
        }
      }

      // Check for share payload parameter `s` in URL
      const shareParams = new URLSearchParams(window.location.search);
      const sParam = shareParams.get('s');
      if (sParam) {
        const decoded = decodeSharePayload(sParam);
        if (decoded && decoded.b) {
          const sharedBlessing = blessingsList.find(b => b.id === decoded.b);
          if (sharedBlessing) {
            setWinnerBlessing(sharedBlessing);
            setShowWinnerModal(true);
            setSharedBlessingData(decoded);
            setIsSharedMode(true);
          }
        }
      }

      // Khởi tạo nhạc nền BGM nếu được bật
      if (res.wheel.bgm_enabled && isMountedRef.current) {
        const bgmId = res.wheel.bgm_type || 'schubert-ave-maria';
        
        let audioUrl = '';
        if (bgmId === 'custom') {
          const customUrl = res.wheel.custom_bgm_url || '';
          if (customUrl) {
            if (customUrl.startsWith('indexeddb://')) {
              try {
                const blob = await dbService.getLocalBgm(res.wheel.id);
                if (blob) {
                  audioUrl = URL.createObjectURL(blob);
                }
              } catch (err) {
                console.error('Error loading offline custom BGM:', err);
              }
            } else {
              audioUrl = customUrl;
            }
          }
          // Fallback if custom URL is empty or failed
          if (!audioUrl) {
            const activeOpt = BGM_OPTIONS[0]; // Schubert Ave Maria
            audioUrl = activeOpt.url;
          }
        } else {
          const activeOpt = BGM_OPTIONS.find(opt => opt.id === bgmId) || BGM_OPTIONS[0];
          audioUrl = activeOpt.url;
        }

        if (!bgmAudioRef.current && audioUrl) {
          const audio = new Audio(audioUrl);
          audio.volume = res.wheel.bgm_volume ?? 0.3;
          audio.loop = true;
          audio.muted = true; // Bắt đầu ở chế độ câm để tránh bị chặn
          bgmAudioRef.current = audio;
          
          audio.play()
            .then(() => {
              if (isMountedRef.current) {
                setIsBgmPlaying(true);
              }
            })
            .catch(err => {
              console.warn('BGM autoplay blocked, waiting for interaction:', err);
            });
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
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn('AudioContext resume failed:', e));
    }
    
    spinClickCountRef.current++;
    playSynthesizedSpinSFX(ctx, wheel.spin_sfx_type || 'tick', spinClickCountRef.current);
  }, [wheel]);

  const playFanfareSound = useCallback(async () => {
    if (!wheel?.enable_sound || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed in fanfare:', e);
      }
    }

    if (wheel.win_sfx_type === 'custom') {
      const customUrl = wheel.custom_win_sfx_url || '';
      let audioUrl = '';

      if (customUrl) {
        if (customUrl.startsWith('indexeddb://')) {
          try {
            const blob = await dbService.getLocalWinSfx(wheel.id);
            if (blob) {
              audioUrl = URL.createObjectURL(blob);
            }
          } catch (err) {
            console.error('Error loading custom Win SFX for playback:', err);
          }
        } else {
          audioUrl = customUrl;
        }
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.volume = 0.85;
        audio.play().catch(err => {
          console.warn('Custom Win SFX playback failed, falling back:', err);
          playSynthesizedWinSFX(ctx, 'fanfare');
        });
      } else {
        playSynthesizedWinSFX(ctx, 'fanfare');
      }
    } else {
      playSynthesizedWinSFX(ctx, wheel.win_sfx_type || 'fanfare');
    }
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
    
    const displayLen = wheel.display_slots && wheel.display_slots > 0 
      ? wheel.display_slots 
      : (blessings.length || 12);
      
    const anglePerSegment = (2 * Math.PI) / displayLen;
    const colors = getThemeColors(wheel.theme_preset);
    const displayType = wheel.slot_display_type || 'mixed';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinAngleRef.current);

    for (let i = 0; i < displayLen; i++) {
      const startAng = i * anglePerSegment;
      ctx.beginPath();
      
      const baseColor = colors[i % colors.length];
      const lightColor = baseColor === '#FFFFFF' ? '#FFFFFF' : adjustColorBrightness(baseColor, 15);
      const darkColor = baseColor === '#FFFFFF' ? '#EAEAEA' : adjustColorBrightness(baseColor, -20);
      
      const grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      grad.addColorStop(0, lightColor);
      grad.addColorStop(0.55, baseColor);
      grad.addColorStop(1, darkColor);
      
      ctx.fillStyle = grad;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, startAng, startAng + anglePerSegment);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = '#FFEAA7';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Text/Icon rendering
      ctx.save();
      ctx.fillStyle = getTextContrastColor(colors[i % colors.length], wheel.theme_preset);
      ctx.rotate(startAng + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      let text = '';
      let fontSize = '14px';
      
      if (displayType === 'text') {
        if (blessings.length > 0) {
          text = blessings[i % blessings.length].category || `Mục ${i + 1}`;
        } else {
          text = `Mục ${i + 1}`;
        }
        if (displayLen > 30) {
          const numMatch = text.match(/\d+/);
          text = numMatch ? numMatch[0] : `${i + 1}`;
          fontSize = displayLen > 80 ? '9px' : displayLen > 50 ? '11px' : '12px';
        } else {
          fontSize = displayLen > 20 ? '11px' : '13px';
        }
      } else if (displayType === 'number') {
        text = String(i + 1);
        fontSize = displayLen > 20 ? '13px' : '16px';
      } else if (displayType === 'icon') {
        text = RELIGIOUS_ICONS[i % RELIGIOUS_ICONS.length];
        fontSize = '18px';
      } else {
        // Mixed: xen kẽ Số và Biểu tượng
        if (i % 2 === 0) {
          text = String(i + 1);
          fontSize = '15px';
        } else {
          text = RELIGIOUS_ICONS[Math.floor(i / 2) % RELIGIOUS_ICONS.length];
          fontSize = '18px';
        }
      }
      
      ctx.font = `bold ${fontSize} 'Be Vietnam Pro', sans-serif`;
      ctx.fillText(text, r - 20, 0);
      ctx.restore();
    }

    // Draw a golden outer border around the segments
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.restore();

    // Draw center pin hub
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 45);
    hubGrad.addColorStop(0, '#FFEFA6');
    hubGrad.addColorStop(0.4, '#D4AF37');
    hubGrad.addColorStop(0.8, '#AA7C11');
    hubGrad.addColorStop(1, '#5C4308');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
    const innerCoreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
    const primaryColor = getThemeColors(wheel.theme_preset)[0];
    innerCoreGrad.addColorStop(0, adjustColorBrightness(primaryColor, 15));
    innerCoreGrad.addColorStop(1, adjustColorBrightness(primaryColor, -10));
    ctx.fillStyle = innerCoreGrad;
    ctx.fill();
    ctx.strokeStyle = '#FFEFA6';
    ctx.lineWidth = 1;
    ctx.stroke();
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
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, [fetchWheelData]);

  // Tự động bỏ câm và phát nhạc nền BGM khi có tương tác click/touch đầu tiên trên màn hình
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (wheel && wheel.bgm_enabled && bgmAudioRef.current) {
        const audio = bgmAudioRef.current;
        if (audio.muted) {
          initAudio();
          audio.muted = false;
          audio.play()
            .then(() => {
              setIsBgmPlaying(true);
              setIsBgmMuted(false);
            })
            .catch(err => console.warn('BGM interaction play failed:', err));
        }
      }
      // Loại bỏ lắng nghe sau tương tác đầu tiên
      document.removeEventListener('click', handleFirstUserInteraction);
      document.removeEventListener('touchstart', handleFirstUserInteraction);
    };

    document.addEventListener('click', handleFirstUserInteraction);
    document.addEventListener('touchstart', handleFirstUserInteraction);

    return () => {
      document.removeEventListener('click', handleFirstUserInteraction);
      document.removeEventListener('touchstart', handleFirstUserInteraction);
    };
  }, [wheel, initAudio]);

  useEffect(() => {
    if (!isLoading && canvasRef.current && blessings.length > 0 && wheel) {
      drawWheel();
    }
  }, [isLoading, blessings, wheel, drawWheel]);

  const handleWinningBlessing = useCallback((item: Blessing, skipRecordSpin: boolean = false) => {
    if (!wheel) return;
    playFanfareSound();
    if (wheel.enable_confetti) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    if (!skipRecordSpin) {
      dbService.recordSpin(wheel.id, item.category, item.id);
    }
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

  const animateSpin = useCallback(() => {
    if (!isMountedRef.current || !wheel) return;

    const now = performance.now();
    const elapsed = now - spinStartTimeRef.current;
    const progress = Math.min(elapsed / spinDurationRef.current, 1);

    // Cubic ease-out interpolation function
    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    const t = easeOutCubic(progress);
    const currentAngle = spinStartAngleRef.current + (spinEndAngleRef.current - spinStartAngleRef.current) * t;
    spinAngleRef.current = currentAngle;

    const displayLen = wheel.display_slots && wheel.display_slots > 0 
      ? wheel.display_slots 
      : (blessings.length || 12);
      
    const anglePerSegment = (2 * Math.PI) / displayLen;

    // Play tick sound when crossing segment boundaries during rotation
    const prevSegment = Math.floor(prevAngleRef.current / anglePerSegment);
    const currSegment = Math.floor(currentAngle / anglePerSegment);
    if (prevSegment !== currSegment) {
      playTickSound();
    }

    prevAngleRef.current = currentAngle;
    drawWheel();

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animateSpinRef.current();
      });
    } else {
      // Stopped exactly at the target position!
      if (isMountedRef.current) {
        setIsSpinning(false);
        isSpinningRef.current = false;
      }
      
      // Normalize angle to keep it within [0, 2pi) for subsequent spins
      spinAngleRef.current = ((spinAngleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      drawWheel();

      // Display the winning blessing modal and trigger confetti upon stopping
      const item = selectedBlessingRef.current;
      if (isMountedRef.current && item) {
        setWinnerBlessing(item);
        handleWinningBlessing(item, isServerSpunRef.current);
      }
    }
  }, [blessings, playTickSound, drawWheel, handleWinningBlessing, wheel]);

  useEffect(() => {
    animateSpinRef.current = animateSpin;
  }, [animateSpin]);

  const handleStartSpin = useCallback(async () => {
    if (isSpinningRef.current || isSpinning || blessings.length < 2 || !wheel) return;
    initAudio();

    // Kích hoạt BGM nếu được bật và đang bị browser block/mute
    if (wheel.bgm_enabled && bgmAudioRef.current && bgmAudioRef.current.muted) {
      bgmAudioRef.current.muted = false;
      bgmAudioRef.current.play()
        .then(() => {
          setIsBgmPlaying(true);
          setIsBgmMuted(false);
        })
        .catch(e => console.warn('BGM play on spin error:', e));
    }

    spinClickCountRef.current = 0; // Reset số click nhịp để Harp gảy nốt đầu tiên

    isSpinningRef.current = true;
    setIsSpinning(true);
    setShowWinnerModal(false);

    try {
      // 1. Get device fingerprint and session user
      const fingerprint = await getDeviceFingerprint();
      let session_token = '';
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        session_token = sessionData?.session?.access_token || '';
      }

      // 2. Call /api/spin to fetch result
      let blessing: Blessing | null = null;
      let targetAngle = 0;
      
      try {
        const response = await fetch('/api/spin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wheel_id: wheel.id,
            fingerprint,
            session_token,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorData.message || `Lỗi HTTP ${response.status}`;
          throw { isServerError: true, message: errorMsg };
        }

        const data = await response.json();
        blessing = data.blessing;
        targetAngle = data.target_angle;
        isServerSpunRef.current = true;
      } catch (apiError: any) {
        if (apiError && apiError.isServerError) {
          throw new Error(apiError.message);
        }
        
        console.warn('API call failed, falling back to local RNG selection:', apiError);
        
        // Local RNG fallback (only if offline or network connection fails)
        const randomIdx = Math.floor(Math.random() * blessings.length);
        const fallbackBlessing = blessings[randomIdx];
        
        if (!fallbackBlessing) {
          throw new Error('Không thể chọn lộc.');
        }
        
        blessing = fallbackBlessing;
        isServerSpunRef.current = false;
        
        // Calculate target angle locally
        const displayLen = wheel.display_slots && wheel.display_slots > 0 
          ? wheel.display_slots 
          : blessings.length;
        const slotIdx = randomIdx % displayLen;
        const anglePerSegment = (2 * Math.PI) / displayLen;
        
        // Stop at center of the segment
        targetAngle = 2 * Math.PI - (slotIdx + 0.5) * anglePerSegment;
      }

      if (!blessing) {
        throw new Error('Lộc nhận được không hợp lệ.');
      }

      // 3. Set animation targets
      selectedBlessingRef.current = blessing;
      
      const startAngle = spinAngleRef.current;
      spinStartAngleRef.current = startAngle;
      
      // Calculate endAngle: rotate a minimum of 8 full rotations and stop EXACTLY at targetAngle
      const startAngleNormalized = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const targetAngleNormalized = ((targetAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      let diff = targetAngleNormalized - startAngleNormalized;
      if (diff < 0) {
        diff += 2 * Math.PI;
      }
      
      const minRotations = 8;
      spinEndAngleRef.current = startAngle + minRotations * 2 * Math.PI + diff;
      
      prevAngleRef.current = startAngle;
      spinStartTimeRef.current = performance.now();
      
      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(() => {
        animateSpinRef.current();
      });

    } catch (err: any) {
      console.error('Spin initialization error:', err);
      showToast(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      isSpinningRef.current = false;
      setIsSpinning(false);
    }
  }, [isSpinning, blessings, wheel, initAudio, showToast]);

  const handleToggleBgm = useCallback(() => {
    if (!bgmAudioRef.current) return;
    const audio = bgmAudioRef.current;
    
    initAudio();
    
    if (isBgmMuted) {
      audio.muted = false;
      if (audio.paused) {
        audio.play()
          .then(() => setIsBgmPlaying(true))
          .catch(e => console.warn(e));
      }
      setIsBgmMuted(false);
      showToast('Đã bật nhạc nền Thánh ca');
    } else {
      audio.muted = true;
      setIsBgmMuted(true);
      showToast('Đã tắt nhạc nền');
    }
  }, [isBgmMuted, initAudio, showToast]);

  const handleCopyBlessing = useCallback((text: string, quote?: string) => {
    const copyText = `🙏 LỘC LỜI CHÚA 🙏\n\n“ ${text} ”${
      quote ? `\n— ${quote}` : ''
    }\n\nChúc mừng bạn đã nhận được Lộc Thánh từ ${
      parish?.name || 'Giáo xứ'
    }!\nNguyện xin Lời Chúa soi sáng, nâng đỡ và tuôn đổ hồng ân trên quý vị cùng gia quyến.\n\n✨ Đón nhận Lộc Lời Chúa của bạn tại:\n🔗 ${
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
    const borderGold = wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1];
    const primaryDark = getDarkContrastColor(presetColors[0], wheel.theme_preset);
    const cardBorderColor = getDarkContrastColor(borderGold, wheel.theme_preset);

    const cardContent = (
      <div
        className="winner-card"
        onClick={isModal ? (e) => e.stopPropagation() : undefined}
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 253, 246, 0.78) 0%, rgba(255, 245, 219, 0.68) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${cardBorderColor}`,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45), 0 0 40px rgba(216, 180, 63, 0.12)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '430px',
          position: isModal ? 'relative' : undefined,
          flexShrink: isModal ? undefined : 0,
          flex: isModal ? undefined : 1,
          boxSizing: 'border-box'
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
              border: `1.5px solid ${cardBorderColor}`,
              color: primaryDark,
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

        {/* Inner border style with 4px margin to create double frame */}
        <div
          style={{
            border: `1px solid ${cardBorderColor}a0`,
            borderRadius: '16px',
            padding: '4px',
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              border: `1.5px solid ${cardBorderColor}`,
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
              justifyContent: 'center',
              flex: 1
            }}
          >
            {/* Decorative Corner Ornaments */}
            <CornerOrnamentSVG
              style={{ top: '8px', left: '8px', color: cardBorderColor }}
              isChristmas={wheel.theme_preset === 'christmas'}
            />
            <CornerOrnamentSVG
              style={{
                top: '8px',
                right: '8px',
                transform: 'scaleX(-1)',
                color: cardBorderColor
              }}
              isChristmas={wheel.theme_preset === 'christmas'}
            />
            <CornerOrnamentSVG
              style={{
                bottom: '8px',
                left: '8px',
                transform: 'scaleY(-1)',
                color: cardBorderColor
              }}
              isChristmas={wheel.theme_preset === 'christmas'}
            />
            <CornerOrnamentSVG
              style={{
                bottom: '8px',
                right: '8px',
                transform: 'scaleX(-1) scaleY(-1)',
                color: cardBorderColor
              }}
              isChristmas={wheel.theme_preset === 'christmas'}
            />

            {/* Cross SVG icon */}
            <svg
              viewBox="0 0 24 24"
              width="40"
              height="40"
              style={{ color: cardBorderColor, marginBottom: '12px' }}
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
                color: primaryDark,
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
                color: primaryDark,
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
                  background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)`
                }}
              ></div>
              <span style={{ color: cardBorderColor, fontSize: '10px' }}>✦</span>
              <div
                style={{
                  height: '1px',
                  flex: 1,
                  background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)`
                }}
              ></div>
            </div>

            {/* Category Badge */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: getTextContrastColor(presetColors[0], wheel.theme_preset),
                background: presetColors[0],
                padding: '6px 16px',
                borderRadius: '20px',
                marginBottom: '20px',
                border: `1.5px solid ${cardBorderColor}`,
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
                  color: primaryDark,
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
                background: `linear-gradient(to right, transparent, ${cardBorderColor}80, transparent)`,
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
                opacity: 0.85,
                whiteSpace: 'pre-line'
              }}
            >
              {parish?.greeting || 'Kính chúc quý cộng đoàn một năm mới bình an,\nđầy tràn ân sủng của Thiên Chúa!'}
            </p>

            {/* Subtle branding signature inside card */}
            <div
              style={{
                marginTop: '16px',
                fontSize: '9px',
                color: `${cardBorderColor}a0`,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 700,
                opacity: 0.8
              }}
            >
              Vòng Quay Lời Chúa • giochacho.vn
            </div>

            {/* Integrated Controls (Not captured in image export) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '24px',
                borderTop: `1px solid ${cardBorderColor}30`,
                paddingTop: '16px',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%' }}>
                <button
                  onClick={() => handleCopyBlessing(winnerBlessing.text, winnerBlessing.quote)}
                  className="copy-blessing-btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    height: '42px',
                    borderRadius: '12px',
                    background: `${primaryDark}0D`,
                    border: `1px solid ${primaryDark}25`,
                    color: primaryDark,
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
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
                    height: '42px',
                    borderRadius: '12px',
                    background: presetColors[0],
                    color: getTextContrastColor(presetColors[0], wheel.theme_preset),
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: `0 4px 12px ${presetColors[0]}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  <Download size={15} />
                  Lưu ảnh Lộc
                </button>
              </div>

              {/* Nút gửi tặng Lộc Thánh */}
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="btn btn-primary btn-gold"
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D8B43F 0%, #F59E0B 100%)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  marginTop: '4px'
                }}
              >
                <Share2 size={16} />
                <span>Gửi Tặng Lộc Lời Chúa</span>
              </button>

              {/* Panel Chia Sẻ Lộc Thánh */}
              {showSharePanel && (
                <div style={{
                  marginTop: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(216, 180, 63, 0.35)',
                  borderRadius: '12px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '10px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: primaryDark, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gift size={13} className="text-gold" />
                    <span>CÁ NHÂN HÓA ĐỂ GỬI TẶNG</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                        Tên người gửi (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Giuse Hùng..."
                        value={shareSenderName}
                        onChange={(e) => setShareSenderName(e.target.value)}
                        style={{
                          width: '100%',
                          height: '32px',
                          padding: '0 8px',
                          fontSize: '11.5px',
                          border: '1.5px solid rgba(15, 61, 46, 0.15)',
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#4B5563', display: 'block', marginBottom: '2px' }}>
                        Đối tượng nhận
                      </label>
                      <select
                        value={shareTemplate}
                        onChange={(e) => setShareTemplate(e.target.value as any)}
                        style={{
                          width: '100%',
                          height: '32px',
                          padding: '0 4px',
                          fontSize: '11.5px',
                          border: '1.5px solid rgba(15, 61, 46, 0.15)',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          boxSizing: 'border-box'
                        }}
                      >
                        {(Object.keys(SHARE_TEMPLATES) as Array<keyof typeof SHARE_TEMPLATES>).map((tKey) => (
                          <option key={tKey} value={tKey}>
                            {SHARE_TEMPLATES[tKey].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        const payload = encodeSharePayload(winnerBlessing.id, shareSenderName, shareTemplate);
                        const link = `${window.location.origin}${window.location.pathname}?s=${payload}`;
                        const fullMessage = `${SHARE_TEMPLATES[shareTemplate].text(shareSenderName)}\n🔗 ${link}`;
                        navigator.clipboard.writeText(fullMessage);
                        showToast('Đã sao chép link Lộc Thánh!');
                      }}
                      style={{
                        height: '32px',
                        borderRadius: '6px',
                        background: primaryDark,
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Copy size={11} />
                      Sao chép link
                    </button>

                    <a
                      href={`https://sp.zalo.me/share_to_zalo?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?s=${encodeSharePayload(winnerBlessing.id, shareSenderName, shareTemplate)}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        height: '32px',
                        borderRadius: '6px',
                        background: '#0068FF',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Z</span>
                      Chia sẻ Zalo
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?s=${encodeSharePayload(winnerBlessing.id, shareSenderName, shareTemplate)}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        height: '32px',
                        borderRadius: '6px',
                        background: '#1877F2',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>f</span>
                      Facebook
                    </a>

                    {navigator.share ? (
                      <button
                        onClick={async () => {
                          const payload = encodeSharePayload(winnerBlessing.id, shareSenderName, shareTemplate);
                          const link = `${window.location.origin}${window.location.pathname}?s=${payload}`;
                          const fullMessage = `${SHARE_TEMPLATES[shareTemplate].text(shareSenderName)}`;
                          try {
                            await navigator.share({
                              title: 'Lộc Lời Chúa gửi tặng bạn',
                              text: fullMessage,
                              url: link
                            });
                          } catch (err) {
                            console.log('Web Share API error:', err);
                          }
                        }}
                        style={{
                          height: '32px',
                          borderRadius: '6px',
                          background: '#F59E0B',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Share2 size={11} />
                        Khác
                      </button>
                    ) : (
                      <div style={{ fontSize: '9px', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 4px', lineHeight: '1.2' }}>
                        * Chọn Zalo/FB để gửi tặng
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!lockedBlessing || isModal) && (
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    if (!isModal) setWinnerBlessing(null);
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: '#4B5563',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return isModal ? (
      <div className="modal-overlay" onClick={() => setShowWinnerModal(false)}>
        {cardContent}
      </div>
    ) : (
      <>
        {cardContent}
        {/* Hidden solid wrapper for html2canvas export */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            pointerEvents: 'none'
          }}
        >
          <div
            ref={exportCardRef}
            className="winner-export-container"
            style={{
              background: 'linear-gradient(135deg, #FFFDF6 0%, #FFF9EC 50%, #FFF4DE 100%)',
              padding: '20px',
              position: 'relative',
              borderRadius: '24px',
              border: `1.5px solid ${cardBorderColor}`,
              boxSizing: 'border-box',
              width: '430px'
            }}
          >
            <div
              style={{
                border: `1px solid ${cardBorderColor}a0`,
                borderRadius: '16px',
                padding: '4px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div
                style={{
                  border: `1.5px solid ${cardBorderColor}`,
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
                <CornerOrnamentSVG
                  style={{ top: '8px', left: '8px', color: cardBorderColor }}
                  isChristmas={wheel.theme_preset === 'christmas'}
                />
                <CornerOrnamentSVG
                  style={{
                    top: '8px',
                    right: '8px',
                    transform: 'scaleX(-1)',
                    color: cardBorderColor
                  }}
                  isChristmas={wheel.theme_preset === 'christmas'}
                />
                <CornerOrnamentSVG
                  style={{
                    bottom: '8px',
                    left: '8px',
                    transform: 'scaleY(-1)',
                    color: cardBorderColor
                  }}
                  isChristmas={wheel.theme_preset === 'christmas'}
                />
                <CornerOrnamentSVG
                  style={{
                    bottom: '8px',
                    right: '8px',
                    transform: 'scaleX(-1) scaleY(-1)',
                    color: cardBorderColor
                  }}
                  isChristmas={wheel.theme_preset === 'christmas'}
                />

                <svg
                  viewBox="0 0 24 24"
                  width="40"
                  height="40"
                  style={{ color: cardBorderColor, marginBottom: '12px' }}
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
                    color: primaryDark,
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
                    color: primaryDark,
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
                      background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)`
                    }}
                  ></div>
                  <span style={{ color: cardBorderColor, fontSize: '10px' }}>✦</span>
                  <div
                    style={{
                      height: '1px',
                      flex: 1,
                      background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)`
                    }}
                  ></div>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: getTextContrastColor(presetColors[0], wheel.theme_preset),
                    background: presetColors[0],
                    padding: '6px 16px',
                    borderRadius: '20px',
                    marginBottom: '20px',
                    border: `1.5px solid ${cardBorderColor}`,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {winnerBlessing.category}
                </div>

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
                      color: primaryDark,
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
                    background: `linear-gradient(to right, transparent, ${cardBorderColor}80, transparent)`,
                    margin: '0 auto 16px auto'
                  }}
                ></div>

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

                <div
                  style={{
                    marginTop: '16px',
                    fontSize: '9px',
                    color: `${cardBorderColor}a0`,
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
        </div>
      </>
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

  if (isSharedMode && winnerBlessing) {
    const textLength = winnerBlessing.text?.length || 0;
    const fontSize = textLength > 150 ? '14px' : textLength > 100 ? '15.5px' : '17.5px';
    const presetColors = getThemeColors(wheel.theme_preset);
    const borderGold = wheel.theme_preset === 'christmas' ? '#F59E0B' : presetColors[1];
    const primaryDark = getDarkContrastColor(presetColors[0], wheel.theme_preset);
    const cardBorderColor = getDarkContrastColor(borderGold, wheel.theme_preset);
    const greetingText = sharedBlessingData ? SHARE_TEMPLATES[sharedBlessingData.t as keyof typeof SHARE_TEMPLATES]?.text(sharedBlessingData.n) : '';

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
          padding: '24px 12px',
          color: '#FFFFFF'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px', maxWidth: '430px', background: 'rgba(255, 255, 255, 0.95)', padding: '16px', borderRadius: '16px', border: `1px solid ${borderGold}`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', color: primaryDark }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ background: presetColors[0], color: '#FFFFFF', padding: '8px', borderRadius: '50%' }}>
              <Gift size={24} />
            </div>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Bạn nhận được Lộc Thánh gửi tặng
          </h3>
          {sharedBlessingData?.n && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', margin: '4px 0' }}>
              Người gửi: <strong>{sharedBlessingData.n}</strong>
            </p>
          )}
          {greetingText && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-dark)', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.4', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px' }}>
              "{greetingText.replace(/:\s*$/, '')}"
            </p>
          )}
        </div>

        {/* Card phẳng xem lộc */}
        <div style={{ width: '100%', maxWidth: '430px', display: 'flex', justifyContent: 'center' }}>
          <div
            className="winner-card"
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 253, 246, 0.95) 0%, rgba(255, 245, 219, 0.9) 100%)',
              borderRadius: '24px',
              border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${cardBorderColor}`,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ border: `1px solid ${cardBorderColor}a0`, borderRadius: '16px', padding: '4px', boxSizing: 'border-box', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ border: `1.5px solid ${cardBorderColor}`, borderRadius: '12px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', boxSizing: 'border-box', width: '100%', minHeight: '380px', justifyContent: 'center' }}>
                <CornerOrnamentSVG style={{ top: '8px', left: '8px', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                <CornerOrnamentSVG style={{ top: '8px', right: '8px', transform: 'scaleX(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                <CornerOrnamentSVG style={{ bottom: '8px', left: '8px', transform: 'scaleY(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                <CornerOrnamentSVG style={{ bottom: '8px', right: '8px', transform: 'scaleX(-1) scaleY(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />

                <svg viewBox="0 0 24 24" width="40" height="40" style={{ color: cardBorderColor, marginBottom: '12px' }} fill="currentColor">
                  <path d="M12,5 A1.2,1.2 0 1,1 12,2.6 A1.2,1.2 0 1,1 12,5 Z" />
                  <path d="M5,12 A1.2,1.2 0 1,1 2.6,12 A1.2,1.2 0 1,1 5,12 Z" />
                  <path d="M21.4,12 A1.2,1.2 0 1,1 19,12 A1.2,1.2 0 1,1 21.4,12 Z" />
                  <path d="M11,5 L13,5 L13,11 L19,11 L19,13 L13,13 L13,19 C13,19.6 12.6,20.1 12,20.1 C11.4,20.1 10.9,19.6 10.9,19 L10.9,13 L5,13 L5,11 L11,11 Z" />
                  <path d="M12,8.5 L15.5,12 L12,15.5 L8.5,12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </svg>

                <div style={{ color: primaryDark, fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
                  {parish?.name}
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 800, color: primaryDark, margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
                  LỘC LỜI CHÚA
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', width: '70%', margin: '0 auto 16px auto', gap: '8px' }}>
                  <div style={{ height: '1px', flex: 1, background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)` }}></div>
                  <span style={{ color: cardBorderColor, fontSize: '10px' }}>✦</span>
                  <div style={{ height: '1px', flex: 1, background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)` }}></div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 800, color: getTextContrastColor(presetColors[0], wheel.theme_preset), background: presetColors[0], padding: '6px 16px', borderRadius: '20px', marginBottom: '20px', border: `1.5px solid ${cardBorderColor}`, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  {winnerBlessing.category}
                </div>

                <p className="text-serif" style={{ fontSize, lineHeight: '1.65', color: '#1A202C', fontStyle: 'italic', margin: '8px 0 12px 0', padding: '0 10px', fontWeight: 500 }}>
                  “ {winnerBlessing.text} ”
                </p>

                {winnerBlessing.quote && (
                  <p className="text-serif" style={{ fontWeight: '700', fontSize: '14px', color: primaryDark, marginTop: '4px', marginBottom: '20px', fontStyle: 'italic' }}>
                    — {winnerBlessing.quote}
                  </p>
                )}

                <div style={{ height: '1px', width: '35%', background: `linear-gradient(to right, transparent, ${cardBorderColor}80, transparent)`, margin: '0 auto 16px auto' }}></div>

                <p style={{ fontSize: '11px', color: 'var(--color-text-dark)', fontWeight: '500', fontStyle: 'italic', lineHeight: '1.5', margin: 0, opacity: 0.85, whiteSpace: 'pre-line' }}>
                  {parish?.greeting || 'Kính chúc quý cộng đoàn một năm mới bình an,\nđầy tràn ân sủng của Thiên Chúa!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nút CTA quay lộc của tôi */}
        <button
          onClick={() => {
            window.location.href = window.location.origin + window.location.pathname;
          }}
          style={{
            marginTop: '24px',
            padding: '12px 28px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #D8B43F 0%, #F59E0B 100%)',
            color: '#FFFFFF',
            border: `1.5px solid ${cardBorderColor}`,
            fontWeight: '800',
            fontSize: '15px',
            boxShadow: '0 8px 20px rgba(216, 180, 63, 0.35)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.15s ease'
          }}
        >
          <RefreshCw size={16} />
          Tự Đón Nhận Lộc Cho Riêng Tôi
        </button>

        {/* Nút tải ảnh và copy chữ cho lộc được tặng */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', width: '100%', maxWidth: '430px' }}>
          <button
            onClick={() => handleCopyBlessing(winnerBlessing.text, winnerBlessing.quote)}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Copy size={14} />
            Sao chép chữ
          </button>
          
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
            <div
              ref={exportCardRef}
              className="winner-export-container"
              style={{
                background: 'linear-gradient(135deg, #FFFDF6 0%, #FFF9EC 50%, #FFF4DE 100%)',
                padding: '20px',
                position: 'relative',
                borderRadius: '24px',
                border: `1.5px solid ${cardBorderColor}`,
                boxSizing: 'border-box',
                width: '430px'
              }}
            >
              <div style={{ border: `1px solid ${cardBorderColor}a0`, borderRadius: '16px', padding: '4px', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ border: `1.5px solid ${cardBorderColor}`, borderRadius: '12px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', boxSizing: 'border-box', width: '100%', minHeight: '380px', justifyContent: 'center' }}>
                  <CornerOrnamentSVG style={{ top: '8px', left: '8px', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                  <CornerOrnamentSVG style={{ top: '8px', right: '8px', transform: 'scaleX(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                  <CornerOrnamentSVG style={{ bottom: '8px', left: '8px', transform: 'scaleY(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                  <CornerOrnamentSVG style={{ bottom: '8px', right: '8px', transform: 'scaleX(-1) scaleY(-1)', color: cardBorderColor }} isChristmas={wheel.theme_preset === 'christmas'} />
                  <svg viewBox="0 0 24 24" width="40" height="40" style={{ color: cardBorderColor, marginBottom: '12px' }} fill="currentColor">
                    <path d="M12,5 A1.2,1.2 0 1,1 12,2.6 A1.2,1.2 0 1,1 12,5 Z" />
                    <path d="M5,12 A1.2,1.2 0 1,1 2.6,12 A1.2,1.2 0 1,1 5,12 Z" />
                    <path d="M21.4,12 A1.2,1.2 0 1,1 19,12 A1.2,1.2 0 1,1 21.4,12 Z" />
                    <path d="M11,5 L13,5 L13,11 L19,11 L19,13 L13,13 L13,19 C13,19.6 12.6,20.1 12,20.1 C11.4,20.1 10.9,19.6 10.9,19 L10.9,13 L5,13 L5,11 L11,11 Z" />
                    <path d="M12,8.5 L15.5,12 L12,15.5 L8.5,12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                  <div style={{ color: primaryDark, fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
                    {parish?.name}
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 800, color: primaryDark, margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
                    LỘC LỜI CHÚA
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', width: '70%', margin: '0 auto 16px auto', gap: '8px' }}>
                    <div style={{ height: '1px', flex: 1, background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)` }}></div>
                    <span style={{ color: cardBorderColor, fontSize: '10px' }}>✦</span>
                    <div style={{ height: '1px', flex: 1, background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)` }}></div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: getTextContrastColor(presetColors[0], wheel.theme_preset), background: presetColors[0], padding: '6px 16px', borderRadius: '20px', marginBottom: '20px', border: `1.5px solid ${cardBorderColor}`, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                    {winnerBlessing.category}
                  </div>
                  <p className="text-serif" style={{ fontSize, lineHeight: '1.65', color: '#1A202C', fontStyle: 'italic', margin: '8px 0 12px 0', padding: '0 10px', fontWeight: 500 }}>
                    “ {winnerBlessing.text} ”
                  </p>
                  {winnerBlessing.quote && (
                    <p className="text-serif" style={{ fontWeight: '700', fontSize: '14px', color: primaryDark, marginTop: '4px', marginBottom: '20px', fontStyle: 'italic' }}>
                      — {winnerBlessing.quote}
                    </p>
                  )}
                  <div style={{ height: '1px', width: '35%', background: `linear-gradient(to right, transparent, ${cardBorderColor}80, transparent)`, margin: '0 auto 16px auto' }}></div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-dark)', fontWeight: '500', fontStyle: 'italic', lineHeight: '1.5', margin: 0, opacity: 0.85, whiteSpace: 'pre-line' }}>
                    {parish?.greeting || 'Kính chúc quý cộng đoàn một năm mới bình an,\nđầy tràn ân sủng của Thiên Chúa!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPNG}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '12px',
              background: presetColors[0],
              color: getTextContrastColor(presetColors[0], wheel.theme_preset),
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            Lưu ảnh Lộc
          </button>
        </div>

        {toast && <div className="toast-notification">{toast}</div>}
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
        padding: isSmallScreen ? '12px 0' : '32px 12px',
        color: '#FFFFFF'
      }}
    >
      {/* Outer Row/Column Layout wrapper */}
      <div
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'stretch' : 'center',
          justifyContent: 'center',
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: isDesktop 
            ? (showWinnerModal && winnerBlessing ? '1000px' : '540px')
            : '500px',
          margin: '0 auto',
          paddingBottom: isAdClosed ? '0' : '60px'
        }}
      >
        {/* Wheel Card wrapper (Holy Card) */}
        <div
          style={{
            flex: 1,
            width: isSmallScreen ? 'calc(100% - 24px)' : '100%',
            margin: isSmallScreen ? '12px' : '0',
            display: 'flex',
            flexDirection: 'column',
            border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${borderGold}`,
            borderRadius: isSmallScreen ? '16px' : '20px',
            padding: isSmallScreen ? '16px' : '24px 20px',
            background: 'radial-gradient(circle at center, rgba(255, 253, 246, 0.76) 0%, rgba(255, 245, 219, 0.62) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: 'var(--color-text-dark)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 40px rgba(216, 180, 63, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Corner Ornaments */}
          <CornerOrnamentSVG
            style={{
              top: isSmallScreen ? '8px' : '12px',
              left: isSmallScreen ? '8px' : '12px',
              color: borderGold
            }}
            isChristmas={wheel.theme_preset === 'christmas'}
          />
          <CornerOrnamentSVG
            style={{
              top: isSmallScreen ? '8px' : '12px',
              right: isSmallScreen ? '8px' : '12px',
              transform: 'scaleX(-1)',
              color: borderGold
            }}
            isChristmas={wheel.theme_preset === 'christmas'}
          />
          <CornerOrnamentSVG
            style={{
              bottom: isSmallScreen ? '8px' : '12px',
              left: isSmallScreen ? '8px' : '12px',
              transform: 'scaleY(-1)',
              color: borderGold
            }}
            isChristmas={wheel.theme_preset === 'christmas'}
          />
          <CornerOrnamentSVG
            style={{
              bottom: isSmallScreen ? '8px' : '12px',
              right: isSmallScreen ? '8px' : '12px',
              transform: 'scaleX(-1) scaleY(-1)',
              color: getDarkContrastColor(borderGold, wheel.theme_preset)
            }}
            isChristmas={wheel.theme_preset === 'christmas'}
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
                color: getTextContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
                border: `2px solid ${getDarkContrastColor(getThemeColors(wheel.theme_preset)[1], wheel.theme_preset)}`,
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
                color: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
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
                color: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
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
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                padding: '8px',
                borderColor: wheel.theme_preset === 'christmas' ? '#F59E0B' : getDarkContrastColor(getThemeColors(wheel.theme_preset)[1], wheel.theme_preset),
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
                className={`wheel-pointer ${isSpinning ? 'pointer-spinning' : ''}`}
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
                    color: wheel.theme_preset === 'christmas' ? '#9E1B1B' : getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
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
                  className={`spin-center-btn ${!isSpinning ? 'btn-pulse' : ''}`}
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
                    color: wheel.theme_preset === 'christmas' ? '#9E1B1B' : getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
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
                  color: getTextContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset),
                  border: `1.5px solid ${getDarkContrastColor(getThemeColors(wheel.theme_preset)[1], wheel.theme_preset)}`,
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
                <Church size={16} style={{ color: getTextContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset) }} />
                Xem lại Lộc Thánh của bạn
              </button>
            </div>
          )}
        </div>

        {/* Right/Bottom: Blessing Result Card (Inline on Desktop & Tablet, hidden otherwise) */}
        {!isMobile && showWinnerModal && winnerBlessing && renderBlessingCard(false)}
      </div>

      {/* Render winner modal overlay on mobile viewports */}
      {isMobile && showWinnerModal && winnerBlessing && renderBlessingCard(true)}

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

      {/* Floating BGM control button */}
      {wheel && wheel.bgm_enabled && (
        <>
          <style>{`
            @keyframes musicWaveBounce {
              0% { height: 4px; }
              100% { height: 16px; }
            }
          `}</style>
          <button
            onClick={handleToggleBgm}
            title={isBgmMuted ? "Bật nhạc nền Thánh ca" : "Tắt nhạc nền"}
            style={{
              position: 'fixed',
              bottom: isAdClosed ? '24px' : '82px',
              right: '24px',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, rgba(255, 253, 246, 0.9) 0%, rgba(255, 245, 219, 0.85) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1.5px solid ${getDarkContrastColor(getThemeColors(wheel.theme_preset)[1], wheel.theme_preset)}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 12px rgba(216, 180, 63, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease',
              padding: 0
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.28), 0 0 16px rgba(216, 180, 63, 0.35)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 12px rgba(216, 180, 63, 0.2)';
            }}
          >
            {isBgmMuted ? (
              <VolumeX size={20} style={{ color: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset) }} />
            ) : isBgmPlaying ? (
              <div style={{ display: 'flex', gap: '2.5px', alignItems: 'flex-end', height: '16px', width: '20px', justifyContent: 'center' }}>
                <span style={{ width: '3px', height: '12px', backgroundColor: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset), borderRadius: '1px', animation: 'musicWaveBounce 0.8s infinite ease-in-out alternate' }} />
                <span style={{ width: '3px', height: '6px', backgroundColor: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset), borderRadius: '1px', animation: 'musicWaveBounce 0.8s infinite ease-in-out alternate 0.2s' }} />
                <span style={{ width: '3px', height: '14px', backgroundColor: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset), borderRadius: '1px', animation: 'musicWaveBounce 0.8s infinite ease-in-out alternate 0.4s' }} />
                <span style={{ width: '3px', height: '8px', backgroundColor: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset), borderRadius: '1px', animation: 'musicWaveBounce 0.8s infinite ease-in-out alternate 0.1s' }} />
              </div>
            ) : (
              <Volume2 size={20} style={{ color: getDarkContrastColor(getThemeColors(wheel.theme_preset)[0], wheel.theme_preset) }} />
            )}
          </button>
        </>
      )}
    </div>
  );
};
