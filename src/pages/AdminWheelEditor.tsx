import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { supabase } from '../services/supabaseClient';
import type { Wheel, Blessing, SpinHistory } from '../services/db';
import { compressImageFile } from '../utils/imageHelper';
import {
  ArrowLeft,
  Save,
  Sparkles,
  BarChart3,
  Settings,
  Loader,
  Trash2,
  ShieldAlert,
  Gift,
  BookOpen,
  Volume2,
  Music,
  Play,
  Square,
  Edit,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RotateCcw,
  Check,
  X,
  Copy,
  Download,
  QrCode,
  Upload
} from 'lucide-react';
import {
  BGM_OPTIONS,
  SPIN_SFX_OPTIONS,
  WIN_SFX_OPTIONS,
  playSynthesizedSpinSFX,
  playSynthesizedWinSFX,
  RELIGIOUS_ICONS
} from '../utils/audioHelper';
import {
  DEFAULT_BLESSINGS,
  CHRISTMAS_BLESSINGS,
  EASTER_BLESSINGS,
  PENTECOST_BLESSINGS,
  LENT_BLESSINGS,
  ADVENT_BLESSINGS,
  MARIAN_BLESSINGS,
  ST_JOSEPH_BLESSINGS,
  EUCHARIST_BLESSINGS
} from '../utils/blessingsData';
import { getProductionUrl, copyToClipboard } from '../utils/urlHelper';

// Component vẽ hoa văn góc cho thiệp Lộc Lời Chúa dạng vector sắc nét
const CornerOrnamentSVG: React.FC<{ style?: React.CSSProperties; isChristmas?: boolean }> = ({ style, isChristmas }) => {
  if (isChristmas) {
    return (
      <svg
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          width: '24px',
          height: '24px',
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
        width: '20px',
        height: '20px',
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

// Hàm tính toán màu chữ tương phản cao dựa trên độ sáng nền (cho lát vòng quay)
const getTextContrastColor = (bgColor: string, themePreset?: string) => {
  const hex = bgColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Tính độ sáng tương đối (relative luminance) theo chuẩn WCAG
  const getLuminance = (num: number) => {
    const val = num / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  const L_bg = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);

  // Chọn màu chữ tối theo chủ đề
  let darkColor = '#0F3D2E';
  switch (themePreset) {
    case 'easter':
      darkColor = '#3E2723';
      break;
    case 'eucharist':
      darkColor = '#4E2A0F';
      break;
    case 'christmas':
      darkColor = '#0A3B24';
      break;
    case 'tet':
    case 'pentecost':
      darkColor = '#5C0606';
      break;
    default:
      darkColor = '#0F3D2E';
  }

  // Độ sáng của chữ tối
  const dHex = darkColor.replace('#', '');
  const dr = parseInt(dHex.substring(0, 2), 16);
  const dg = parseInt(dHex.substring(2, 4), 16);
  const db = parseInt(dHex.substring(4, 6), 16);
  const L_dark = 0.2126 * getLuminance(dr) + 0.7152 * getLuminance(dg) + 0.0722 * getLuminance(db);

  // Độ sáng của chữ sáng (#FFF8E8)
  const L_light = 0.941;

  // Tính tỷ lệ tương phản (contrast ratio) cho cả 2 phương án
  const ratioDark = L_bg > L_dark ? (L_bg + 0.05) / (L_dark + 0.05) : (L_dark + 0.05) / (L_bg + 0.05);
  const ratioLight = L_bg > L_light ? (L_bg + 0.05) / (L_light + 0.05) : (L_light + 0.05) / (L_bg + 0.05);

  return ratioDark >= ratioLight ? darkColor : '#FFF8E8';
};

// Hàm lấy màu tối tương phản tốt cho chữ/viền trên nền sáng (thiệp lộc)
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
  }
  return color;
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

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = React.useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, [setToast]);

  const downloadQRCode = async (url: string, filename: string) => {
    try {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.open(url, '_blank');
        showToastMsg('Đã mở ảnh QR. Vui lòng nhấn giữ để tải/lưu ảnh!');
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToastMsg('Đã tải ảnh QR Code về máy!');
    } catch (err) {
      console.error(err);
      window.open(url, '_blank');
      showToastMsg('Đã mở ảnh QR. Vui lòng nhấn giữ để tải/lưu ảnh!');
    }
  };

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

  // Cấu hình thiệp lộc mới
  const [cardTemplate, setCardTemplate] = useState('default');
  const [cardTextColor, setCardTextColor] = useState('');
  const [cardFontSize, setCardFontSize] = useState('16');
  const [cardGreeting, setCardGreeting] = useState('');
  
  const [logoUrl, setLogoUrl] = useState('');
  const [spinBtnText, setSpinBtnText] = useState('QUAY LỘC');
  const [spinningBtnText, setSpinningBtnText] = useState('ĐANG QUAY');
  const [viewResultBtnText, setViewResultBtnText] = useState('XEM LỘC ĐÃ NHẬN');
  const [recheckBtnText, setRecheckBtnText] = useState('Xem lại Lộc Thánh của bạn');
  const [lockedDesc, setLockedDesc] = useState('Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.');
  const [customColors, setCustomColors] = useState('#EF4444,#10B981,#F59E0B,#3B82F6,#DDD6FE');

  // UI & Chế độ nhập liệu danh sách lộc
  const [editorMode, setEditorMode] = useState<'list' | 'bulk' | 'segment'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // State cho Thêm mới & Sửa inline câu lộc
  const [newCategory, setNewCategory] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newText, setNewText] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editQuote, setEditQuote] = useState('');
  const [editText, setEditText] = useState('');

  // State cho Quay thử (Test Spin)
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isTestSpinning, setIsTestSpinning] = useState(false);
  const [testWinner, setTestWinner] = useState<Blessing | null>(null);
  const [showTestWinnerModal, setShowTestWinnerModal] = useState(false);
  const testSpinAngleRef = useRef(0);

  // Preview BGM
  const [isBgmPreviewPlaying, setIsBgmPreviewPlaying] = useState(false);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const previewPlayPromiseRef = React.useRef<Promise<void> | null>(null);
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

  // Draft States & Recover/Auto-Save handlers
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string | null>(null);

  useEffect(() => {
    if (wheelId) {
      const savedDraft = localStorage.getItem(`vqlc_draft_${wheelId}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.updatedAt) {
            Promise.resolve().then(() => {
              setHasDraft(true);
              setDraftTime(new Date(parsed.updatedAt).toLocaleString('vi-VN'));
            });
          }
        } catch (e) {
          console.error('Error parsing draft on load:', e);
        }
      }
    }
  }, [wheelId]);

  const handleRecoverDraft = () => {
    if (!wheelId) return;
    const savedDraft = localStorage.getItem(`vqlc_draft_${wheelId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setTitle(parsed.title ?? '');
        setSlug(parsed.slug ?? '');
        setDesc(parsed.desc ?? '');
        setThemePreset(parsed.themePreset ?? 'gold');
        setEnableConfetti(parsed.enableConfetti ?? true);
        setEnableSound(parsed.enableSound ?? true);
        setLockDuration(parsed.lockDuration ?? '24h');
        setBackgroundUrl(parsed.backgroundUrl ?? '');
        setBgmEnabled(parsed.bgmEnabled ?? false);
        setBgmType(parsed.bgmType ?? 'schubert-ave-maria');
        setBgmVolume(parsed.bgmVolume ?? 0.3);
        setSpinSfxType(parsed.spinSfxType ?? 'tick');
        setWinSfxType(parsed.winSfxType ?? 'fanfare');
        setCustomBgmUrl(parsed.customBgmUrl ?? '');
        setCustomWinSfxUrl(parsed.customWinSfxUrl ?? '');
        setDisplaySlots(parsed.displaySlots ?? 12);
        setSlotDisplayType(parsed.slotDisplayType ?? 'mixed');
        setCardTemplate(parsed.cardTemplate ?? 'default');
        setCardTextColor(parsed.cardTextColor ?? '');
        setCardFontSize(parsed.cardFontSize ?? '16');
        setCardGreeting(parsed.cardGreeting ?? '');
        setLogoUrl(parsed.logoUrl ?? '');
        setSpinBtnText(parsed.spinBtnText ?? 'QUAY LỘC');
        setSpinningBtnText(parsed.spinningBtnText ?? 'ĐANG QUAY');
        setViewResultBtnText(parsed.viewResultBtnText ?? 'XEM LỘC ĐÃ NHẬN');
        setRecheckBtnText(parsed.recheckBtnText ?? 'Xem lại Lộc Thánh của bạn');
        setLockedDesc(parsed.lockedDesc ?? 'Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.');
        setCustomColors(parsed.customColors ?? '#EF4444,#10B981,#F59E0B,#3B82F6,#DDD6FE');
        if (parsed.blessings) {
          setBlessings(parsed.blessings);
          const textLines = parsed.blessings.map((item: Blessing) => {
            const cat = item.category || 'Mục';
            const q = item.quote || '';
            return `${cat} | ${q} | ${item.text}`;
          });
          setRawText(textLines.join('\n'));
        }
        setHasDraft(false);
        showToastMsg('Đã khôi phục bản nháp thành công!');
      } catch (e) {
        console.error('Error recovering draft:', e);
        alert('Khôi phục bản nháp thất bại.');
      }
    }
  };

  const handleDiscardDraft = () => {
    if (!wheelId) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp này?')) {
      localStorage.removeItem(`vqlc_draft_${wheelId}`);
      setHasDraft(false);
      showToastMsg('Đã xóa bản nháp.');
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (loading || !wheelId || !wheel || hasDraft) return;

    const saveTimer = setTimeout(() => {
      const draftData = {
        updatedAt: new Date().toISOString(),
        title,
        slug,
        desc,
        themePreset,
        enableConfetti,
        enableSound,
        lockDuration,
        backgroundUrl,
        bgmEnabled,
        bgmType,
        bgmVolume,
        spinSfxType,
        winSfxType,
        customBgmUrl,
        customWinSfxUrl,
        displaySlots,
        slotDisplayType,
        cardTemplate,
        cardTextColor,
        cardFontSize,
        cardGreeting,
        logoUrl,
        spinBtnText,
        spinningBtnText,
        viewResultBtnText,
        recheckBtnText,
        lockedDesc,
        customColors,
        blessings
      };
      localStorage.setItem(`vqlc_draft_${wheelId}`, JSON.stringify(draftData));
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [
    loading,
    wheelId,
    wheel,
    hasDraft,
    title,
    slug,
    desc,
    themePreset,
    enableConfetti,
    enableSound,
    lockDuration,
    backgroundUrl,
    bgmEnabled,
    bgmType,
    bgmVolume,
    spinSfxType,
    winSfxType,
    customBgmUrl,
    customWinSfxUrl,
    displaySlots,
    slotDisplayType,
    cardTemplate,
    cardTextColor,
    cardFontSize,
    cardGreeting,
    logoUrl,
    spinBtnText,
    spinningBtnText,
    viewResultBtnText,
    recheckBtnText,
    lockedDesc,
    customColors,
    blessings
  ]);

  // Đồng bộ mảng blessings sang rawText
  const syncBlessingsToRawText = React.useCallback((list: Blessing[]) => {
    const textLines = list.map(item => {
      const cat = item.category || 'Mục';
      const q = item.quote || '';
      return `${cat} | ${q} | ${item.text}`;
    });
    setRawText(textLines.join('\n'));
  }, [setRawText]);

  // Phân tích cú pháp rawText sang mảng blessings (hàm thuần túy)
  const parseRawTextToBlessings = React.useCallback((text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map((line, index) => {
      if (!line.includes('|')) {
        const trimmed = line.trim();
        let category = trimmed;
        if (trimmed.length > 15) {
          const words = trimmed.split(/\s+/).filter(Boolean);
          category = words.slice(0, 3).join(' ');
          if (category.length > 15) category = category.substring(0, 15) + '...';
        }
        return {
          id: `temp-${index}`,
          wheel_id: wheelId || '',
          category,
          quote: '',
          text: trimmed,
          is_custom: true
        };
      }

      const parts = line.split('|');
      if (parts.length >= 3) {
        return {
          id: `temp-${index}`,
          wheel_id: wheelId || '',
          category: parts[0].trim(),
          quote: parts[1].trim(),
          text: parts[2].trim(),
          is_custom: true
        };
      } else if (parts.length === 2) {
        return {
          id: `temp-${index}`,
          wheel_id: wheelId || '',
          category: `Mục ${index + 1}`,
          quote: parts[0].trim(),
          text: parts[1].trim(),
          is_custom: true
        };
      } else {
        return {
          id: `temp-${index}`,
          wheel_id: wheelId || '',
          category: `Mục ${index + 1}`,
          quote: '',
          text: parts[0].trim(),
          is_custom: true
        };
      }
    });
  }, [wheelId]);

  // Đồng bộ rawText sang mảng blessings (trả về mảng mới để dùng ngay)
  const syncRawTextToBlessings = (text: string) => {
    const parsed = parseRawTextToBlessings(text);
    setBlessings(parsed);
    return parsed;
  };

  const syncToSegmentCount = (currentBlessings: Blessing[], slotsCount: number) => {
    const updated = [...currentBlessings];
    if (updated.length < slotsCount) {
      for (let i = updated.length; i < slotsCount; i++) {
        updated.push({
          id: `temp-seg-${i}-${Date.now()}`,
          wheel_id: wheelId || '',
          category: `Lát số ${i + 1}`,
          quote: '',
          text: `Nội dung lộc cho lát số ${i + 1}`,
          is_custom: true
        });
      }
    } else if (updated.length > slotsCount) {
      updated.splice(slotsCount);
    }
    return updated;
  };

  // Chuyển tab và đồng bộ
  const handleSwitchMode = (mode: 'list' | 'bulk' | 'segment') => {
    let current = blessings;
    if (editorMode === 'bulk') {
      current = parseRawTextToBlessings(rawText);
    }

    if (mode === 'segment') {
      const slotsCount = displaySlots && displaySlots > 0 ? displaySlots : (current.length || 12);
      const synced = syncToSegmentCount(current, slotsCount);
      setBlessings(synced);
      syncBlessingsToRawText(synced);
    } else if (mode === 'list') {
      setBlessings(current);
    } else if (mode === 'bulk') {
      setBlessings(current);
      syncBlessingsToRawText(current);
    }
    setEditorMode(mode);
  };

  const handleDisplaySlotsChange = (newSlots: number) => {
    if (newSlots === 0) {
      setDisplaySlots(0);
      return;
    }

    const currentBlessings = editorMode === 'bulk' ? parseRawTextToBlessings(rawText) : blessings;

    if (newSlots > currentBlessings.length) {
      const diff = newSlots - currentBlessings.length;
      const addedBlessings: Blessing[] = [];
      for (let i = 0; i < diff; i++) {
        addedBlessings.push({
          id: `temp-add-sync-${Date.now()}-${i}`,
          wheel_id: wheelId || '',
          category: 'Lời Chúa',
          quote: '',
          text: `Lời Chúa mới ${currentBlessings.length + i + 1}`,
          is_custom: true
        });
      }
      const updated = [...currentBlessings, ...addedBlessings];
      setBlessings(updated);
      syncBlessingsToRawText(updated);
      setDisplaySlots(newSlots);
      showToastMsg(`Đã tự động thêm ${diff} câu lộc mặc định.`);
    } else if (newSlots < currentBlessings.length) {
      const diff = currentBlessings.length - newSlots;
      const confirmSlice = window.confirm(
        `Số khung hiển thị mới (${newSlots}) ít hơn số câu lộc hiện tại (${currentBlessings.length}).\n` +
        `Hệ thống sẽ loại bỏ ${diff} câu lộc ở cuối danh sách. Bạn có chắc chắn muốn tiếp tục?`
      );
      if (confirmSlice) {
        const updated = currentBlessings.slice(0, newSlots);
        setBlessings(updated);
        syncBlessingsToRawText(updated);
        setDisplaySlots(newSlots);
        showToastMsg(`Đã cắt bớt danh sách xuống ${newSlots} câu lộc.`);
      }
    } else {
      setDisplaySlots(newSlots);
    }
  };

  const handleSegmentChange = (index: number, field: 'category' | 'quote' | 'text', value: string) => {
    const updated = [...blessings];
    // Fill any missing elements up to index
    for (let i = 0; i <= index; i++) {
      if (!updated[i]) {
        updated[i] = {
          id: `temp-seg-${i}-${Date.now()}`,
          wheel_id: wheelId || '',
          category: `Lát số ${i + 1}`,
          quote: '',
          text: `Nội dung lộc cho lát số ${i + 1}`,
          is_custom: true
        };
      }
    }
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setBlessings(updated);
    syncBlessingsToRawText(updated);
  };

  const handleAddSegment = () => {
    const updated = [...blessings];
    updated.push({
      id: `temp-add-${Date.now()}`,
      wheel_id: wheelId || '',
      category: `Lát số ${updated.length + 1}`,
      quote: '',
      text: `Nội dung lộc cho lát số ${updated.length + 1}`,
      is_custom: true
    });
    setBlessings(updated);
    syncBlessingsToRawText(updated);
    showToastMsg('Đã thêm lát cắt mới.');
  };

  const fetchWheelData = React.useCallback(async () => {
    if (!wheelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await dbService.getWheelById(wheelId);
      if (!result) {
        setError('Không tìm thấy vòng quay này.');
        setLoading(false);
        return;
      }

      // Verify admin owns this wheel
      if (result.parish.owner_id !== user?.id) {
        setError('Bạn không có quyền truy cập vòng quay này.');
        setLoading(false);
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

      // Tải cấu hình thiệp lộc mới
      setCardTemplate(result.wheel.card_template || 'default');
      setCardTextColor(result.wheel.card_text_color || '');
      setCardFontSize(result.wheel.card_font_size || '16');
      setCardGreeting(result.wheel.card_greeting || '');
      
      setLogoUrl(result.wheel.logo_url || '');
      setSpinBtnText(result.wheel.spin_btn_text || 'QUAY LỘC');
      setSpinningBtnText(result.wheel.spinning_btn_text || 'ĐANG QUAY');
      setViewResultBtnText(result.wheel.view_result_btn_text || 'XEM LỘC ĐÃ NHẬN');
      setRecheckBtnText(result.wheel.recheck_btn_text || 'Xem lại Lộc Thánh của bạn');
      setLockedDesc(result.wheel.locked_desc || 'Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.');
      setCustomColors(result.wheel.custom_colors || '#EF4444,#10B981,#F59E0B,#3B82F6,#DDD6FE');

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
  }, [wheelId, user, setLoading]);

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

  const getThemeColors = (preset: string) => {
    if (preset === 'custom' && customColors) {
      const parsed = customColors.split(',').map(c => c.trim()).filter(c => /^#[0-9A-F]{6}$/i.test(c));
      if (parsed.length > 0) {
        const paddedColors = [...parsed];
        while (paddedColors.length < 6) {
          paddedColors.push(...parsed);
        }
        return paddedColors;
      }
    }
    switch (preset) {
      case 'christmas': // Giáng Sinh: Đỏ và Xanh Noel tươi sáng, Vàng kim rực rỡ, Trắng tuyết
        return ['#EF4444', '#10B981', '#F59E0B', '#FFFFFF', '#3B82F6', '#DC2626'];
      case 'tet': // Tết Nguyên Đán: Đỏ tươi xuân, Vàng Hoàng kim nhạt, Hồng Đào ấm, Cam quýt ngọt
        return ['#FF4D4D', '#FFB703', '#FF85A2', '#FFFDF2', '#FF7A00', '#D90429'];
      case 'easter': // Phục Sinh: Vàng nắng sớm, Trắng huệ, Xanh lá non, Tím Phục Sinh vương giả
        return ['#FBBF24', '#FFFFFF', '#FEF3C7', '#4ADE80', '#A78BFA', '#FFFBEB'];
      case 'pentecost': // Hiện Xuống (7 Ơn): Đỏ lửa rực, Cam lửa ấm, Vàng hoa cúc, Trắng kem gió thánh
        return ['#FF3B30', '#FF9500', '#FFCC00', '#FFFDF5', '#FF5E00', '#E63946'];
      case 'lent': // Mùa Chay: Tím phụng vụ trầm, Oải hương nhạt, Xám tro bụi
        return ['#8B5CF6', '#6D28D9', '#C084FC', '#E5E7EB', '#DDD6FE', '#5B21B6'];
      case 'advent': // Mùa Vọng: Tím hoa cà đậm, Hồng Gaudete, Tím vương quyền, Xanh hy vọng
        return ['#A855F7', '#EC4899', '#7C3AED', '#10B981', '#F472B6', '#6B21A8'];
      case 'marian': // Đức Mẹ: Xanh trời dịu mát, Trắng dâng Mẹ tinh tuyền, Xanh Navy sâu thẳm, Xanh ngọc nhẹ
        return ['#3B82F6', '#FFFFFF', '#1D4ED8', '#60A5FA', '#FBBF24', '#1E40AF'];
      case 'joseph': // Thánh Giuse: Nâu đất sét, Nâu gỗ óc chó, Vàng rơm nhạt, Trắng sữa, Xanh thợ mộc
        return ['#B45309', '#854D0E', '#FBBF24', '#FFFDF9', '#059669', '#78350F'];
      case 'eucharist': // Thánh Thể: Vàng Mình Thánh Chúa rực rỡ, Trắng Mình Thánh, Đỏ rượu nho
        return ['#F59E0B', '#FFFFFA', '#D97706', '#FCD34D', '#EF4444', '#B45309'];
      case 'gold': // Cổ Điển / Mặc Định: Ngọc lục bảo & Vàng kim cao cấp
      default:
        return ['#059669', '#F59E0B', '#34D399', '#FFFDF5', '#047857', '#065F46'];
    }
  };

  const effectiveSlots = displaySlots && displaySlots > 0 ? displaySlots : (blessings.length || 12);

  // Parse raw text segment labels in real time for canvas preview
  const previewSegments = React.useMemo(() => {
    const listToUse = editorMode === 'bulk' ? parseRawTextToBlessings(rawText) : blessings;
    return listToUse.map((item, index) => {
      return item.category || `Mục ${index + 1}`;
    });
  }, [rawText, blessings, editorMode, parseRawTextToBlessings]);

  // Lọc câu lộc trong Grid
  const filteredBlessings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return blessings;
    return blessings.filter(
      b =>
        (b.category || '').toLowerCase().includes(query) ||
        (b.quote || '').toLowerCase().includes(query) ||
        (b.text || '').toLowerCase().includes(query)
    );
  }, [blessings, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredBlessings.length / pageSize) || 1;
  const paginatedBlessings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBlessings.slice(start, start + pageSize);
  }, [filteredBlessings, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      Promise.resolve().then(() => setCurrentPage(totalPages));
    }
  }, [totalPages, currentPage]);

  // Thêm câu lộc mới từ giao diện trực quan
  const handleAddBlessing = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      alert('Nội dung câu lộc không được để trống.');
      return;
    }
    const newBlessing: Blessing = {
      id: `temp-add-${Date.now()}`,
      wheel_id: wheelId || '',
      category: newCategory.trim() || 'Lời Chúa',
      quote: newQuote.trim(),
      text: newText.trim(),
      is_custom: true
    };
    const updatedList = [...blessings, newBlessing];
    setBlessings(updatedList);
    syncBlessingsToRawText(updatedList);

    setNewCategory('');
    setNewQuote('');
    setNewText('');
    showToastMsg('Đã thêm câu lộc vào danh sách.');

    // Chuyển đến trang cuối
    const newTotalPages = Math.ceil(updatedList.length / pageSize);
    setCurrentPage(newTotalPages);
  }, [newText, newCategory, newQuote, wheelId, blessings, syncBlessingsToRawText, showToastMsg, pageSize, setCurrentPage]);

  // Kích hoạt sửa inline
  const startEditInline = (item: Blessing) => {
    setEditingId(item.id);
    setEditCategory(item.category || '');
    setEditQuote(item.quote || '');
    setEditText(item.text || '');
  };

  // Lưu sửa inline
  const saveEditInline = (id: string) => {
    if (!editText.trim()) {
      alert('Nội dung câu lộc không được để trống.');
      return;
    }
    const updatedList = blessings.map(b => {
      if (b.id === id) {
        return {
          ...b,
          category: editCategory.trim() || 'Lời Chúa',
          quote: editQuote.trim(),
          text: editText.trim()
        };
      }
      return b;
    });
    setBlessings(updatedList);
    syncBlessingsToRawText(updatedList);
    setEditingId(null);
    showToastMsg('Đã cập nhật câu lộc.');
  };

  // Xóa câu lộc trong Grid
  const handleDeleteBlessing = (id: string) => {
    const updatedList = blessings.filter(b => b.id !== id);
    setBlessings(updatedList);
    syncBlessingsToRawText(updatedList);
    showToastMsg('Đã xóa câu lộc khỏi danh sách.');
  };

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
    ctx.rotate(rotationAngle); // Góc xoay động phục vụ quay thử

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

      let text: string;
      let fontSize: string;

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
  }, [previewSegments, themePreset, displaySlots, slotDisplayType, rotationAngle]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 2048, 2048, 0.82);
      setBackgroundUrl(compressed);
    } catch (err) {
      console.error('Lỗi nén ảnh nền:', err);
      alert('Không thể xử lý tệp ảnh này.');
    }
  };

  const handleWheelLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng ảnh logo quá lớn! Vui lòng chọn ảnh dưới 10MB.');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 512, 512, 0.88);
      setLogoUrl(compressed);
    } catch (err) {
      console.error('Lỗi nén logo vòng quay:', err);
      alert('Không thể xử lý tệp ảnh này.');
    }
  };

  // DIY Audio Handlers
  useEffect(() => {
    return () => {
      if (previewPlayPromiseRef.current) {
        previewPlayPromiseRef.current
          .then(() => {
            if (previewAudioRef.current) {
              previewAudioRef.current.pause();
            }
          })
          .catch(() => {
            if (previewAudioRef.current) {
              previewAudioRef.current.pause();
            }
          });
      } else if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (previewAudioContextRef.current) {
        previewAudioContextRef.current.close().catch(e => console.warn(e));
        previewAudioContextRef.current = null;
      }
    };
  }, []);

  const safePausePreview = React.useCallback(() => {
    if (previewPlayPromiseRef.current) {
      previewPlayPromiseRef.current
        .then(() => {
          if (previewAudioRef.current) {
            previewAudioRef.current.pause();
          }
          setIsBgmPreviewPlaying(false);
        })
        .catch(() => {
          if (previewAudioRef.current) {
            previewAudioRef.current.pause();
          }
          setIsBgmPreviewPlaying(false);
        });
    } else if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsBgmPreviewPlaying(false);
    } else {
      setIsBgmPreviewPlaying(false);
    }
  }, []);

  const toggleBgmPreview = async () => {
    const audio = previewAudioRef.current;
    if (isBgmPreviewPlaying || (audio && !audio.paused) || previewPlayPromiseRef.current) {
      safePausePreview();
    } else {
      if (previewPlayPromiseRef.current) return;

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }

      let audioUrl: string;
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

      const newAudio = new Audio(audioUrl);
      newAudio.volume = bgmVolume;
      newAudio.loop = true;
      newAudio.onended = () => setIsBgmPreviewPlaying(false);
      newAudio.onerror = (e) => {
        console.error('Audio loading error:', e);
        setIsBgmPreviewPlaying(false);
      };

      previewAudioRef.current = newAudio;
      const promise = newAudio.play();
      if (promise !== undefined) {
        previewPlayPromiseRef.current = promise;
        promise
          .then(() => {
            previewPlayPromiseRef.current = null;
            setIsBgmPreviewPlaying(true);
          })
          .catch(err => {
            previewPlayPromiseRef.current = null;
            setIsBgmPreviewPlaying(false);
            if (err.name !== 'AbortError') {
              console.error('BGM play failed:', err);
              alert('Không thể phát thử bài nhạc này. Vui lòng kiểm tra file nhạc hoặc kết nối.');
            }
          });
      }
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
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

        let audioUrl: string;
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

  const handleLoadPresetSmart = (
    presetType: 'gifts' | 'tet' | 'christmas' | 'easter' | 'lent' | 'advent' | 'marian' | 'joseph' | 'eucharist'
  ) => {
    if (!wheelId) return;

    let presetList: { category: string; quote: string; text: string; is_custom: boolean }[];

    if (presetType === 'gifts') {
      presetList = PENTECOST_BLESSINGS.map(b => ({
        category: `Ơn Thánh Thần`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'christmas') {
      presetList = CHRISTMAS_BLESSINGS.map(b => ({
        category: `Lộc Giáng Sinh`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'easter') {
      presetList = EASTER_BLESSINGS.map(b => ({
        category: `Lộc Phục Sinh`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'lent') {
      presetList = LENT_BLESSINGS.map(b => ({
        category: `Lộc Mùa Chay`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'advent') {
      presetList = ADVENT_BLESSINGS.map(b => ({
        category: `Lộc Mùa Vọng`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'marian') {
      presetList = MARIAN_BLESSINGS.map(b => ({
        category: `Lộc Đức Mẹ`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'joseph') {
      presetList = ST_JOSEPH_BLESSINGS.map(b => ({
        category: `Lộc Thánh Giuse`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else if (presetType === 'eucharist') {
      presetList = EUCHARIST_BLESSINGS.map(b => ({
        category: `Lộc Thánh Thể`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    } else {
      presetList = DEFAULT_BLESSINGS.filter(b => b.id !== 0).map(b => ({
        category: `Lộc Lời Chúa`,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
    }

    const append = window.confirm(
      `Hệ thống phát hiện preset này chứa ${presetList.length} câu lộc.\n\n- Click OK để THÊM NỐI TIẾP (Giữ lộc hiện tại, chèn thêm preset vào cuối).\n- Click CANCEL để chọn phương án ghi đè.`
    );

    let newList: Blessing[];

    const mappedTheme = presetType === 'gifts' ? 'pentecost' : presetType;
    const mappedCard = presetType === 'tet' ? 'tet' : presetType === 'christmas' ? 'christmas' : presetType === 'joseph' ? 'wood' : presetType === 'eucharist' ? 'gold' : 'default';

    if (append) {
      // Append
      const formattedPreset: Blessing[] = presetList.map((b, idx) => ({
        id: `preset-${idx}-${Date.now()}`,
        wheel_id: wheelId,
        category: b.category,
        quote: b.quote || '',
        text: b.text,
        is_custom: true
      }));
      newList = [...blessings, ...formattedPreset];
      setBlessings(newList);
      syncBlessingsToRawText(newList);

      // Cập nhật theme và card template nếu theme hiện tại đang ở mặc định 'gold'
      if (themePreset === 'gold') {
        setThemePreset(mappedTheme);
        setCardTemplate(mappedCard);
      }
      showToastMsg(`Đã thêm nối tiếp ${presetList.length} lộc vào danh sách nháp.`);
    } else {
      const overwrite = window.confirm(
        `Bạn có chắc chắn muốn GHI ĐÈ?\n(Hành động này sẽ XÓA SẠCH lộc hiện tại trong editor và nạp ${presetList.length} lộc mới của preset này. Bạn cần bấm "Lưu cấu hình" để chính thức áp dụng)`
      );
      if (overwrite) {
        const formattedPreset: Blessing[] = presetList.map((b, idx) => ({
          id: `preset-${idx}-${Date.now()}`,
          wheel_id: wheelId,
          category: b.category,
          quote: b.quote || '',
          text: b.text,
          is_custom: true
        }));
        newList = formattedPreset;
        setBlessings(newList);
        syncBlessingsToRawText(newList);

        // Cập nhật theme và card template tương ứng
        setThemePreset(mappedTheme);
        setCardTemplate(mappedCard);

        showToastMsg(`Đã nạp đè preset với ${presetList.length} lộc mới vào danh sách nháp.`);
      }
    }
  };

  // Quay thử (Test Spin)
  const handleTestSpin = () => {
    if (isTestSpinning || blessings.length === 0) return;
    setIsTestSpinning(true);
    setTestWinner(null);
    setShowTestWinnerModal(false);

    // Kích hoạt âm thanh
    let audioCtx: AudioContext | null = null;
    if (enableSound) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    const randomIndex = Math.floor(Math.random() * blessings.length);
    const winner = blessings[randomIndex];

    const displayLen = displaySlots && displaySlots > 0 ? displaySlots : blessings.length;
    const winnerIndexInDisplay = randomIndex % displayLen;
    const anglePerSegment = (2 * Math.PI) / displayLen;

    // pointer nằm ở bên phải (góc 0 radian)
    const targetAngle = 2 * Math.PI - (winnerIndexInDisplay + 0.5) * anglePerSegment;
    const finalAngle = targetAngle + Math.PI * 2 * 6; // Xoay 6 vòng

    const startTime = performance.now();
    const duration = 5000; // 5 giây
    const startAngle = testSpinAngleRef.current;

    let lastSegment = -1;
    let spinClickCount = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutCubic = (x: number): number => {
        return 1 - Math.pow(1 - x, 3);
      };

      const t = easeOutCubic(progress);
      const currentAngle = startAngle + (finalAngle - startAngle) * t;

      testSpinAngleRef.current = currentAngle;
      setRotationAngle(currentAngle);

      if (enableSound && audioCtx) {
        const currSegment = Math.floor(currentAngle / anglePerSegment);
        if (currSegment !== lastSegment) {
          spinClickCount++;
          playSynthesizedSpinSFX(audioCtx, spinSfxType, spinClickCount);
          lastSegment = currSegment;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTestSpinning(false);
        setTestWinner(winner);
        setShowTestWinnerModal(true);

        if (enableSound && audioCtx) {
          if (winSfxType === 'custom' && customWinSfxUrl) {
            dbService.getLocalWinSfx(wheelId!).then(blob => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                new Audio(url).play().catch(e => console.warn(e));
              }
            });
          } else {
            playSynthesizedWinSFX(audioCtx, winSfxType);
          }
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wheelId || !wheel || !parish) return;
    setSaveLoading(true);
    setSlugError(null);

    // Đồng bộ ngược từ rawText nếu đang mở tab Bulk khi lưu
    let finalBlessings = blessings;
    if (editorMode === 'bulk') {
      finalBlessings = syncRawTextToBlessings(rawText);
    }

    // Đảm bảo đồng bộ 1-1 theo số khung hiển thị nếu displaySlots > 0
    if (displaySlots > 0) {
      finalBlessings = syncToSegmentCount(finalBlessings, displaySlots);
      // Cập nhật lại state để hiển thị đúng trên canvas/giao diện sau khi lưu
      setBlessings(finalBlessings);
      syncBlessingsToRawText(finalBlessings);
    }

    try {
      const isUnique = await dbService.checkWheelSlugUnique(parish.id, slug, wheelId);
      if (!isUnique) {
        throw new Error('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }

      if (finalBlessings.length < 2) {
        throw new Error('Vui lòng nhập ít nhất 2 câu Lộc/Lời chúc.');
      }

      // 1. Lưu cấu hình bánh xe bao gồm cả trường cấu hình thiệp lộc
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
        slot_display_type: slotDisplayType,
        card_template: cardTemplate,
        card_text_color: cardTextColor,
        card_font_size: cardFontSize,
        card_greeting: cardGreeting,
        logo_url: logoUrl,
        spin_btn_text: spinBtnText,
        spinning_btn_text: spinningBtnText,
        view_result_btn_text: viewResultBtnText,
        recheck_btn_text: recheckBtnText,
        locked_desc: lockedDesc,
        custom_colors: customColors
      });

      // 2. Format và lưu blessings
      const parsedBlessingsList = finalBlessings.map(b => ({
        category: b.category || 'Mục',
        quote: b.quote || '',
        text: b.text,
        is_custom: true
      }));

      await dbService.saveBlessings(wheelId, parsedBlessingsList);

      // Build and upload consolidated JSON config
      if (supabase) {
        const consolidatedConfig = {
          parish,
          wheel: {
            ...wheel,
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
            slot_display_type: slotDisplayType,
            card_template: cardTemplate,
            card_text_color: cardTextColor,
            card_font_size: cardFontSize,
            card_greeting: cardGreeting,
            logo_url: logoUrl,
            spin_btn_text: spinBtnText,
            spinning_btn_text: spinningBtnText,
            view_result_btn_text: viewResultBtnText,
            recheck_btn_text: recheckBtnText,
            locked_desc: lockedDesc,
            custom_colors: customColors
          },
          blessings: parsedBlessingsList
        };

        const jsonStr = JSON.stringify(consolidatedConfig, null, 2);
        const fileBlob = new Blob([jsonStr], { type: 'application/json' });
        const filePath = `${parish.slug}/${slug}.json`;

        // If the slug changed, delete the old configuration file
        if (wheel.slug !== slug) {
          const oldFilePath = `${parish.slug}/${wheel.slug}.json`;
          await supabase.storage
            .from('configs')
            .remove([oldFilePath])
            .catch((err: unknown) => console.warn('Failed to delete old config JSON:', err));
        }

        const { error: uploadError } = await supabase.storage
          .from('configs')
          .upload(filePath, fileBlob, {
            contentType: 'application/json',
            upsert: true
          });

        if (uploadError) {
          console.error('Failed to upload consolidated config JSON to Supabase storage:', uploadError);
        }
      }

      // Remove draft from local storage after successful database save
      localStorage.removeItem(`vqlc_draft_${wheelId}`);
      setHasDraft(false);

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

  // Helper lấy cấu hình Style nền thiệp Preview
  const getCardBgStyle = (template: string, borderColors: string) => {
    switch (template) {
      case 'gold':
        return {
          background: 'radial-gradient(circle at center, #FFFDF0 0%, #F9F3D3 100%)',
          border: '3px solid #D8B43F',
          boxShadow: '0 10px 30px rgba(216, 180, 63, 0.15)'
        };
      case 'tet':
        return {
          background: 'radial-gradient(circle at center, #FFF5F5 0%, #FFE3E3 100%)',
          border: '3px solid #D32F2F',
          boxShadow: '0 10px 30px rgba(211, 47, 47, 0.15)'
        };
      case 'christmas':
        return {
          background: 'radial-gradient(circle at center, #F0FDF4 0%, #DCFCE7 100%)',
          border: '3px double #0F5E3D',
          boxShadow: '0 10px 30px rgba(15, 94, 61, 0.15)'
        };
      case 'wood':
        return {
          background: 'radial-gradient(circle at center, #FAF6F0 0%, #EFE5D3 100%)',
          border: '3px solid #8D6E63',
          boxShadow: '0 10px 30px rgba(141, 110, 99, 0.15)'
        };
      case 'default':
      default:
        return {
          background: 'radial-gradient(circle at center, rgba(255, 253, 246, 0.8) 0%, rgba(255, 245, 219, 0.7) 100%)',
          border: `2px solid ${borderColors}`,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
        };
    }
  };

  // Lấy câu lộc đầu tiên làm mẫu xem trước thiệp
  const previewBlessingSample = useMemo(() => {
    if (blessings.length > 0) return blessings[0];
    return {
      category: 'Ơn Khôn Ngoan',
      quote: 'Is 11,2',
      text: 'Thần khí Khôn Ngoan giúp anh/chị luôn biết chọn lựa điều lành theo ý muốn của Thiên Chúa trong mọi hoàn cảnh cuộc sống.'
    };
  }, [blessings]);

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

  const presetColors = getThemeColors(themePreset);
  const borderGold = themePreset === 'christmas' ? '#F59E0B' : presetColors[1] || '#D8B43F';
  const primaryDark = getDarkContrastColor(presetColors[0], themePreset);
  const cardBorderColor = getDarkContrastColor(borderGold, themePreset);

  const previewCardTextColor = cardTextColor || primaryDark;
  const previewCardFontSize = cardFontSize ? `${cardFontSize}px` : '17px';

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

        <button onClick={handleSaveConfig} className="btn btn-primary btn-gold header-save-btn" style={{ gap: '6px' }} disabled={saveLoading}>
          {saveLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Lưu Cấu Hình</span>
        </button>
      </header>

      {/* Workspace Area */}
      <main className="container" style={{ padding: '24px 16px', paddingBottom: '96px', flex: 1 }}>
        {hasDraft && (
          <div style={{
            background: 'rgba(216, 180, 63, 0.08)',
            border: '1px solid rgba(216, 180, 63, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(216, 180, 63, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(216, 180, 63, 0.15)', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} style={{ color: 'var(--color-gold)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--color-primary)' }}>Phát hiện bản nháp chưa lưu!</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                  Hệ thống tìm thấy một bản nháp tự động lưu trên trình duyệt này lúc <strong>{draftTime}</strong>.
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleRecoverDraft} 
                className="btn btn-primary btn-gold" 
                style={{ fontSize: '13px', padding: '8px 16px', gap: '6px', cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Khôi phục bản nháp
              </button>
              <button 
                onClick={handleDiscardDraft} 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', padding: '8px 16px', color: 'var(--color-error)', cursor: 'pointer' }}
              >
                Xóa bản nháp
              </button>
            </div>
          </div>
        )}
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
                    <option value="custom">🎨 Tự thiết lập màu sắc (Tùy biến)</option>
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

                {themePreset === 'custom' && (
                  <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'rgba(15, 61, 46, 0.03)', borderRadius: '12px', border: '1.5px dashed rgba(216, 180, 63, 0.4)', marginTop: '4px' }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px', marginBottom: 0 }}>🎨 Danh sách mã màu tùy biến (Hex, cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customColors}
                      onChange={(e) => setCustomColors(e.target.value)}
                      placeholder="#EF4444,#10B981,#F59E0B,#3B82F6"
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '40px', backgroundColor: '#FFFFFF' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', width: '100%', fontWeight: '600' }}>Gợi ý các bảng màu tươi sáng & hiện đại:</span>
                      <button
                        type="button"
                        onClick={() => setCustomColors('#FF5E36,#FFAE33,#E24E82,#7C3AED,#3B82F6')}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                      >
                        🌅 Hoàng hôn rực rỡ
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomColors('#0D9488,#14B8A6,#06B6D4,#3B82F6,#6366F1')}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                      >
                        💎 Ngọc lục bảo mát lạnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomColors('#F472B6,#FBBF24,#34D399,#60A5FA,#A78BFA')}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                      >
                        🌸 Hoa cỏ mùa xuân (Pastel)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomColors('#EC4899,#8B5CF6,#3B82F6,#10B981,#F59E0B')}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 10px', border: '1.5px solid rgba(216, 180, 63, 0.3)', cursor: 'pointer', backgroundColor: '#FFFFFF' }}
                      >
                        ⚡ Neon tương phản
                      </button>
                    </div>
                  </div>
                )}

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
                    onChange={(e) => handleDisplaySlotsChange(parseInt(e.target.value))}
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

                {/* Logo riêng Vòng Quay */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px dashed rgba(15, 61, 46, 0.08)', paddingTop: '16px' }}>
                  <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Logo riêng Vòng Quay (Ghi đè Logo của Giáo xứ)</label>
                  {logoUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(15, 61, 46, 0.03)', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(15, 61, 46, 0.1)' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={logoUrl} alt="Wheel Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Đang sử dụng logo riêng</span>
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                          <span>Xóa logo này</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        id="wheel-logo-file"
                        type="file"
                        accept="image/*"
                        onChange={handleWheelLogoFileChange}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="wheel-logo-file"
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
                        <Upload size={18} style={{ color: 'var(--color-gold)' }} />
                        <span style={{ fontSize: '13.5px', color: 'var(--color-primary)', fontWeight: '600' }}>
                          Tải logo riêng lên cho vòng quay này (Ghi đè logo chung)
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

              {/* Button Save inside Card */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(15, 61, 46, 0.08)' }}>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="btn btn-primary btn-gold"
                  style={{ gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  disabled={saveLoading}
                >
                  {saveLoading ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                  <span>Lưu cấu hình</span>
                </button>
              </div>
            </div>

            {/* DIY Audio Settings Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px', fontWeight: '800' }}>
                <Volume2 size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Thiết lập Âm thanh & Nhạc nền Vòng Quay</span>
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
                              safePausePreview();
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

             {/* Custom Labels Card */}
             <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
               <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px', fontWeight: '800' }}>
                 <Settings size={18} style={{ color: 'var(--color-gold)' }} />
                 <span>Cấu hình nhãn chữ nút bấm & thông báo</span>
               </h3>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Spin center buttons text customize */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingBottom: '16px', borderBottom: '1px dashed rgba(15, 61, 46, 0.08)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '13px' }}>Chữ nút Quay (Chưa quay)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={spinBtnText}
                      onChange={(e) => setSpinBtnText(e.target.value)}
                      placeholder="QUAY LỘC"
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '38px', fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '13px' }}>Chữ nút Quay (Đang quay)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={spinningBtnText}
                      onChange={(e) => setSpinningBtnText(e.target.value)}
                      placeholder="ĐANG QUAY"
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '38px', fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '13px' }}>Chữ nút ở giữa khi đã quay</label>
                    <input
                      type="text"
                      className="form-control"
                      value={viewResultBtnText}
                      onChange={(e) => setViewResultBtnText(e.target.value)}
                      placeholder="XEM LỘC ĐÃ NHẬN"
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Footer and message lock customize */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '13px' }}>Chữ nút "Xem lại Lộc Thánh của bạn" dưới vòng quay</label>
                    <input
                      type="text"
                      className="form-control"
                      value={recheckBtnText}
                      onChange={(e) => setRecheckBtnText(e.target.value)}
                      placeholder="Xem lại Lộc Thánh của bạn"
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', height: '38px', fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '13px' }}>Thông báo phụ khi giáo dân đã quay xong</label>
                    <textarea
                      className="form-control"
                      value={lockedDesc}
                      onChange={(e) => setLockedDesc(e.target.value)}
                      placeholder="Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất."
                      rows={2}
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', padding: '8px', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Blessings Editor Card */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
                <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <Sparkles size={16} />
                  <span>Danh sách Lộc Lời Chúa / Lời chúc ({blessings.length} mục)</span>
                </h3>
                {/* Switch editor mode tabs */}
                <div style={{ display: 'flex', background: 'rgba(15, 61, 46, 0.05)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('list')}
                    className={`btn ${editorMode === 'list' ? 'btn-gold' : ''}`}
                    style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: editorMode === 'list' ? 'var(--color-gold)' : 'transparent', color: editorMode === 'list' ? '#FFFFFF' : 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <BookOpen size={13} style={{ marginRight: '4px', display: 'inline' }} />
                    Quản lý trực quan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('segment')}
                    className={`btn ${editorMode === 'segment' ? 'btn-gold' : ''}`}
                    style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: editorMode === 'segment' ? 'var(--color-gold)' : 'transparent', color: editorMode === 'segment' ? '#FFFFFF' : 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <Sparkles size={13} style={{ marginRight: '4px', display: 'inline' }} />
                    Cấu hình lát cắt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('bulk')}
                    className={`btn ${editorMode === 'bulk' ? 'btn-gold' : ''}`}
                    style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: editorMode === 'bulk' ? 'var(--color-gold)' : 'transparent', color: editorMode === 'bulk' ? '#FFFFFF' : 'var(--color-primary)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <FileText size={13} style={{ marginRight: '4px', display: 'inline' }} />
                    Dán nhanh (Bulk)
                  </button>
                </div>
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
                  Nạp nhanh danh sách mẫu phụng vụ (Preset thông minh):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => handleLoadPresetSmart(opt.type)}
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

              {/* Mode list (Quản lý trực quan) */}
              {editorMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tìm kiếm & Thống kê */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Tìm kiếm câu lộc (phân loại, nội dung, trích dẫn)..."
                        className="form-control"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{ paddingLeft: '36px', height: '38px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                      />
                    </div>
                  </div>

                  {/* Bảng danh sách câu lộc */}
                  <div className="data-table-wrapper" style={{ border: '1px solid rgba(15, 61, 46, 0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(15, 61, 46, 0.04)' }}>
                          <th style={{ width: '60px', padding: '12px 16px' }}>STT</th>
                          <th style={{ width: '150px', padding: '12px 16px' }}>Lát cắt (Category)</th>
                          <th style={{ width: '120px', padding: '12px 16px' }}>Trích dẫn</th>
                          <th style={{ padding: '12px 16px' }}>Nội dung câu lộc</th>
                          <th style={{ width: '100px', padding: '12px 16px', textAlign: 'center' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBlessings.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                              Không tìm thấy câu lộc nào phù hợp.
                            </td>
                          </tr>
                        ) : (
                          paginatedBlessings.map((item, index) => {
                            const globalIndex = (currentPage - 1) * pageSize + index + 1;
                            const isEditing = editingId === item.id;

                            if (isEditing) {
                              return (
                                <tr key={item.id} style={{ backgroundColor: 'rgba(216, 180, 63, 0.08)' }}>
                                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{globalIndex}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      style={{ height: '32px', padding: '4px 8px', fontSize: '12px' }}
                                    />
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={editQuote}
                                      onChange={(e) => setEditQuote(e.target.value)}
                                      placeholder="Ga 3,16"
                                      style={{ height: '32px', padding: '4px 8px', fontSize: '12px' }}
                                    />
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <textarea
                                      className="form-control"
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      rows={2}
                                      style={{ fontSize: '12.5px', padding: '6px 8px', minHeight: '45px', resize: 'vertical' }}
                                    />
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => saveEditInline(item.id)}
                                        className="btn btn-success"
                                        style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                                        title="Lưu"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="btn btn-danger"
                                        style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#E5E7EB', color: '#374151', border: 'none', cursor: 'pointer' }}
                                        title="Hủy"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid rgba(15, 61, 46, 0.05)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--color-primary)' }}>{globalIndex}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{item.category}</td>
                                <td style={{ padding: '12px 16px', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>{item.quote || '—'}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', lineHeight: '1.5' }}>{item.text}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => startEditInline(item)}
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(216, 180, 63, 0.3)', cursor: 'pointer' }}
                                      title="Chỉnh sửa câu lộc này"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBlessing(item.id)}
                                      className="btn btn-danger"
                                      style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer' }}
                                      title="Xóa câu lộc này"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Phân trang */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Hiển thị {paginatedBlessings.length} trên tổng số {filteredBlessings.length} câu lộc
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="btn"
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, border: '1px solid rgba(15, 61, 46, 0.15)', background: '#FFFFFF', borderRadius: '6px' }}
                        >
                          <ChevronLeft size={14} />
                          <span>Trước</span>
                        </button>
                        <span style={{ fontSize: '13.5px', fontWeight: 'bold' }}>Trang {currentPage} / {totalPages}</span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="btn"
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, border: '1px solid rgba(15, 61, 46, 0.15)', background: '#FFFFFF', borderRadius: '6px' }}
                        >
                          <span>Sau</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form thêm nhanh câu lộc */}
                  <form onSubmit={handleAddBlessing} style={{ padding: '16px', backgroundColor: 'rgba(15, 61, 46, 0.02)', borderRadius: '8px', border: '1px solid rgba(15, 61, 46, 0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                      <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Thêm câu lộc / Lời chúc mới vào danh sách
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Tên lát cắt trên vòng quay</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ví dụ: Ơn Khôn Ngoan"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          style={{ height: '36px', fontSize: '13px' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11px', fontWeight: '600' }}>Trích dẫn kinh thánh / Số quà</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ví dụ: Is 11,2"
                          value={newQuote}
                          onChange={(e) => setNewQuote(e.target.value)}
                          style={{ height: '36px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: '600' }}>Nội dung câu lộc hiển thị trên thiệp</label>
                      <textarea
                        className="form-control"
                        placeholder="ví dụ: Thần khí Khôn Ngoan giúp anh/chị nhìn nhận mọi sự..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        rows={2}
                        required
                        style={{ fontSize: '13px', padding: '8px', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-gold"
                      style={{ alignSelf: 'flex-end', height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} />
                      <span>Thêm vào danh sách</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Mode Bulk (Dán nhanh qua Textarea) */}
              {editorMode === 'bulk' && (
                <div>
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
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '10px', minHeight: '260px', fontSize: '13px', lineHeight: '1.6' }}
                    />
                  </div>
                </div>
              )}

              {/* Mode Segment-based editing */}
              {editorMode === 'segment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    backgroundColor: 'rgba(216, 180, 63, 0.08)',
                    border: '1.5px solid rgba(216, 180, 63, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '8px'
                  }}>
                    <Sparkles size={18} style={{ color: '#D8B43F', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: 'var(--color-primary)', lineHeight: '1.5' }}>
                      <strong style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '2px', fontWeight: '700' }}>
                        Chế độ Cấu hình theo Lát cắt (Segment-based editing)
                      </strong>
                      Cấu hình trực tiếp nội dung tương ứng với từng lát cắt trên vòng quay (từ 1 đến {effectiveSlots}).
                      Hệ thống tự động liên kết 1-1 theo thứ tự sắp xếp, đảm bảo khi vòng quay dừng ở lát số nào thì hiển thị chính xác nội dung câu Lộc của lát đó.
                    </div>
                  </div>

                  {/* List of segments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Array.from({ length: effectiveSlots }).map((_, index) => {
                      const item = blessings[index] || { category: '', quote: '', text: '' };
                      const colors = getThemeColors(themePreset);
                      const sliceColor = colors[index % colors.length];
                      const contrastTextColor = getTextContrastColor(sliceColor, themePreset);

                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid rgba(15, 61, 46, 0.08)',
                            borderRadius: '10px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: sliceColor,
                                  color: contrastTextColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  border: '1px solid rgba(0,0,0,0.1)'
                                }}
                              >
                                {index + 1}
                              </div>
                              <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '14px' }}>
                                Lát cắt số {index + 1}
                              </span>
                            </div>
                            {displaySlots === 0 && blessings.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = blessings.filter((_, idx) => idx !== index);
                                  setBlessings(updated);
                                  syncBlessingsToRawText(updated);
                                  showToastMsg(`Đã xóa lát cắt số ${index + 1}.`);
                                }}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                              >
                                <Trash2 size={12} />
                                <span>Xóa lát</span>
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px', display: 'block' }}>
                                Tên hiển thị trên lát (Category)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={`Ví dụ: Lộc ${index + 1}`}
                                value={item.category || ''}
                                onChange={(e) => handleSegmentChange(index, 'category', e.target.value)}
                                style={{ height: '36px', fontSize: '13px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px', display: 'block' }}>
                                Trích dẫn (Quote)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Ví dụ: Ga 3,16"
                                value={item.quote || ''}
                                onChange={(e) => handleSegmentChange(index, 'quote', e.target.value)}
                                style={{ height: '36px', fontSize: '13px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px', display: 'block' }}>
                              Nội dung Lộc / Lời chúc (Text)
                            </label>
                            <textarea
                              className="form-control"
                              placeholder="Nhập câu Lộc hiển thị trên thiệp..."
                              value={item.text || ''}
                              onChange={(e) => handleSegmentChange(index, 'text', e.target.value)}
                              rows={2}
                              style={{ fontSize: '13px', padding: '8px', resize: 'vertical', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {displaySlots === 0 && (
                    <button
                      type="button"
                      onClick={handleAddSegment}
                      className="btn btn-primary btn-gold"
                      style={{
                        alignSelf: 'center',
                        marginTop: '12px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      <Plus size={16} />
                      <span>Thêm Lát Cắt Mới</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Canvas & Card preview */}
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
                  marginBottom: '16px',
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

                {/* Pointer arrow */}
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

              <button
                type="button"
                onClick={handleTestSpin}
                disabled={isTestSpinning || blessings.length === 0}
                className="btn btn-primary btn-gold"
                style={{
                  width: '100%',
                  maxWidth: '240px',
                  height: '40px',
                  fontWeight: '700',
                  gap: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isTestSpinning ? <Loader className="animate-spin" size={16} /> : <Eye size={16} />}
                <span>{isTestSpinning ? 'Đang quay...' : 'Quay Thử (Live Spin)'}</span>
              </button>

              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
                Nhấn "Quay Thử" để giả lập lượt quay và xem hiệu ứng trúng thiệp lộc thời gian thực.
              </div>
            </div>

            {/* Thiệp Lộc Config & Live Card Preview */}
            <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px', marginBottom: '16px', fontWeight: '800' }}>
                <Gift size={16} />
                <span>Thiết lập Thiệp Lộc & Xem Trước</span>
              </h3>

              {/* Form Config Thiệp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="card-template" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>Template background thiệp</label>
                    <select
                      id="card-template"
                      className="form-control"
                      value={cardTemplate}
                      onChange={(e) => setCardTemplate(e.target.value)}
                      style={{ height: '36px', fontSize: '12.5px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                    >
                      <option value="default">Default (Màu kem & Phụng vụ)</option>
                      <option value="gold">Gold (Sang trọng viền vàng kim)</option>
                      <option value="tet">Tết (Đỏ tươi hoa văn ngày xuân)</option>
                      <option value="christmas">Giáng Sinh (Xanh thông & Tuyết vàng)</option>
                      <option value="wood">Wood (Vân gỗ cổ điển ấm áp)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="card-font" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>Cỡ chữ nội dung thiệp (px)</label>
                    <select
                      id="card-font"
                      className="form-control"
                      value={cardFontSize}
                      onChange={(e) => setCardFontSize(e.target.value)}
                      style={{ height: '36px', fontSize: '12.5px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                    >
                      <option value="13">13px (Nhỏ gọn)</option>
                      <option value="15">15px (Vừa phải)</option>
                      <option value="17">17px (Rõ ràng - Khuyên dùng)</option>
                      <option value="19">19px (Lớn)</option>
                      <option value="21">21px (Rất lớn)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="card-color" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Màu sắc chữ thiệp lộc</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(Để trống để dùng màu tự động)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="color"
                      value={cardTextColor || '#0f3d2e'}
                      onChange={(e) => setCardTextColor(e.target.value)}
                      style={{ width: '40px', height: '36px', padding: 0, border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      placeholder="Nhập mã màu HEX, VD: #0F3D2E"
                      value={cardTextColor}
                      onChange={(e) => setCardTextColor(e.target.value)}
                      className="form-control"
                      style={{ height: '36px', fontSize: '12.5px', flex: 1, border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                    />
                    {cardTextColor && (
                      <button
                        type="button"
                        onClick={() => setCardTextColor('')}
                        className="btn btn-secondary"
                        style={{ height: '36px', padding: '0 10px', fontSize: '12px' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="card-greeting" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>Lời chúc riêng chân thiệp</label>
                  <textarea
                    id="card-greeting"
                    className="form-control"
                    placeholder="ví dụ: Kính chúc quý cộng đoàn một năm mới an khang..."
                    value={cardGreeting}
                    onChange={(e) => setCardGreeting(e.target.value)}
                    rows={2}
                    style={{ fontSize: '12.5px', padding: '8px', resize: 'vertical', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  />
                </div>
              </div>

              {/* Live Preview Thiệp Lộc */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', borderTop: '1px dashed rgba(15, 61, 46, 0.1)', paddingTop: '16px' }}>
                <div
                  style={{
                    ...getCardBgStyle(cardTemplate, cardBorderColor),
                    borderRadius: '20px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: '320px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      border: `1.5px solid ${cardBorderColor}`,
                      borderRadius: '14px',
                      padding: '16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      boxSizing: 'border-box',
                      width: '100%',
                      minHeight: '260px',
                      justifyContent: 'center'
                    }}
                  >
                    <CornerOrnamentSVG style={{ top: '6px', left: '6px', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                    <CornerOrnamentSVG style={{ top: '6px', right: '6px', transform: 'scaleX(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                    <CornerOrnamentSVG style={{ bottom: '6px', left: '6px', transform: 'scaleY(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                    <CornerOrnamentSVG style={{ bottom: '6px', right: '6px', transform: 'scaleX(-1) scaleY(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />

                    <svg viewBox="0 0 24 24" width="28" height="28" style={{ color: cardBorderColor, marginBottom: '6px' }} fill="currentColor">
                      <path d="M12,5 A1.2,1.2 0 1,1 12,2.6 A1.2,1.2 0 1,1 12,5 Z" />
                      <path d="M5,12 A1.2,1.2 0 1,1 2.6,12 A1.2,1.2 0 1,1 5,12 Z" />
                      <path d="M21.4,12 A1.2,1.2 0 1,1 19,12 A1.2,1.2 0 1,1 21.4,12 Z" />
                      <path d="M11,5 L13,5 L13,11 L19,11 L19,13 L13,13 L13,19 C13,19.6 12.6,20.1 12,20.1 C11.4,20.1 10.9,19.6 10.9,19 L10.9,13 L5,13 L5,11 L11,11 Z" />
                      <path d="M12,8.5 L15.5,12 L12,15.5 L8.5,12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    </svg>

                    <div style={{ color: previewCardTextColor, fontWeight: 700, fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px', fontFamily: "'Inter', sans-serif" }}>
                      {parish?.name}
                    </div>

                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 800, color: previewCardTextColor, margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                      LỘC LỜI CHÚA
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', width: '50%', margin: '0 auto 8px auto', gap: '6px' }}>
                      <div style={{ height: '1px', flex: 1, background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)` }}></div>
                      <span style={{ color: cardBorderColor, fontSize: '8px' }}>✦</span>
                      <div style={{ height: '1px', flex: 1, background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)` }}></div>
                    </div>

                    <div style={{ fontSize: '9px', fontWeight: 800, color: getTextContrastColor(presetColors[0], themePreset), background: presetColors[0], padding: '4px 10px', borderRadius: '12px', marginBottom: '10px', border: `1.2px solid ${cardBorderColor}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {previewBlessingSample.category}
                    </div>

                    <p style={{ fontSize: previewCardFontSize, lineHeight: '1.5', color: previewCardTextColor, fontStyle: 'italic', margin: '4px 0 8px 0', padding: '0 8px', fontWeight: 500 }}>
                      “ {previewBlessingSample.text} ”
                    </p>

                    {previewBlessingSample.quote && (
                      <p style={{ fontWeight: '700', fontSize: '11.5px', color: previewCardTextColor, marginTop: '2px', marginBottom: '10px', fontStyle: 'italic' }}>
                        — {previewBlessingSample.quote}
                      </p>
                    )}

                    <div style={{ height: '1px', width: '30%', background: `linear-gradient(to right, transparent, ${cardBorderColor}60, transparent)`, margin: '0 auto 8px auto' }}></div>

                    <p style={{ fontSize: '9px', color: previewCardTextColor, fontWeight: '500', fontStyle: 'italic', lineHeight: '1.4', margin: 0, opacity: 0.85, whiteSpace: 'pre-line' }}>
                      {cardGreeting || parish?.greeting || 'Kính chúc quý cộng đoàn một năm mới bình an,\nđầy tràn ân sủng của Thiên Chúa!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Short info / Share Card */}
            {(() => {
              const productionUrl = getProductionUrl();
              const encodedParishSlug = encodeURIComponent(parish?.slug || '');
              const encodedWheelSlug = encodeURIComponent(slug || '');
              const wheelUrl = `${productionUrl}/giao-xu/${encodedParishSlug}/vong-quay/${encodedWheelSlug}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wheelUrl)}`;
              return (
                <div className="card" style={{ background: 'var(--color-primary)', color: '#FFFFFF', border: '2px double var(--color-gold)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.15)', position: 'relative' }}>
                  <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', top: '8px', left: '8px' }}></div>
                  <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', top: '8px', right: '8px' }}></div>
                  <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', left: '8px' }}></div>
                  <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '8px', height: '8px', bottom: '8px', right: '8px' }}></div>

                  <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-gold)', marginBottom: '8px', fontWeight: '800' }}>Đường Dẫn Chia Sẻ Giáo Dân</h3>
                  <p style={{ fontSize: '12.5px', opacity: 0.85, lineHeight: '1.6', marginBottom: '16px' }}>
                    Giáo dân quét mã QR hoặc truy cập đường dẫn này để nhận Lộc Lời Chúa. Bạn có thể sao chép liên kết hoặc in mã QR.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '160px',
                      height: '160px',
                      border: '2.5px double var(--color-gold)',
                      borderRadius: '12px',
                      padding: '8px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      <img
                        src={qrUrl}
                        alt={`Mã QR ${title}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div>Friendly URL:</div>
                    <div style={{ color: 'var(--color-gold)', wordBreak: 'break-all' }}>
                      {wheelUrl}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '16px' }}>
                    <button
                      onClick={() => downloadQRCode(qrUrl, `qr-${slug}.png`)}
                      className="btn btn-gold"
                      style={{ fontSize: '13px', padding: '8px 12px', width: '100%', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                    >
                      <Download size={14} />
                      Tải ảnh QR Code
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          const success = await copyToClipboard(wheelUrl);
                          if (success) {
                            showToastMsg('Đã sao chép liên kết!');
                          } else {
                            showToastMsg('Không thể tự động sao chép.');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '12px', padding: '8px 12px', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF' }}
                      >
                        <Copy size={13} />
                        Sao chép liên kết
                      </button>

                      <a
                        href={`/giao-xu/${encodedParishSlug}/vong-quay/${encodedWheelSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-gold"
                        style={{ flex: 1, fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                      >
                        Kiểm tra trang Quay
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}

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

      {/* Modal hiển thị thiệp lộc khi Quay Thử (Test Spin) */}
      {showTestWinnerModal && testWinner && (
        <div
          onClick={() => setShowTestWinnerModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...getCardBgStyle(cardTemplate, cardBorderColor),
              borderRadius: '24px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: '420px',
              position: 'relative'
            }}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setShowTestWinnerModal(false)}
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
                zIndex: 10
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div style={{ border: `1px solid ${cardBorderColor}a0`, borderRadius: '16px', padding: '4px', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  border: `1.5px solid ${cardBorderColor}`,
                  borderRadius: '12px',
                  padding: '28px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  width: '100%',
                  minHeight: '340px',
                  justifyContent: 'center'
                }}
              >
                <CornerOrnamentSVG style={{ top: '8px', left: '8px', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                <CornerOrnamentSVG style={{ top: '8px', right: '8px', transform: 'scaleX(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                <CornerOrnamentSVG style={{ bottom: '8px', left: '8px', transform: 'scaleY(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />
                <CornerOrnamentSVG style={{ bottom: '8px', right: '8px', transform: 'scaleX(-1) scaleY(-1)', color: cardBorderColor }} isChristmas={cardTemplate === 'christmas'} />

                <svg viewBox="0 0 24 24" width="36" height="36" style={{ color: cardBorderColor, marginBottom: '10px' }} fill="currentColor">
                  <path d="M12,5 A1.2,1.2 0 1,1 12,2.6 A1.2,1.2 0 1,1 12,5 Z" />
                  <path d="M5,12 A1.2,1.2 0 1,1 2.6,12 A1.2,1.2 0 1,1 5,12 Z" />
                  <path d="M21.4,12 A1.2,1.2 0 1,1 19,12 A1.2,1.2 0 1,1 21.4,12 Z" />
                  <path d="M11,5 L13,5 L13,11 L19,11 L19,13 L13,13 L13,19 C13,19.6 12.6,20.1 12,20.1 C11.4,20.1 10.9,19.6 10.9,19 L10.9,13 L5,13 L5,11 L11,11 Z" />
                  <path d="M12,8.5 L15.5,12 L12,15.5 L8.5,12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </svg>

                <div style={{ color: previewCardTextColor, fontWeight: 700, fontSize: '10.5px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
                  {parish?.name}
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 800, color: previewCardTextColor, margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                  LỘC LỜI CHÚA
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', width: '60%', margin: '0 auto 12px auto', gap: '8px' }}>
                  <div style={{ height: '1px', flex: 1, background: `linear-gradient(to right, transparent, ${cardBorderColor}, transparent)` }}></div>
                  <span style={{ color: cardBorderColor, fontSize: '9px' }}>✦</span>
                  <div style={{ height: '1px', flex: 1, background: `linear-gradient(to left, transparent, ${cardBorderColor}, transparent)` }}></div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 800, color: getTextContrastColor(presetColors[0], themePreset), background: presetColors[0], padding: '6px 14px', borderRadius: '16px', marginBottom: '16px', border: `1.2px solid ${cardBorderColor}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {testWinner.category}
                </div>

                <p style={{ fontSize: previewCardFontSize, lineHeight: '1.6', color: previewCardTextColor, fontStyle: 'italic', margin: '6px 0 10px 0', padding: '0 12px', fontWeight: 500 }}>
                  “ {testWinner.text} ”
                </p>

                {testWinner.quote && (
                  <p style={{ fontWeight: '700', fontSize: '13px', color: previewCardTextColor, marginTop: '4px', marginBottom: '14px', fontStyle: 'italic' }}>
                    — {testWinner.quote}
                  </p>
                )}

                <div style={{ height: '1px', width: '35%', background: `linear-gradient(to right, transparent, ${cardBorderColor}80, transparent)`, margin: '0 auto 12px auto' }}></div>

                <p style={{ fontSize: '10px', color: previewCardTextColor, fontWeight: '500', fontStyle: 'italic', lineHeight: '1.5', margin: 0, opacity: 0.85, whiteSpace: 'pre-line' }}>
                  {cardGreeting || parish?.greeting || 'Kính chúc quý cộng đoàn một năm mới bình an,\nđầy tràn ân sủng của Thiên Chúa!'}
                </p>

                <div style={{ marginTop: '14px', fontSize: '8.5px', color: `${cardBorderColor}b0`, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Chế độ Quay Thử • Vòng Quay Lời Chúa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Save Bar */}
      <div className="sticky-save-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="sticky-save-bar-title">
          <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>
            Vòng quay: <strong>{title || wheel.title}</strong>
          </span>
          {hasDraft && (
            <span style={{ fontSize: '11px', backgroundColor: 'rgba(216, 180, 63, 0.15)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              Có bản nháp chưa lưu
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end', maxWidth: '400px' }}>
          <button
            onClick={handleSaveConfig}
            className="btn btn-primary btn-gold"
            style={{
              gap: '8px',
              flex: 1,
              height: '42px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '10px',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            disabled={saveLoading}
          >
            {saveLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};
