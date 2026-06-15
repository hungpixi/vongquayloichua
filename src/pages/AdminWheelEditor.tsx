import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import type { Wheel, Blessing, SpinHistory } from '../services/db';
import { ArrowLeft, Save, Sparkles, BarChart3, Settings, Loader, Trash2, ShieldAlert, Gift, BookOpen, Volume2, Music, Play, Square } from 'lucide-react';
import { BGM_OPTIONS, SPIN_SFX_OPTIONS, WIN_SFX_OPTIONS, playSynthesizedSpinSFX, playSynthesizedWinSFX, RELIGIOUS_ICONS } from '../utils/audioHelper';

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

const PRESET_OPTIONS: {
  type: 'gifts' | 'tet' | 'christmas' | 'easter' | 'lent' | 'advent' | 'marian' | 'joseph' | 'eucharist';
  label: string;
  iconName: 'sparkles' | 'book' | 'gift';
}[] = [
  { type: 'gifts', label: 'Lộc Thánh Thần', iconName: 'sparkles' },
  { type: 'tet', label: '100 Lộc Tết', iconName: 'book' },
  { type: 'christmas', label: 'Lộc Giáng Sinh', iconName: 'gift' },
  { type: 'easter', label: 'Lộc Phục Sinh', iconName: 'gift' },
  { type: 'lent', label: 'Lộc Mùa Chay', iconName: 'book' },
  { type: 'advent', label: 'Lộc Mùa Vọng', iconName: 'sparkles' },
  { type: 'marian', label: 'Lộc Đức Mẹ', iconName: 'gift' },
  { type: 'joseph', label: 'Lộc Thánh Giuse', iconName: 'book' },
  { type: 'eucharist', label: 'Lộc Thánh Thể', iconName: 'gift' }
];

const renderPresetIcon = (name: 'sparkles' | 'book' | 'gift') => {
  switch (name) {
    case 'sparkles': return <Sparkles size={14} style={{ color: '#D8B43F' }} />;
    case 'book': return <BookOpen size={14} style={{ color: '#D8B43F' }} />;
    case 'gift': return <Gift size={14} style={{ color: '#D8B43F' }} />;
  }
};

export const AdminWheelEditor: React.FC = () => {
  const { wheelId } = useParams<{ wheelId: string }>();
  const { user, parish } = useAuth();
  const navigate = useNavigate();

  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [history, setHistory] = useState<SpinHistory[]>([]);
  
  // Form States
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [themePreset, setThemePreset] = useState('gold');
  const [enableConfetti, setEnableConfetti] = useState(true);
  const [enableSound, setEnableSound] = useState(true);
  const [lockDuration, setLockDuration] = useState('24h');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  // DIY Audio States
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmType, setBgmType] = useState('schubert-ave-maria');
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const [spinSfxType, setSpinSfxType] = useState('tick');
  const [winSfxType, setWinSfxType] = useState('fanfare');
  const [customBgmUrl, setCustomBgmUrl] = useState('');
  const [customBgmLoading, setCustomBgmLoading] = useState(false);
  const [customWinSfxUrl, setCustomWinSfxUrl] = useState('');
  const [customWinSfxLoading, setCustomWinSfxLoading] = useState(false);
  const [displaySlots, setDisplaySlots] = useState(12);
  const [slotDisplayType, setSlotDisplayType] = useState('mixed');

  // Preview states
  const [isBgmPreviewPlaying, setIsBgmPreviewPlaying] = useState(false);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const previewAudioContextRef = React.useRef<AudioContext | null>(null);

  // Textarea input format: Category | Quote | Text
  const [rawText, setRawText] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const checkSlugUniqueness = async (val: string) => {
    if (!parish || !val || !wheelId) return;
    setCheckingSlug(true);
    setSlugError(null);
    try {
      const isUnique = await dbService.checkWheelSlugUnique(parish.id, val, wheelId);
      if (!isUnique) {
        setSlugError('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSlug(false);
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchWheelData = React.useCallback(async () => {
    if (!wheelId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await dbService.getWheelById(wheelId);
      if (!result) {
        setError('Không tìm thấy vòng quay này.');
        return;
      }
      
      // Verify admin owns this wheel
      if (result.parish.owner_id !== user?.id) {
        setError('Bạn không có quyền truy cập vòng quay này.');
        return;
      }

      setWheel(result.wheel);
      setTitle(result.wheel.title);
      setSlug(result.wheel.slug);
      setDesc(result.wheel.description);
      setThemePreset(result.wheel.theme_preset);
      setEnableConfetti(result.wheel.enable_confetti);
      setEnableSound(result.wheel.enable_sound);
      setLockDuration(result.wheel.lock_duration || '24h');
      setBackgroundUrl(result.wheel.background_url || '');
      setBgmEnabled(result.wheel.bgm_enabled ?? false);
      setBgmType(result.wheel.bgm_type ?? 'schubert-ave-maria');
      setBgmVolume(result.wheel.bgm_volume ?? 0.3);
      setSpinSfxType(result.wheel.spin_sfx_type ?? 'tick');
      setWinSfxType(result.wheel.win_sfx_type ?? 'fanfare');
      setCustomBgmUrl(result.wheel.custom_bgm_url || '');
      setCustomWinSfxUrl(result.wheel.custom_win_sfx_url || '');
      setDisplaySlots(result.wheel.display_slots ?? 12);
      setSlotDisplayType(result.wheel.slot_display_type ?? 'mixed');

      const items = await dbService.getBlessings(wheelId);
      setBlessings(items);
      
      // format to textarea string: Category | Quote | Text
      const textLines = items.map(item => {
        const cat = item.category || 'Mục';
        const q = item.quote || '';
        return `${cat} | ${q} | ${item.text}`;
      });
      setRawText(textLines.join('\n'));

      const logs = await dbService.getSpinHistory(wheelId);
      setHistory(logs);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải thông tin cấu hình.');
    } finally {
      setLoading(false);
    }
  }, [wheelId, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      fetchWheelData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, navigate, fetchWheelData]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Theme presets helper matching the public view
  const getThemeColors = (preset: string) => {
    switch (preset) {
      case 'christmas': // Giáng Sinh
        return ['#C21807', '#0F5E3D', '#D8B43F', '#FFFFFF', '#0E4B75'];
      case 'tet': // Tết Nguyên Đán
        return ['#D32F2F', '#D8B43F', '#EC407A', '#FFFDF6', '#F57C00', '#B71C1C'];
      case 'easter': // Phục Sinh
        return ['#FBC02D', '#FFFFFF', '#FFF9C4', '#81C784', '#F57F17'];
      case 'pentecost': // Hiện Xuống (7 Ơn)
        return ['#D32F2F', '#FF6F00', '#FFB300', '#FFFDF6', '#E65100'];
      case 'lent': // Mùa Chay
        return ['#5E35B1', '#311B92', '#7E57C2', '#D1C4E9', '#CFD8DC'];
      case 'advent': // Mùa Vọng
        return ['#7B1FA2', '#F06292', '#4A148C', '#1B5E20', '#E1BEE7'];
      case 'marian': // Đức Mẹ
        return ['#1E88E5', '#FFFFFF', '#0D47A1', '#BBDEFB', '#FDD835'];
      case 'joseph': // Thánh Giuse
        return ['#8D6E63', '#4E342E', '#D7CCC8', '#FFF8E1', '#8D6E63'];
      case 'eucharist': // Mình Thánh Chúa
        return ['#FFD54F', '#FFFFFF', '#FFF59D', '#B71C1C', '#FF8F00'];
      case 'gold': // Cổ Điển (Default)
      default:
        return ['#0F3D2E', '#D8B43F', '#1F6B4A', '#FFF8E8', '#2F6B4F', '#E6B93D'];
    }
  };

  // Parse raw text segment labels in real time for canvas preview
  const previewSegments = React.useMemo(() => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map((line, index) => {
      if (!line.includes('|')) {
        const trimmed = line.trim();
        if (trimmed.length <= 15) {
          return trimmed || `Mục ${index + 1}`;
        }
        const words = trimmed.split(/\s+/).filter(Boolean);
        const threeWords = words.slice(0, 3).join(' ');
        let category = threeWords;
        if (category.length > 15) {
          category = category.substring(0, 15);
        }
        return `${category}...`;
      }

      const parts = line.split('|');
      if (parts.length >= 3) {
        return parts[0].trim();
      } else if (parts.length === 2) {
        return `Mục ${index + 1}`;
      } else {
        return line.trim().substring(0, 15) || `Mục ${index + 1}`;
      }
    });
  }, [rawText]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 8;

    ctx.clearRect(0, 0, width, height);

    const displayLen = displaySlots && displaySlots > 0 
      ? displaySlots 
      : (previewSegments.length || 12);

    const arcSize = (2 * Math.PI) / displayLen;
    const colors = getThemeColors(themePreset);

    // Save state
    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw slices
    for (let i = 0; i < displayLen; i++) {
      const angle = i * arcSize;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      
      // Draw slice arc
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Draw border separator
      ctx.strokeStyle = '#D8B43F'; // Gold separator
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Text/Icon inside slice
      ctx.save();
      ctx.fillStyle = getTextContrastColor(colors[i % colors.length], themePreset);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      let text = '';
      let fontSize = '11px';
      
      if (slotDisplayType === 'text') {
        if (previewSegments.length > 0) {
          text = previewSegments[i % previewSegments.length];
        } else {
          text = `Mục ${i + 1}`;
        }
        fontSize = displayLen > 30 ? '6px' : displayLen > 20 ? '8px' : '10px';
      } else if (slotDisplayType === 'number') {
        text = String(i + 1);
        fontSize = displayLen > 20 ? '10px' : '12px';
      } else if (slotDisplayType === 'icon') {
        text = RELIGIOUS_ICONS[i % RELIGIOUS_ICONS.length];
        fontSize = '14px';
      } else {
        // Mixed: xen kẽ Số và Biểu tượng
        if (i % 2 === 0) {
          text = String(i + 1);
          fontSize = '11px';
        } else {
          text = RELIGIOUS_ICONS[Math.floor(i / 2) % RELIGIOUS_ICONS.length];
          fontSize = '14px';
        }
      }
      
      ctx.font = `bold ${fontSize} 'Be Vietnam Pro', sans-serif`;
      const displayLabel = text.length > 18 ? text.substring(0, 16) + '..' : text;
      ctx.fillText(displayLabel, radius - 12, 0);
      ctx.restore();
    }

    ctx.restore();

    // Draw Center brass gold circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#D8B43F'; // Gold brass center
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw little inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = colors[0]; // Primary theme color
    ctx.fill();
  }, [previewSegments, themePreset, displaySlots, slotDisplayType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB để đảm bảo tốc độ tải trang.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBackgroundUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // DIY Audio Handlers
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (previewAudioContextRef.current) {
        previewAudioContextRef.current.close().catch(e => console.warn(e));
        previewAudioContextRef.current = null;
      }
    };
  }, []);

  const toggleBgmPreview = async () => {
    if (isBgmPreviewPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsBgmPreviewPlaying(false);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }

      let audioUrl = '';
      if (bgmType === 'custom') {
        if (!customBgmUrl) {
          alert('Giáo xứ chưa tải lên nhạc nền tự chọn. Vui lòng chọn file nhạc.');
          return;
        }

        if (customBgmUrl.startsWith('indexeddb://')) {
          try {
            const blob = await dbService.getLocalBgm(wheelId!);
            if (blob) {
              audioUrl = URL.createObjectURL(blob);
            } else {
              alert('Không tìm thấy file nhạc nền lưu offline.');
              return;
            }
          } catch (err) {
            console.error('Error loading offline custom BGM for preview:', err);
            alert('Lỗi đọc nhạc nền offline.');
            return;
          }
        } else {
          audioUrl = customBgmUrl;
        }
      } else {
        const activeOption = BGM_OPTIONS.find(opt => opt.id === bgmType);
        if (!activeOption) return;
        audioUrl = activeOption.url;
      }

      const audio = new Audio(audioUrl);
      audio.volume = bgmVolume;
      audio.loop = true;
      audio.onended = () => setIsBgmPreviewPlaying(false);
      
      previewAudioRef.current = audio;
      audio.play()
        .then(() => setIsBgmPreviewPlaying(true))
        .catch(err => {
          console.error('BGM play failed:', err);
          alert('Không thể phát thử bài nhạc này. Vui lòng kiểm tra file nhạc hoặc kết nối.');
        });
    }
  };

  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wheelId) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Dung lượng nhạc quá lớn! Vui lòng chọn file dưới 8MB.');
      return;
    }

    setCustomBgmLoading(true);
    try {
      const url = await dbService.uploadCustomBgm(wheelId, file);
      setCustomBgmUrl(url);
      setBgmType('custom'); // Automatically switch select to custom
      showToastMsg('Tải lên nhạc nền giáo xứ thành công!');
    } catch (err) {
      console.error(err);
      alert('Tải lên nhạc nền thất bại. Vui lòng thử lại.');
    } finally {
      setCustomBgmLoading(false);
    }
  };

  const handleRemoveCustomBgm = async () => {
    if (!wheelId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhạc nền tự chọn của giáo xứ?')) return;
    
    setCustomBgmLoading(true);
    try {
      await dbService.deleteCustomBgm(wheelId, customBgmUrl);
      setCustomBgmUrl('');
      setBgmType('schubert-ave-maria'); // Reset back to default
      showToastMsg('Đã xóa nhạc nền tự chọn.');
    } catch (err) {
      console.error(err);
      showToastMsg('Xóa nhạc nền thất bại.');
    } finally {
      setCustomBgmLoading(false);
    }
  };

  const handleCustomWinSfxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wheelId) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Dung lượng âm thanh quá lớn! Vui lòng chọn file dưới 4MB.');
      return;
    }

    setCustomWinSfxLoading(true);
    try {
      const url = await dbService.uploadCustomWinSfx(wheelId, file);
      setCustomWinSfxUrl(url);
      setWinSfxType('custom'); // Automatically switch select to custom
      showToastMsg('Tải lên âm thanh trúng lộc thành công!');
    } catch (err) {
      console.error(err);
      alert('Tải lên âm thanh thất bại. Vui lòng thử lại.');
    } finally {
      setCustomWinSfxLoading(false);
    }
  };

  const handleRemoveCustomWinSfx = async () => {
    if (!wheelId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa âm thanh trúng lộc tự chọn của giáo xứ?')) return;
    
    setCustomWinSfxLoading(true);
    try {
      await dbService.deleteCustomWinSfx(wheelId, customWinSfxUrl);
      setCustomWinSfxUrl('');
      setWinSfxType('fanfare'); // Reset back to default
      showToastMsg('Đã xóa âm thanh trúng lộc tự chọn.');
    } catch (err) {
      console.error(err);
      showToastMsg('Xóa âm thanh thất bại.');
    } finally {
      setCustomWinSfxLoading(false);
    }
  };

  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);

  const playSfxPreview = async (type: 'spin' | 'win') => {
    if (!previewAudioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        previewAudioContextRef.current = new AudioContextClass();
      }
    }
    const ctx = previewAudioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn(e));
    }

    if (type === 'spin') {
      playSynthesizedSpinSFX(ctx, spinSfxType, 0);
    } else {
      if (winSfxType === 'custom') {
        if (!customWinSfxUrl) {
          alert('Giáo xứ chưa tải lên âm thanh trúng lộc. Vui lòng chọn file âm thanh.');
          return;
        }

        let audioUrl = '';
        if (customWinSfxUrl.startsWith('indexeddb://')) {
          try {
            const blob = await dbService.getLocalWinSfx(wheelId!);
            if (blob) {
              audioUrl = URL.createObjectURL(blob);
            } else {
              alert('Không tìm thấy file âm thanh trúng lộc offline.');
              return;
            }
          } catch (err) {
            console.error('Error loading offline custom Win SFX:', err);
            alert('Lỗi đọc âm thanh trúng lộc offline.');
            return;
          }
        } else {
          audioUrl = customWinSfxUrl;
        }

        const audio = new Audio(audioUrl);
        audio.volume = 0.8;
        audio.play().catch(e => {
          console.error(e);
          alert('Không thể phát thử âm thanh trúng lộc này. Vui lòng kiểm tra lại.');
        });
      } else {
        playSynthesizedWinSFX(ctx, winSfxType);
      }
    }
  };

  // Nạp Preset
  const handleLoadPreset = async (
    presetType: 'gifts' | 'tet' | 'christmas' | 'easter' | 'lent' | 'advent' | 'marian' | 'joseph' | 'eucharist'
  ) => {
    if (!wheelId) return;
    if (!window.confirm('Hành động này sẽ XÓA TOÀN BỘ danh sách lộc cũ của vòng quay này để nạp mẫu. Bạn có chắc chắn?')) return;
    
    setSaveLoading(true);
    try {
      await dbService.loadDefaultBlessingsPreset(wheelId, presetType);
      showToastMsg('Nạp bộ mẫu thành công!');
      fetchWheelData();
    } catch (err) {
      console.error(err);
      showToastMsg('Nạp bộ mẫu thất bại.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wheelId || !wheel || !parish) return;
    setSaveLoading(true);
    setSlugError(null);

    try {
      const isUnique = await dbService.checkWheelSlugUnique(parish.id, slug, wheelId);
      if (!isUnique) {
        throw new Error('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }

      // 1. Update wheel fields
      await dbService.updateWheel(wheelId, {
        title,
        slug,
        description: desc,
        theme_preset: themePreset,
        enable_confetti: enableConfetti,
        enable_sound: enableSound,
        lock_duration: lockDuration,
        background_url: backgroundUrl.trim(),
        bgm_enabled: bgmEnabled,
        bgm_type: bgmType,
        bgm_volume: bgmVolume,
        spin_sfx_type: spinSfxType,
        win_sfx_type: winSfxType,
        custom_bgm_url: customBgmUrl,
        custom_win_sfx_url: customWinSfxUrl,
        display_slots: displaySlots,
        slot_display_type: slotDisplayType
      });

      // 2. Parse rawText to blessings list
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedBlessingsList: Omit<Blessing, 'id' | 'wheel_id'>[] = lines.map((line, index) => {
        if (!line.includes('|')) {
          const trimmed = line.trim();
          if (trimmed.length <= 15) {
            return {
              category: trimmed,
              quote: '',
              text: trimmed,
              is_custom: true
            };
          }
          const words = trimmed.split(/\s+/).filter(Boolean);
          const threeWords = words.slice(0, 3).join(' ');
          let category = threeWords;
          if (category.length > 15) {
            category = category.substring(0, 15);
          }
          return {
            category: `${category}...`,
            quote: '',
            text: trimmed,
            is_custom: true
          };
        }

        const parts = line.split('|');
        if (parts.length >= 3) {
          return {
            category: parts[0].trim(),
            quote: parts[1].trim(),
            text: parts[2].trim(),
            is_custom: true
          };
        } else if (parts.length === 2) {
          return {
            category: `Mục ${index + 1}`,
            quote: parts[0].trim(),
            text: parts[1].trim(),
            is_custom: true
          };
        } else {
          return {
            category: `Mục ${index + 1}`,
            quote: '',
            text: parts[0].trim(),
            is_custom: true
          };
        }
      });

      if (parsedBlessingsList.length < 2) {
        throw new Error('Vui lòng nhập ít nhất 2 câu Lộc/Lời chúc.');
      }

      // 3. Save blessings to DB
      await dbService.saveBlessings(wheelId, parsedBlessingsList);

      showToastMsg('Lưu cấu hình thành công!');
      fetchWheelData();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Lưu cấu hình thất bại.';
      alert(message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!wheelId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử lượt quay của giáo dân đối với vòng quay này?')) return;
    try {
      await dbService.clearSpinHistory(wheelId);
      showToastMsg('Đã xóa sạch lịch sử.');
      setHistory([]);
    } catch (err) {
      console.error(err);
      showToastMsg('Xóa lịch sử thất bại.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAF6EE', gap: '8px' }}>
        <Loader className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
        <span>Đang tải cấu hình vòng quay...</span>
      </div>
    );
  }

  if (error || !wheel) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAF6EE', gap: '16px', padding: '16px', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-error)' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--color-text-dark)' }}>{error || 'Lỗi không xác định'}</h3>
        <Link to="/admin" className="btn btn-primary">
          <ArrowLeft size={16} /> Quay về Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="admin-header" style={{ borderBottom: '1px solid rgba(15, 61, 46, 0.08)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/admin" className="btn btn-secondary" style={{ padding: '8px 12px' }} title="Quay lại Dashboard">
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Giáo xứ: {parish?.name}</span>
            <h2 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              {wheel.title}
            </h2>
          </div>
        </div>

        <button onClick={handleSaveConfig} className="btn btn-primary btn-gold" style={{ gap: '6px' }} disabled={saveLoading}>
          {saveLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Lưu Cấu Hình</span>
        </button>
      </header>

      {/* Workspace Area */}
      <main className="container" style={{ padding: '24px 16px', flex: 1 }}>
        <div className="builder-grid">
          {/* Left panel - Config and Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Core Settings Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px', fontWeight: '800' }}>
                <Settings size={16} />
                <span>Thiết lập Giao diện & Chủ đề</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="title" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên Vòng Quay</label>
                  <input
                    id="title"
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '40px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Slug URL vòng quay</label>
                  <input
                    id="slug"
                    type="text"
                    className="form-control"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      setSlugError(null);
                    }}
                    onBlur={(e) => checkSlugUniqueness(e.target.value)}
                    required
                    style={{ border: slugError ? '1.5px solid var(--color-error)' : '1.5px solid rgba(15, 61, 46, 0.15)', height: '40px' }}
                  />
                  {checkingSlug && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Đang kiểm tra...</span>}
                  {slugError && <span style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>{slugError}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="preset" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Chủ đề màu sắc</label>
                  <select
                    id="preset"
                    className="form-control"
                    value={themePreset}
                    onChange={(e) => setThemePreset(e.target.value)}
                    style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  >
                    <option value="gold">Cổ Điển (Xanh phụng vụ & Vàng đồng)</option>
                    <option value="tet">Tết Nguyên Đán (Đỏ, Vàng, Hồng đào)</option>
                    <option value="christmas">Giáng Sinh (Đỏ, Xanh lá, Vàng, Trắng)</option>
                    <option value="easter">Phục Sinh (Vàng, Trắng, Lục non)</option>
                    <option value="pentecost">Hiện Xuống / 7 Ơn (Đỏ, Cam, Vàng)</option>
                    <option value="lent">Mùa Chay (Tím phụng vụ & Xám)</option>
                    <option value="advent">Mùa Vọng (Tím sẫm & Hồng nhạt)</option>
                    <option value="marian">Kính Đức Mẹ (Xanh da trời & Trắng bạc)</option>
                    <option value="joseph">Kính Thánh Giuse (Nâu đất & Vàng rơm)</option>
                    <option value="eucharist">Mình Thánh Chúa (Vàng kim & Trắng tinh)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lock-duration" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Khóa Lộc đã nhận</label>
                  <select
                    id="lock-duration"
                    className="form-control"
                    value={lockDuration}
                    onChange={(e) => setLockDuration(e.target.value)}
                    style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  >
                    <option value="none">Không khóa (Quay tự do)</option>
                    <option value="24h">Khóa 24 giờ (Quay lại ra cùng Lộc)</option>
                    <option value="forever">Khóa vĩnh viễn trên thiết bị này</option>
                  </select>
                </div>
 
                <div className="form-group">
                  <label htmlFor="display-slots" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Số khung hiển thị</label>
                  <select
                    id="display-slots"
                    className="form-control"
                    value={displaySlots}
                    onChange={(e) => setDisplaySlots(parseInt(e.target.value))}
                    style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  >
                    <option value={0}>Tự động theo số lộc</option>
                    <option value={6}>6 khung</option>
                    <option value={8}>8 khung</option>
                    <option value={10}>10 khung</option>
                    <option value={12}>12 khung (Đẹp nhất)</option>
                    <option value={16}>16 khung</option>
                    <option value={20}>20 khung</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="slot-display-type" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Hiển thị trên khung</label>
                  <select
                    id="slot-display-type"
                    className="form-control"
                    value={slotDisplayType}
                    onChange={(e) => setSlotDisplayType(e.target.value)}
                    style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  >
                    <option value="mixed">Xen kẽ Số & Biểu tượng (Khuyên dùng)</option>
                    <option value="icon">Chỉ hiển thị Biểu tượng Tôn giáo</option>
                    <option value="number">Chỉ hiển thị Số thứ tự (1, 2, 3...)</option>
                    <option value="text">Hiển thị Chữ tên lộc (Thích hợp &lt; 16 lộc)</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Hình ảnh Nền Vòng Quay (Ghi đè hình nền Giáo xứ)</label>
                  
                  {backgroundUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(15, 61, 46, 0.03)', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(15, 61, 46, 0.1)' }}>
                      <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#E5E7EB' }}>
                        <img src={backgroundUrl} alt="Background Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Đang sử dụng ảnh nền riêng</span>
                        <button
                          type="button"
                          onClick={() => setBackgroundUrl('')}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                          <span>Xóa hình nền này</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        id="background-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="background-file"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          border: '1.5px dashed rgba(15, 61, 46, 0.25)',
                          borderRadius: '10px',
                          padding: '16px',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(15, 61, 46, 0.02)',
                          transition: 'all 0.2s',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-gold)';
                          e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(15, 61, 46, 0.25)';
                          e.currentTarget.style.backgroundColor = 'rgba(15, 61, 46, 0.02)';
                        }}
                      >
                        <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                        <span style={{ fontSize: '13.5px', color: 'var(--color-primary)', fontWeight: '600' }}>
                          Tải ảnh nền lên từ thiết bị (Khuyên dùng dưới 2MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="desc" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Lời chào đón / nhắn nhủ Giáo dân</label>
                <textarea
                  id="desc"
                  className="form-control"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: 'var(--color-primary)' }}>
                  <input
                    type="checkbox"
                    checked={enableConfetti}
                    onChange={(e) => setEnableConfetti(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Bật hiệu ứng pháo giấy Confetti khi trúng</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: 'var(--color-primary)' }}>
                  <input
                    type="checkbox"
                    checked={enableSound}
                    onChange={(e) => setEnableSound(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Bật âm thanh (tick-tick/chuông) khi quay</span>
                </label>
              </div>
            </div>

            {/* DIY Audio Settings Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px', fontWeight: '800' }}>
                <Volume2 size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Thiết lập Âm thanh & Nhạc nền DIY</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* BGM Config */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px dashed rgba(15, 61, 46, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: 'var(--color-primary)' }}>
                      <input
                        type="checkbox"
                        checked={bgmEnabled}
                        onChange={(e) => setBgmEnabled(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>Bật Nhạc Nền (Background Music)</span>
                    </label>
                  </div>

                  {bgmEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '12px', backgroundColor: 'rgba(15, 61, 46, 0.02)', borderRadius: '8px', border: '1px solid rgba(15, 61, 46, 0.06)' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="bgm-select" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Music size={14} />
                          <span>Chọn bài Thánh ca / Nhạc nền</span>
                        </label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <select
                            id="bgm-select"
                            className="form-control"
                            value={bgmType}
                            onChange={(e) => {
                              setBgmType(e.target.value);
                              if (isBgmPreviewPlaying) {
                                setIsBgmPreviewPlaying(false);
                                if (previewAudioRef.current) {
                                  previewAudioRef.current.pause();
                                }
                              }
                            }}
                            style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)', flex: 1 }}
                          >
                            {BGM_OPTIONS.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                            <option value="custom">🎵 Nhạc Giáo Xứ Tải Lên (Tùy Chọn)</option>
                          </select>
                          <button
                            type="button"
                            onClick={toggleBgmPreview}
                            className={`btn ${isBgmPreviewPlaying ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid rgba(216, 180, 63, 0.3)' }}
                          >
                            {isBgmPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
                            <span>{isBgmPreviewPlaying ? 'Dừng' : 'Nghe thử'}</span>
                          </button>
                        </div>
                      </div>

                      {bgmType === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>Nhạc nền Giáo xứ tải lên:</label>
                          {customBgmUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15, 61, 46, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid rgba(15, 61, 46, 0.1)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--color-primary)' }}>Đang sử dụng nhạc nền riêng</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '240px' }}>
                                  {customBgmUrl.startsWith('indexeddb://') ? 'Lưu offline trong trình duyệt' : customBgmUrl}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveCustomBgm}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: 'auto' }}
                                disabled={customBgmLoading}
                              >
                                <Trash2 size={12} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                id="custom-bgm-file"
                                type="file"
                                accept="audio/*"
                                onChange={handleCustomAudioUpload}
                                style={{ display: 'none' }}
                                disabled={customBgmLoading}
                              />
                              <label
                                htmlFor="custom-bgm-file"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  border: '1.5px dashed rgba(216, 180, 63, 0.4)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(216, 180, 63, 0.02)',
                                  transition: 'all 0.2s',
                                  textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#D8B43F';
                                  e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(216, 180, 63, 0.4)';
                                  e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.02)';
                                }}
                              >
                                {customBgmLoading ? <Loader className="animate-spin" size={16} /> : <Music size={16} style={{ color: '#D8B43F' }} />}
                                <span style={{ fontSize: '12.5px', color: 'var(--color-primary)', fontWeight: '600' }}>
                                  {customBgmLoading ? 'Đang xử lý file nhạc...' : 'Chọn file nhạc của Giáo xứ (MP3, WAV, OGG < 8MB)'}
                                </span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="bgm-volume" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Âm lượng nhạc nền</span>
                          <span>{Math.round(bgmVolume * 100)}%</span>
                        </label>
                        <input
                          id="bgm-volume"
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={bgmVolume}
                          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                          style={{ width: '100%', marginTop: '8px', accentColor: 'var(--color-gold)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SFX Config */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="spin-sfx-select" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Hiệu ứng khi quay (Spin SFX)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <select
                        id="spin-sfx-select"
                        className="form-control"
                        value={spinSfxType}
                        onChange={(e) => setSpinSfxType(e.target.value)}
                        style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)', flex: 1 }}
                      >
                        {SPIN_SFX_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => playSfxPreview('spin')}
                        className="btn btn-secondary"
                        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)' }}
                        title="Nghe thử tiếng quay"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="win-sfx-select" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Hiệu ứng trúng lộc (Win SFX)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        id="win-sfx-select"
                        className="form-control"
                        value={winSfxType}
                        onChange={(e) => setWinSfxType(e.target.value)}
                        style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)', flex: 1 }}
                      >
                        {WIN_SFX_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                        <option value="custom">🎵 Nhạc Trúng Lộc Tải Lên (Tùy Chọn)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => playSfxPreview('win')}
                        className="btn btn-secondary"
                        style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)' }}
                        title="Nghe thử tiếng trúng lộc"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>

                    {winSfxType === 'custom' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {customWinSfxUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15, 61, 46, 0.03)', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid rgba(15, 61, 46, 0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)' }}>Đang sử dụng nhạc riêng</span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px' }}>
                                {customWinSfxUrl.startsWith('indexeddb://') ? 'Lưu offline trong trình duyệt' : customWinSfxUrl}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveCustomWinSfx}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '6px' }}
                              disabled={customWinSfxLoading}
                            >
                              <Trash2 size={10} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              id="custom-winsfx-file"
                              type="file"
                              accept="audio/*"
                              onChange={handleCustomWinSfxUpload}
                              style={{ display: 'none' }}
                              disabled={customWinSfxLoading}
                            />
                            <label
                              htmlFor="custom-winsfx-file"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                border: '1.5px dashed rgba(216, 180, 63, 0.4)',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(216, 180, 63, 0.02)',
                                transition: 'all 0.2s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#D8B43F';
                                e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(216, 180, 63, 0.4)';
                                e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.02)';
                              }}
                            >
                              {customWinSfxLoading ? <Loader className="animate-spin" size={14} /> : <Music size={14} style={{ color: '#D8B43F' }} />}
                              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                                {customWinSfxLoading ? 'Đang xử lý...' : 'Chọn file âm thanh chúc mừng (< 4MB)'}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Blessings Editor Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <div style={{ borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
                <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <Sparkles size={16} />
                  <span>Danh sách Lộc Lời Chúa / Lời chúc ({blessings.length} mục)</span>
                </h3>
              </div>

              {/* Preset Loader Section */}
              <div style={{
                backgroundColor: 'rgba(15, 61, 46, 0.02)',
                border: '1px solid rgba(15, 61, 46, 0.06)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--color-primary)', display: 'block', marginBottom: '10px' }}>
                  Nạp nhanh danh sách mẫu phụng vụ:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => handleLoadPreset(opt.type)}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid rgba(216, 180, 63, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: 'var(--color-primary)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#D8B43F';
                        e.currentTarget.style.backgroundColor = 'rgba(216, 180, 63, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(216, 180, 63, 0.3)';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {renderPresetIcon(opt.iconName)}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Helper Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: 'rgba(216, 180, 63, 0.08)',
                border: '1.5px solid rgba(216, 180, 63, 0.35)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <Sparkles size={18} style={{ color: '#D8B43F', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: 'var(--color-primary)', lineHeight: '1.5' }}>
                  <strong style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '2px', fontWeight: '700' }}>
                    Hệ thống tự động nhận diện danh sách
                  </strong>
                  Bạn chỉ cần dán mỗi dòng 1 câu chúc/Kinh Thánh (ví dụ: sao chép trực tiếp từ một cột trong Excel/Word), hệ thống sẽ tự động phân tích và sinh ra lát cắt cho vòng quay mà không bắt buộc phải sử dụng ký tự ngăn cách <code style={{ backgroundColor: 'rgba(15, 61, 46, 0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '700' }}>|</code>!
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="raw-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Nhập hoặc Dán danh sách Lộc Lời Chúa</span>
                  <span style={{ fontWeight: '400', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    Dán danh sách câu chúc của bạn tại đây (mỗi dòng tương ứng với 1 lát cắt trên vòng quay).
                  </span>
                </label>
                <textarea
                  id="raw-text"
                  className="form-control editor-textarea"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`CÁCH 1: Dán trực tiếp danh sách (Mỗi dòng một câu):\nChúa là mục tử chăn dắt tôi, tôi chẳng thiếu thốn gì.\nKính sợ Chúa là đầu mối sự khôn ngoan.\n\nCÁCH 2: Định dạng nâng cao (Phân cách bằng dấu '|')\nTên Lát Cắt | Trích Dẫn Kinh Thánh | Nội dung câu Lộc\nƠn khôn ngoan | Is 11,2 | Thần khí Khôn Ngoan giúp anh/chị luôn biết chọn lựa điều lành.`}
                  style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '10px', minHeight: '220px', fontSize: '13px', lineHeight: '1.6' }}
                />
              </div>
            </div>
          </div>

          {/* Right panel - Stats / History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Real-time Preview Card */}
            <div className="card" style={{
              border: themePreset === 'christmas' ? '6px double #F59E0B' : '2px double var(--color-gold)',
              boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              position: 'relative'
            }}>
              {/* Corner Ornaments */}
              <div className="corner-ornament top-left" style={{ borderColor: themePreset === 'christmas' ? '#F59E0B' : 'var(--color-gold)', width: '8px', height: '8px', top: '8px', left: '8px' }}></div>
              <div className="corner-ornament top-right" style={{ borderColor: themePreset === 'christmas' ? '#F59E0B' : 'var(--color-gold)', width: '8px', height: '8px', top: '8px', right: '8px' }}></div>
              <div className="corner-ornament bottom-left" style={{ borderColor: themePreset === 'christmas' ? '#F59E0B' : 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', left: '8px' }}></div>
              <div className="corner-ornament bottom-right" style={{ borderColor: themePreset === 'christmas' ? '#F59E0B' : 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', right: '8px' }}></div>

              <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '16px', fontWeight: '800', width: '100%', textAlign: 'center' }}>
                Xem Trước Vòng Quay
              </h3>

              <div 
                className={themePreset === 'christmas' ? 'theme-christmas-layout' : ''}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '280px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                  marginBottom: '12px',
                  ...(backgroundUrl.trim() ? {
                    backgroundImage: `url('${backgroundUrl.trim()}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : themePreset !== 'christmas' ? {
                    background: themePreset === 'lent' || themePreset === 'advent'
                      ? '#2b1b40'
                      : themePreset === 'tet'
                      ? '#500808'
                      : themePreset === 'marian'
                      ? '#082550'
                      : themePreset === 'joseph'
                      ? '#3c291e'
                      : themePreset === 'eucharist'
                      ? '#4a3d10'
                      : themePreset === 'pentecost'
                      ? '#5a1d08'
                      : '#081B15',
                    backgroundImage: themePreset === 'lent' || themePreset === 'advent'
                      ? 'radial-gradient(circle at 50% 30%, #5E35B1 0%, #21153b 100%)'
                      : themePreset === 'tet'
                      ? 'radial-gradient(circle at 50% 30%, #9b1c1c 0%, #400404 100%)'
                      : themePreset === 'marian'
                      ? 'radial-gradient(circle at 50% 30%, #1a5e9b 0%, #051a36 100%)'
                      : themePreset === 'joseph'
                      ? 'radial-gradient(circle at 50% 30%, #6e4d3a 0%, #301f16 100%)'
                      : themePreset === 'eucharist'
                      ? 'radial-gradient(circle at 50% 30%, #ffd04f 0%, #3c2a04 100%)'
                      : themePreset === 'pentecost'
                      ? 'radial-gradient(circle at 50% 30%, #d32f2f 0%, #4a0d0d 100%)'
                      : themePreset === 'easter'
                      ? 'radial-gradient(circle at 50% 30%, #fff9c4 0%, #ffd04f 100%)'
                      : 'radial-gradient(circle at 50% 30%, #164D3B 0%, #081B15 100%)'
                  } : {})
                }}
              >
                <canvas ref={canvasRef} width="240" height="240" style={{ maxWidth: '100%', display: 'block' }}></canvas>
                
                {/* Pointer pointer arrow */}
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  {themePreset === 'christmas' ? (
                    <svg viewBox="0 0 40 40" width="32" height="32">
                      <path 
                        d="M 4 20 L 22 17 L 18 12 L 25 14 L 28 4 L 31 14 L 38 12 L 34 17 L 37 20 L 34 23 L 38 28 L 31 26 L 28 36 L 25 26 L 18 28 L 22 23 Z" 
                        fill="#D8B43F"
                        stroke="#FFF5D1"
                        strokeWidth="1"
                      />
                      <circle cx="28" cy="20" r="2.5" fill="#FFFFFF" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 30 30" width="24" height="24" style={{ transform: 'rotate(180deg)' }}>
                      <polygon points="5,15 25,5 25,25" fill={getThemeColors(themePreset)[1] || '#D8B43F'} filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.4))"/>
                    </svg>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Thay đổi chủ đề màu sắc hoặc danh sách lộc bên trái để xem thay đổi ngay lập tức.
              </div>
            </div>

            {/* Short info / Share Card */}
            <div className="card" style={{ background: 'var(--color-primary)', color: '#FFFFFF', border: '2px double var(--color-gold)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.15)', position: 'relative' }}>
              {/* Corner Ornaments */}
              <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', top: '8px', left: '8px' }}></div>
              <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', top: '8px', right: '8px' }}></div>
              <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', left: '8px' }}></div>
              <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', right: '8px' }}></div>

              <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-gold)', marginBottom: '8px', fontWeight: '800' }}>Đường Dẫn Chia Sẻ Giáo Dân</h3>
              <p style={{ fontSize: '12.5px', opacity: 0.85, lineHeight: '1.6', marginBottom: '16px' }}>
                Giáo dân quét mã QR hoặc truy cập đường dẫn này để nhận Lộc Lời Chúa. Bạn có thể sao chép liên kết hoặc in mã QR.
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                <div>Friendly URL:</div>
                <div style={{ color: 'var(--color-gold)', wordBreak: 'break-all' }}>
                  {`/giao-xu/${parish?.slug}/vong-quay/${slug}`}
                </div>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <a
                  href={`/giao-xu/${parish?.slug}/vong-quay/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                >
                  Kiểm tra trang Quay
                </a>
              </div>
            </div>

            {/* Spin History Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
                <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <BarChart3 size={16} />
                  <span>Lịch sử nhận lộc ({history.length} lượt)</span>
                </h3>

                {history.length > 0 && (
                  <button onClick={handleClearHistory} className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 8px', gap: '4px', borderRadius: '8px' }}>
                    <Trash2 size={12} />
                    Xóa sạch
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  Chưa có lượt quay nào được ghi nhận.
                </div>
              ) : (
                <div className="data-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Lượt</th>
                        <th>Lát trúng</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log, index) => (
                        <tr key={log.id}>
                          <td>{history.length - index}</td>
                          <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{log.item_spun}</td>
                          <td style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                            {new Date(log.created_at || '').toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                            {new Date(log.created_at || '').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
    </div>
  );
};
