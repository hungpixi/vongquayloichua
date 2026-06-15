import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import type { Wheel, SpinHistory } from '../services/db';
import { supabase } from '../services/supabaseClient';
import {
  Church,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Compass,
  BarChart3,
  X,
  Loader,
  Clipboard,
  Settings,
  Save,
  BookOpen,
  QrCode,
  Edit,
  Search,
  Download,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Calendar
} from 'lucide-react';
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

const FacebookIcon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }> = ({ size = 16, style, className }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }> = ({ size = 16, style, className }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);



interface CustomPreset {
  id: string;
  name: string;
  blessings: {
    category: string;
    quote?: string;
    text: string;
  }[];
}

interface CombinedLog extends SpinHistory {
  wheelTitle: string;
}

const generatePresetId = () => 'custom-' + Math.random().toString(36).substring(2, 9);

export const AdminDashboard: React.FC = () => {
  const { user, parish, parishes, setCurrentParish, createParish, signOut, refreshParishes } = useAuth();
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'parish' | 'presets' | 'analytics' | 'gcc_guide'>('dashboard');

  // Parish Settings States
  const [parishName, setParishName] = useState('');
  const [parishSlug, setParishSlug] = useState('');
  const [parishLogo, setParishLogo] = useState('');
  const [parishBackground, setParishBackground] = useState('');
  const [parishAddress, setParishAddress] = useState('');
  const [parishPhone, setParishPhone] = useState('');
  const [parishFacebook, setParishFacebook] = useState('');
  const [parishYoutube, setParishYoutube] = useState('');
  const [parishGreeting, setParishGreeting] = useState('');
  const [parishSaveLoading, setParishSaveLoading] = useState(false);

  // Realtime slug checking states
  const [slugIsUnique, setSlugIsUnique] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Mass Schedule widget states
  interface MassScheduleItem {
    id: string;
    title: string;
    time: string;
  }
  const [massSchedule, setMassSchedule] = useState<MassScheduleItem[]>([]);
  const [newMassTitle, setNewMassTitle] = useState('');
  const [newMassTime, setNewMassTime] = useState('');

  // Presets Preview State
  const [selectedPresetTab, setSelectedPresetTab] = useState<'gifts' | 'tet' | 'christmas' | 'easter' | 'lent' | 'advent' | 'marian' | 'joseph' | 'eucharist'>('gifts');
  const [presetsMode, setPresetsMode] = useState<'system' | 'custom'>('system');

  // Custom Presets Library States
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => {
    const loaded = localStorage.getItem('local_custom_presets');
    if (loaded) {
      try {
        return JSON.parse(loaded);
      } catch (e) {
        console.error('Lỗi khi đọc custom presets:', e);
      }
    }
    return [];
  });
  const [selectedCustomPresetId, setSelectedCustomPresetId] = useState<string | null>(() => {
    const loaded = localStorage.getItem('local_custom_presets');
    if (loaded) {
      try {
        const parsed = JSON.parse(loaded);
        if (parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {
        console.error('Lỗi khi đọc custom presets:', e);
      }
    }
    return null;
  });

  // Custom Presets CRUD Modal states
  const [showNewPresetModal, setShowNewPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Individual Blessing Form states
  const [showBlessingModal, setShowBlessingModal] = useState(false);
  const [blessingModalMode, setBlessingModalMode] = useState<'create' | 'edit'>('create');
  const [editingBlessingIndex, setEditingBlessingIndex] = useState<number | null>(null);
  const [blessingCategory, setBlessingCategory] = useState('');
  const [blessingQuote, setBlessingQuote] = useState('');
  const [blessingText, setBlessingText] = useState('');

  // Apply preset to wheel states
  const [applyWheelId, setApplyWheelId] = useState<string>('');

  // Search & Filter for Statistics Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWheelId, setFilterWheelId] = useState('all');

  // Combined logs state for all wheels
  const [combinedLogs, setCombinedLogs] = useState<CombinedLog[]>([]);

  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [spinCounts, setSpinCounts] = useState<{ [wheelId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Code 2FA States
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteRemaining, setInviteRemaining] = useState<number>(0);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPreset, setNewPreset] = useState<'gifts' | 'tet' | 'empty'>('gifts');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newWheelSlugError, setNewWheelSlugError] = useState<string | null>(null);
  const [checkingWheelSlug, setCheckingWheelSlug] = useState(false);

  const checkNewWheelSlugUniqueness = async (val: string) => {
    if (!parish || !val) return;
    setCheckingWheelSlug(true);
    setNewWheelSlugError(null);
    try {
      const isUnique = await dbService.checkWheelSlugUnique(parish.id, val);
      if (!isUnique) {
        setNewWheelSlugError('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingWheelSlug(false);
    }
  };

  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);

  // New Parish Modal States
  const [showNewParishModal, setShowNewParishModal] = useState(false);
  const [newParishName, setNewParishName] = useState('');
  const [newParishSlug, setNewParishSlug] = useState('');
  const [newParishError, setNewParishError] = useState<string | null>(null);
  const [newParishLoading, setNewParishLoading] = useState(false);
  const [checkingNewParishSlug, setCheckingNewParishSlug] = useState(false);
  const [newParishSlugError, setNewParishSlugError] = useState<string | null>(null);

  const saveCustomPresets = (updated: CustomPreset[]) => {
    setCustomPresets(updated);
    localStorage.setItem('local_custom_presets', JSON.stringify(updated));
  };

  const handleCreateCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    
    const newPreset: CustomPreset = {
      id: generatePresetId(),
      name: newPresetName.trim(),
      blessings: []
    };
    
    const updated = [...customPresets, newPreset];
    saveCustomPresets(updated);
    setSelectedCustomPresetId(newPreset.id);
    setNewPresetName('');
    setShowNewPresetModal(false);
    showToastMsg('Tạo bộ lộc tự chọn thành công!');
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ lộc tự chọn này?')) return;
    const updated = customPresets.filter(p => p.id !== presetId);
    saveCustomPresets(updated);
    if (selectedCustomPresetId === presetId) {
      setSelectedCustomPresetId(updated.length > 0 ? updated[0].id : null);
    }
    showToastMsg('Đã xóa bộ lộc tự chọn.');
  };

  const handleOpenAddBlessing = () => {
    setBlessingModalMode('create');
    setBlessingCategory('');
    setBlessingQuote('');
    setBlessingText('');
    setEditingBlessingIndex(null);
    setShowBlessingModal(true);
  };

  const handleOpenEditBlessing = (index: number) => {
    if (!selectedCustomPresetId) return;
    const preset = customPresets.find(p => p.id === selectedCustomPresetId);
    if (!preset) return;
    const blessing = preset.blessings[index];
    if (!blessing) return;
    
    setBlessingModalMode('edit');
    setBlessingCategory(blessing.category);
    setBlessingQuote(blessing.quote || '');
    setBlessingText(blessing.text);
    setEditingBlessingIndex(index);
    setShowBlessingModal(true);
  };

  const handleSaveBlessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomPresetId) return;
    if (!blessingText.trim()) {
      alert('Nội dung Lời Chúa / Lời chúc không được để trống.');
      return;
    }
    
    const updatedPresets = customPresets.map(preset => {
      if (preset.id !== selectedCustomPresetId) return preset;
      
      const newBlessing = {
        category: blessingCategory.trim() || `Lộc ${preset.blessings.length + 1}`,
        quote: blessingQuote.trim() || undefined,
        text: blessingText.trim()
      };
      
      const newBlessings = [...preset.blessings];
      if (blessingModalMode === 'edit' && editingBlessingIndex !== null) {
        newBlessings[editingBlessingIndex] = newBlessing;
      } else {
        newBlessings.push(newBlessing);
      }
      
      return {
        ...preset,
        blessings: newBlessings
      };
    });
    
    saveCustomPresets(updatedPresets);
    setShowBlessingModal(false);
    showToastMsg(blessingModalMode === 'edit' ? 'Đã cập nhật câu lộc!' : 'Đã thêm câu lộc mới!');
  };

  const handleDeleteBlessing = (index: number) => {
    if (!selectedCustomPresetId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu lộc này?')) return;
    
    const updatedPresets = customPresets.map(preset => {
      if (preset.id !== selectedCustomPresetId) return preset;
      return {
        ...preset,
        blessings: preset.blessings.filter((_, idx) => idx !== index)
      };
    });
    
    saveCustomPresets(updatedPresets);
    showToastMsg('Đã xóa câu lộc.');
  };

  const handleApplyPresetToWheel = async () => {
    if (!selectedCustomPresetId || !applyWheelId) return;
    const preset = customPresets.find(p => p.id === selectedCustomPresetId);
    if (!preset) return;
    if (preset.blessings.length < 2) {
      alert('Bộ lộc phải có nhất 2 câu để nạp vào vòng quay.');
      return;
    }
    const targetWheel = wheels.find(w => w.id === applyWheelId);
    if (!targetWheel) return;
    
    if (!window.confirm(`Hành động này sẽ XÓA TOÀN BỘ danh sách lộc cũ của vòng quay "${targetWheel.title}" để nạp từ bộ lộc "${preset.name}". Bạn có chắc chắn?`)) return;
    
    setLoading(true);
    try {
      const payload = preset.blessings.map(b => ({
        category: b.category,
        quote: b.quote,
        text: b.text,
        is_custom: true
      }));
      await dbService.saveBlessings(applyWheelId, payload);
      showToastMsg(`Đã nạp bộ lộc "${preset.name}" vào vòng quay thành công!`);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Không thể áp dụng bộ lộc cho vòng quay này.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySystemPresetToWheel = async () => {
    if (!applyWheelId) return;
    const targetWheel = wheels.find(w => w.id === applyWheelId);
    if (!targetWheel) return;
    
    const presetNameMap = {
      gifts: 'Bảy Ơn Chúa Thánh Thần',
      tet: '100 Lộc Tết Lời Chúa',
      christmas: 'Lộc Giáng Sinh',
      easter: 'Lộc Phục Sinh',
      lent: 'Lộc Mùa Chay',
      advent: 'Lộc Mùa Vọng',
      marian: 'Lộc Kính Đức Mẹ',
      joseph: 'Lộc Thánh Giuse',
      eucharist: 'Lộc Thánh Thể'
    };
    const label = presetNameMap[selectedPresetTab];
    
    if (!window.confirm(`Hành động này sẽ XÓA TOÀN BỘ danh sách lộc cũ của vòng quay "${targetWheel.title}" để nạp bộ "${label}". Bạn có chắc chắn?`)) return;
    
    setLoading(true);
    try {
      await dbService.loadDefaultBlessingsPreset(applyWheelId, selectedPresetTab);
      showToastMsg(`Đã nạp bộ "${label}" vào vòng quay thành công!`);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Không thể nạp bộ lộc cho vòng quay này.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async (url: string, filename: string) => {
    try {
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
    }
  };

  const filteredLogs = React.useMemo(() => {
    return combinedLogs.filter(log => {
      const matchesWheel = filterWheelId === 'all' || log.wheel_id === filterWheelId;
      const matchesQuery = log.item_spun.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.wheelTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWheel && matchesQuery;
    });
  }, [combinedLogs, filterWheelId, searchQuery]);

  const exportLogsToCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ['STT', 'Vong quay', 'Lat trung', 'Thoi gian'];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      `"${log.wheelTitle.replace(/"/g, '""')}"`,
      `"${log.item_spun.replace(/"/g, '""')}"`,
      `"${new Date(log.created_at || '').toLocaleString('vi-VN')}"`
    ]);
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lich-su-quay-loc-${parish?.slug || 'giao-xu'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('Đã xuất lịch sử ra file CSV!');
  };

  const fetchDashboardData = React.useCallback(async () => {
    if (!parish) return;
    setLoading(true);
    setError(null);
    try {
      const list = await dbService.getWheels(parish.id);
      setWheels(list);

      // Fetch spin statistics and logs for each wheel
      const counts: { [wheelId: string]: number } = {};
      const allLogs: CombinedLog[] = [];
      for (const w of list) {
        const history = await dbService.getSpinHistory(w.id);
        counts[w.id] = history.length;
        history.forEach((log) => {
          allLogs.push({
            ...log,
            wheelTitle: w.title
          });
        });
      }

      // Sort combined logs by date descending
      allLogs.sort((a, b) => {
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setCombinedLogs(allLogs);
      setSpinCounts(counts);
      if (list.length > 0) {
        setApplyWheelId(prev => prev || list[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách vòng quay.');
    } finally {
      setLoading(false);
    }
  }, [parish]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, navigate, fetchDashboardData]);

  const fetchInviteCode = async () => {
    try {
      setInviteLoading(true);
      let token = '';
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || '';
      }
      const response = await fetch('/api/get-invite', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setInviteCode(data.code);
        setInviteRemaining(data.secondsRemaining);
      }
    } catch (err) {
      console.error('Lỗi lấy mã mời:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInviteCode();
    }
  }, [user]);

  useEffect(() => {
    if (inviteRemaining <= 0) {
      if (user && inviteCode) {
        fetchInviteCode();
      }
      return;
    }

    const interval = setInterval(() => {
      setInviteRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inviteRemaining, user, inviteCode]);

  // Sync parish info to local states when loaded
  useEffect(() => {
    if (parish) {
      Promise.resolve().then(() => {
        setParishName(parish.name || '');
        setParishSlug(parish.slug || '');
        setParishLogo(parish.logo_url || '');
        setParishBackground(parish.background_url || '');
        setParishAddress(parish.address || '');
        setParishPhone(parish.phone || '');
        setParishFacebook(parish.facebook_url || '');
        setParishYoutube(parish.youtube_url || '');
        setParishGreeting(parish.greeting || '');

        try {
          if (parish.mass_schedule) {
            setMassSchedule(JSON.parse(parish.mass_schedule));
          } else {
            setMassSchedule([]);
          }
        } catch (e) {
          console.error('Lỗi parse mass_schedule:', e);
          setMassSchedule([]);
        }
      });
    }
  }, [parish]);

  // Realtime slug verification
  useEffect(() => {
    if (!parishSlug || !parish) {
      Promise.resolve().then(() => setSlugIsUnique(null));
      return;
    }
    if (parishSlug === parish.slug) {
      Promise.resolve().then(() => setSlugIsUnique(true));
      return;
    }

    const checkUnique = async () => {
      setIsCheckingSlug(true);
      try {
        const isUnique = await dbService.checkParishSlugUnique(parishSlug, parish.id);
        setSlugIsUnique(isUnique);
      } catch (err) {
        console.error('Lỗi check slug:', err);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkUnique, 400);
    return () => clearTimeout(timer);
  }, [parishSlug, parish]);

  // Realtime check unique slug for New Parish
  useEffect(() => {
    if (!newParishSlug || !showNewParishModal) {
      Promise.resolve().then(() => setNewParishSlugError(null));
      return;
    }

    const checkUnique = async () => {
      setCheckingNewParishSlug(true);
      try {
        const isUnique = await dbService.checkParishSlugUnique(newParishSlug);
        if (!isUnique) {
          setNewParishSlugError('Đường dẫn này đã được sử dụng.');
        } else {
          setNewParishSlugError(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingNewParishSlug(false);
      }
    };

    const timer = setTimeout(checkUnique, 400);
    return () => clearTimeout(timer);
  }, [newParishSlug, showNewParishModal]);

  const handleNewParishNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewParishName(val);
    const clean = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setNewParishSlug(clean);
    setNewParishSlugError(null);
  };

  const handleCreateParishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParishName.trim() || !newParishSlug.trim()) return;
    setNewParishLoading(true);
    setNewParishError(null);
    setNewParishSlugError(null);

    try {
      const isUnique = await dbService.checkParishSlugUnique(newParishSlug);
      if (!isUnique) {
        setNewParishSlugError('Đường dẫn Giáo xứ đã tồn tại. Vui lòng chọn đường dẫn khác.');
        setNewParishLoading(false);
        return;
      }

      await createParish(newParishName.trim(), newParishSlug.trim());
      showToastMsg('Tạo Giáo xứ mới thành công!');
      setShowNewParishModal(false);
      setNewParishName('');
      setNewParishSlug('');
    } catch (err) {
      console.error(err);
      setNewParishError(err instanceof Error ? err.message : 'Tạo Giáo xứ thất bại.');
    } finally {
      setNewParishLoading(false);
    }
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTitle(val);
    const clean = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setNewSlug(clean);
  };

  const handleCreateWheel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parish) return;
    setModalLoading(true);
    setModalError(null);
    setNewWheelSlugError(null);

    try {
      const isUnique = await dbService.checkWheelSlugUnique(parish.id, newSlug);
      if (!isUnique) {
        throw new Error('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }
      const createdWheel = await dbService.createWheel(parish.id, newTitle, newSlug, newDesc);

      // Load selected preset type
      if (newPreset === 'gifts') {
        await dbService.loadDefaultBlessingsPreset(createdWheel.id, 'gifts');
      } else if (newPreset === 'tet') {
        await dbService.loadDefaultBlessingsPreset(createdWheel.id, 'tet');
      }

      showToastMsg('Tạo vòng quay mới thành công!');
      setShowAddModal(false);

      // Reset form
      setNewTitle('');
      setNewSlug('');
      setNewDesc('');
      setNewPreset('gifts');

      // Refresh list
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Tạo vòng quay thất bại.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteWheel = async (wheelId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vòng quay này? Lịch sử và lộc tương ứng sẽ bị ẩn đi.')) return;
    try {
      await dbService.deleteWheelSoft(wheelId);
      showToastMsg('Đã xóa vòng quay.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToastMsg('Xóa vòng quay thất bại.');
    }
  };

  const handleCopyLink = (wheelSlug: string) => {
    if (!parish) return;
    const url = `${window.location.origin}/giao-xu/${parish.slug}/vong-quay/${wheelSlug}`;
    navigator.clipboard.writeText(url);
    showToastMsg('Đã sao chép liên kết vòng quay!');
  };

  const handleUpdateParish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parish) return;

    if (slugIsUnique === false) {
      alert('Đường dẫn Giáo Xứ bị trùng lặp. Vui lòng chọn đường dẫn khác.');
      return;
    }

    setParishSaveLoading(true);
    try {
      const cleanedSlug = parishSlug
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      if (!parishName.trim()) {
        throw new Error('Tên giáo xứ không được để trống.');
      }
      if (!cleanedSlug) {
        throw new Error('Slug url không được để trống.');
      }

      await dbService.updateParish(parish.id, {
        name: parishName.trim(),
        slug: cleanedSlug,
        logo_url: parishLogo.trim(),
        background_url: parishBackground.trim(),
        address: parishAddress.trim(),
        phone: parishPhone.trim(),
        facebook_url: parishFacebook.trim(),
        youtube_url: parishYoutube.trim(),
        greeting: parishGreeting.trim(),
        mass_schedule: JSON.stringify(massSchedule)
      });

      await refreshParishes();
      showToastMsg('Cập nhật cấu hình giáo xứ thành công!');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại.';
      alert(msg);
    } finally {
      setParishSaveLoading(false);
    }
  };

  // Mass Schedule widget handlers
  const handleAddMassSchedule = () => {
    if (!newMassTitle.trim() || !newMassTime.trim()) {
      alert('Vui lòng điền đầy đủ Tên lễ và Giờ lễ.');
      return;
    }
    const newItem = {
      id: 'mass-' + Math.random().toString(36).substring(2, 9),
      title: newMassTitle.trim(),
      time: newMassTime.trim()
    };
    setMassSchedule([...massSchedule, newItem]);
    setNewMassTitle('');
    setNewMassTime('');
  };

  const handleRemoveMassSchedule = (id: string) => {
    setMassSchedule(massSchedule.filter(item => item.id !== id));
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử quay của TẤT CẢ vòng quay? Hành động này không thể hoàn tác.')) return;
    setLoading(true);
    try {
      for (const w of wheels) {
        await dbService.clearSpinHistory(w.id);
      }
      showToastMsg('Đã xóa sạch toàn bộ lịch sử!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToastMsg('Lỗi khi xóa lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  const presetItems = React.useMemo(() => {
    switch (selectedPresetTab) {
      case 'gifts':
        return PENTECOST_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Thánh Thần ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'christmas':
        return CHRISTMAS_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Giáng Sinh ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'easter':
        return EASTER_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Phục Sinh ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'lent':
        return LENT_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Mùa Chay ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'advent':
        return ADVENT_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Mùa Vọng ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'marian':
        return MARIAN_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Đức Mẹ ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'joseph':
        return ST_JOSEPH_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Thánh Giuse ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'eucharist':
        return EUCHARIST_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: `Thánh Thể ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
      case 'tet':
      default:
        return DEFAULT_BLESSINGS.map((b, idx) => ({
          id: idx + 1,
          category: b.id === 0 ? 'Giờ Cha Chờ' : `Lộc số ${b.id}`,
          quote: b.quote,
          text: b.text
        }));
    }
  }, [selectedPresetTab]);

  const topSpunBlessings = React.useMemo(() => {
    const countsMap: { [key: string]: { count: number, item: string, wheel: string } } = {};
    combinedLogs.forEach(log => {
      const key = `${log.wheelTitle}-${log.item_spun}`;
      if (!countsMap[key]) {
        countsMap[key] = { count: 0, item: log.item_spun, wheel: log.wheelTitle };
      }
      countsMap[key].count += 1;
    });
    return Object.values(countsMap).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [combinedLogs]);

  const totalSpins = Object.values(spinCounts).reduce((acc, curr) => acc + curr, 0);

  if (loading && wheels.length === 0) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAF6EE', gap: '8px' }}>
        <Loader className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
        <span>Đang tải bảng điều khiển...</span>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Layout */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Church style={{ color: 'var(--color-gold)' }} />
          <h2>Quản Trị Giáo Xứ</h2>
        </div>

        <ul className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 8px' }}>
          <li>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: activeTab === 'dashboard' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === 'dashboard' ? '700' : '500',
                outline: 'none'
              }}
            >
              <Compass size={18} style={{ color: activeTab === 'dashboard' ? 'var(--color-gold)' : 'inherit' }} />
              <span>Bảng Tổng Quan</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('parish')}
              className={`sidebar-item ${activeTab === 'parish' ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: activeTab === 'parish' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === 'parish' ? '700' : '500',
                outline: 'none'
              }}
            >
              <Settings size={18} style={{ color: activeTab === 'parish' ? 'var(--color-gold)' : 'inherit' }} />
              <span>Cấu Hình Giáo Xứ</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('presets')}
              className={`sidebar-item ${activeTab === 'presets' ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: activeTab === 'presets' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === 'presets' ? '700' : '500',
                outline: 'none'
              }}
            >
              <BookOpen size={18} style={{ color: activeTab === 'presets' ? 'var(--color-gold)' : 'inherit' }} />
              <span>Thư Viện Lộc</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: activeTab === 'analytics' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === 'analytics' ? '700' : '500',
                outline: 'none'
              }}
            >
              <BarChart3 size={18} style={{ color: activeTab === 'analytics' ? 'var(--color-gold)' : 'inherit' }} />
              <span>Thống Kê Chi Tiết</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('gcc_guide')}
              className={`sidebar-item ${activeTab === 'gcc_guide' ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: activeTab === 'gcc_guide' ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: activeTab === 'gcc_guide' ? '700' : '500',
                outline: 'none'
              }}
            >
              <QrCode size={18} style={{ color: activeTab === 'gcc_guide' ? 'var(--color-gold)' : 'inherit' }} />
              <span>Hướng Dẫn & QR Kit</span>
            </button>
          </li>
        </ul>

        {/* 2FA Invitation Code Widget */}
        <div style={{
          margin: '16px 16px 8px 16px',
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(216, 180, 63, 0.04)',
          border: '2px double var(--color-gold)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          position: 'relative'
        }}>
          {/* Corner Ornaments */}
          <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '6px', height: '6px', top: '6px', left: '6px' }}></div>
          <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '6px', height: '6px', top: '6px', right: '6px' }}></div>
          <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '6px', height: '6px', bottom: '6px', left: '6px' }}></div>
          <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '6px', height: '6px', bottom: '6px', right: '6px' }}></div>

          <div style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: 'var(--color-primary)', 
            letterSpacing: '0.5px', 
            textTransform: 'uppercase', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#10B981'
            }}></span>
            Mã mời 2FA (15 Phút)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {inviteLoading && !inviteCode ? (
              <Loader className="animate-spin" size={20} style={{ color: 'var(--color-gold)' }} />
            ) : (
              <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: '800', color: 'var(--color-primary)', letterSpacing: '2px' }}>
                {inviteCode || '------'}
              </span>
            )}
            
            {inviteCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  showToastMsg('Đã sao chép mã mời!');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary-soft)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                title="Sao chép mã mời"
              >
                <Clipboard size={13} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {inviteRemaining > 0 ? (
              <span>Đổi mã mới sau {Math.floor(inviteRemaining / 60)}:{(inviteRemaining % 60).toString().padStart(2, '0')}</span>
            ) : (
              <span>Đang cập nhật mã...</span>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            Đang đăng nhập:
            <div style={{ fontWeight: '700', wordBreak: 'break-all', marginTop: '2px', color: 'var(--color-gold)' }}>{user?.email}</div>
          </div>
          <button onClick={() => signOut().then(() => navigate('/'))} className="btn btn-secondary" style={{ width: '100%', gap: '8px', color: 'var(--color-error)' }}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header" style={{ borderBottom: '1px solid rgba(15, 61, 46, 0.08)', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Church size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            {parishes.length > 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={parish?.id || ''}
                  onChange={(e) => {
                    const selected = parishes.find(p => p.id === e.target.value);
                    if (selected) {
                      setCurrentParish(selected);
                    }
                  }}
                  className="form-control text-serif"
                  style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: 'var(--color-primary)',
                    background: 'transparent',
                    border: '1.5px solid rgba(15, 61, 46, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    outline: 'none',
                    height: '36px',
                    lineHeight: '1.2'
                  }}
                >
                  {parishes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <h2 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: '800' }}>
                {parish?.name || 'Giáo xứ'}
              </h2>
            )}

            <button
              onClick={() => setShowNewParishModal(true)}
              className="btn btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid rgba(15, 61, 46, 0.15)',
                color: 'var(--color-primary)'
              }}
              title="Thêm Giáo xứ mới"
            >
              <Plus size={14} />
              <span>Thêm Giáo Xứ</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {activeTab === 'dashboard' && (
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-gold" style={{ gap: '6px', height: '38px', padding: '0 16px' }}>
                <Plus size={16} />
                <span>Tạo Vòng Quay Mới</span>
              </button>
            )}
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* TAB 1: BẢNG TỔNG QUAN */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Summary Cards */}
              <section className="dashboard-summary-grid" style={{ marginBottom: '32px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <div style={{ background: 'rgba(15, 61, 46, 0.06)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
                    <Compass size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Số Vòng Quay Đang Chạy</span>
                    <h3 style={{ fontSize: '26px', color: 'var(--color-primary)', marginTop: '2px', fontWeight: '800' }}>{wheels.length}</h3>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <div style={{ background: 'rgba(216, 180, 63, 0.08)', color: 'var(--color-gold)', padding: '12px', borderRadius: '12px' }}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Tổng Lượt Giáo Dân Quay</span>
                    <h3 style={{ fontSize: '26px', color: 'var(--color-primary)', marginTop: '2px', fontWeight: '800' }}>{totalSpins}</h3>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <div style={{ background: 'rgba(15, 61, 46, 0.06)', color: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
                    <Church size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Slug Giáo Xứ</span>
                    <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', marginTop: '6px', fontWeight: '800', fontFamily: 'monospace' }}>/giao-xu/{parish?.slug}</h3>
                  </div>
                </div>
              </section>

              {/* List of Wheels */}
              <section>
                <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '16px', fontWeight: '800' }}>Danh sách Vòng quay Lộc Chúa</h3>

                {wheels.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)', border: '1px solid rgba(216, 180, 63, 0.25)' }}>
                    <Compass size={40} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto', color: 'var(--color-primary)' }} />
                    <p style={{ fontSize: '14px' }}>Chưa có vòng quay nào được tạo.</p>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-gold" style={{ marginTop: '16px' }}>
                      Tạo vòng quay đầu tiên
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {wheels.map((wheel) => (
                      <div key={wheel.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', border: '1px solid rgba(15, 61, 46, 0.08)', borderLeft: '4px solid var(--color-gold)', boxShadow: '0 6px 18px rgba(15, 61, 46, 0.03)' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', fontWeight: '800' }}>{wheel.title}</h4>
                            <span style={{ fontSize: '11px', background: 'rgba(216, 180, 63, 0.15)', color: '#9d7b14', padding: '2px 8px', borderRadius: '99px', fontWeight: '600', textTransform: 'capitalize' }}>
                              Preset: {wheel.theme_preset}
                            </span>
                          </div>
                          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                            {wheel.description || 'Không có mô tả.'}
                          </p>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                            <span>Lượt quay: <strong style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{spinCounts[wheel.id] || 0}</strong></span>
                            <span>Đường dẫn: <code style={{ background: 'rgba(15, 61, 46, 0.04)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-primary-soft)' }}>/vong-quay/{wheel.slug}</code></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Link to={`/admin/wheel/${wheel.id}`} className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px', gap: '6px' }}>
                            <Settings size={14} />
                            Cấu hình DIY
                          </Link>

                          <button onClick={() => handleCopyLink(wheel.slug)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px', gap: '6px' }} title="Sao chép liên kết giáo dân">
                            <Clipboard size={14} />
                            Copy Link
                          </button>

                          <a
                            href={`/giao-xu/${parish?.slug}/vong-quay/${wheel.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ fontSize: '13px', padding: '8px 16px', gap: '6px' }}
                          >
                            <ExternalLink size={14} />
                            Mở trang quay
                          </a>

                          <button
                            onClick={() => handleDeleteWheel(wheel.id)}
                            className="btn btn-danger"
                            style={{ padding: '8px 12px', borderRadius: '10px' }}
                            title="Xóa vòng quay"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: CẤU HÌNH GIÁO XỨ */}
          {activeTab === 'parish' && (
            <section style={{ maxWidth: '750px' }}>
              <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)', padding: '24px' }}>
                <h3 className="text-serif" style={{ fontSize: '20px', color: 'var(--color-primary)', marginBottom: '24px', fontWeight: '800', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={20} className="text-gold" />
                  Cấu Hình Thông Tin Giáo Xứ Chi Tiết
                </h3>

                <form onSubmit={handleUpdateParish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Basic Information section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-one-col">
                    <div className="form-group">
                      <label htmlFor="parish-name" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Tên Giáo Xứ</label>
                      <input
                        id="parish-name"
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Giáo xứ Kẻ Sặt"
                        value={parishName}
                        onChange={(e) => setParishName(e.target.value)}
                        required
                        style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="parish-slug" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Đường dẫn Giáo Xứ (Slug URL)</label>
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <span style={{ background: 'rgba(15, 61, 46, 0.06)', padding: '0 12px', height: '42px', display: 'flex', alignItems: 'center', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          /giao-xu/
                        </span>
                        <input
                          id="parish-slug"
                          type="text"
                          className="form-control"
                          value={parishSlug}
                          onChange={(e) => setParishSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                          required
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '0 8px 8px 0', width: '100%', padding: '0 12px', paddingRight: '36px' }}
                        />
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                          {isCheckingSlug ? (
                            <Loader size={16} className="animate-spin text-muted" />
                          ) : slugIsUnique === true ? (
                            <Check size={18} className="text-success" style={{ color: '#10B981' }} />
                          ) : slugIsUnique === false ? (
                            <AlertCircle size={18} className="text-error" style={{ color: '#EF4444' }} />
                          ) : null}
                        </div>
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {slugIsUnique === true && (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '500' }}>🟢 Đường dẫn hợp lệ, chưa ai sử dụng!</span>
                        )}
                        {slugIsUnique === false && (
                          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500' }}>🔴 Đường dẫn này đã được Giáo xứ khác sử dụng!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logo & Background section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-one-col">
                    <div className="form-group">
                      <label htmlFor="parish-logo" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Liên kết ảnh Logo Giáo xứ</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="parish-logo"
                          type="url"
                          className="form-control"
                          placeholder="https://example.com/logo.png"
                          value={parishLogo}
                          onChange={(e) => setParishLogo(e.target.value)}
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', flex: 1, padding: '0 12px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="parish-bg" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Liên kết ảnh Nền Vòng Quay (Background URL)</label>
                      <input
                        id="parish-bg"
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/background.jpg"
                        value={parishBackground}
                        onChange={(e) => setParishBackground(e.target.value)}
                        style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px' }}
                      />
                    </div>
                  </div>

                  {/* Address & Hotline section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-one-col">
                    <div className="form-group">
                      <label htmlFor="parish-address" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Địa chỉ Giáo xứ</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                          id="parish-address"
                          type="text"
                          className="form-control"
                          placeholder="Ví dụ: 12 Xóm Bột, Phường 1, Quận 3, TP.HCM"
                          value={parishAddress}
                          onChange={(e) => setParishAddress(e.target.value)}
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px 0 36px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="parish-phone" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Hotline liên hệ / Số điện thoại</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                          id="parish-phone"
                          type="text"
                          className="form-control"
                          placeholder="Ví dụ: 028 3930 1234"
                          value={parishPhone}
                          onChange={(e) => setParishPhone(e.target.value)}
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px 0 36px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social links section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-one-col">
                    <div className="form-group">
                      <label htmlFor="parish-fb" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Trang Fanpage Facebook Giáo xứ</label>
                      <div style={{ position: 'relative' }}>
                        <FacebookIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1877F2' }} />
                        <input
                          id="parish-fb"
                          type="url"
                          className="form-control"
                          placeholder="https://facebook.com/ten-giao-xu"
                          value={parishFacebook}
                          onChange={(e) => setParishFacebook(e.target.value)}
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px 0 36px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="parish-yt" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>Kênh Youtube Giáo xứ</label>
                      <div style={{ position: 'relative' }}>
                        <YoutubeIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FF0000' }} />
                        <input
                          id="parish-yt"
                          type="url"
                          className="form-control"
                          placeholder="https://youtube.com/c/ten-giao-xu"
                          value={parishYoutube}
                          onChange={(e) => setParishYoutube(e.target.value)}
                          style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '0 12px 0 36px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* default greeting section */}
                  <div className="form-group">
                    <label htmlFor="parish-greeting" style={{ color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>
                      Lời chúc phụng vụ / chúc Tết mặc định (Xuất hiện trên thiệp lộc)
                    </label>
                    <textarea
                      id="parish-greeting"
                      rows={3}
                      className="form-control"
                      placeholder="Kính chúc quý cộng đoàn một năm mới bình an, tràn đầy ân sủng của Thiên Chúa!"
                      value={parishGreeting}
                      onChange={(e) => setParishGreeting(e.target.value)}
                      style={{ border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', width: '100%', padding: '10px 12px', fontSize: '14px', lineHeight: '1.5' }}
                    />
                  </div>

                  {/* Mass Schedule Widget Section */}
                  <div className="form-group" style={{ borderTop: '1px solid rgba(15, 61, 46, 0.08)', paddingTop: '20px' }}>
                    <label style={{ color: 'var(--color-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '15px' }}>
                      <Calendar size={18} className="text-gold" />
                      Widget Bảng Giờ Lễ Giáo Xứ
                    </label>
                    
                    {/* Add new schedule form */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Tên lễ (Ví dụ: Lễ Thiếu Nhi, Ngày thường...)"
                        value={newMassTitle}
                        onChange={(e) => setNewMassTitle(e.target.value)}
                        style={{ height: '38px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', flex: 2, padding: '0 12px', fontSize: '13px', minWidth: '200px' }}
                      />
                      <input
                        type="text"
                        placeholder="Giờ lễ (Ví dụ: 07:00, 17:30...)"
                        value={newMassTime}
                        onChange={(e) => setNewMassTime(e.target.value)}
                        style={{ height: '38px', border: '1.5px solid rgba(15, 61, 46, 0.15)', borderRadius: '8px', flex: 1, padding: '0 12px', fontSize: '13px', minWidth: '100px' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddMassSchedule}
                        className="btn btn-primary"
                        style={{ height: '38px', padding: '0 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'var(--color-primary)', color: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <Plus size={14} />
                        Thêm giờ
                      </button>
                    </div>

                    {/* Schedule List */}
                    <div style={{ background: 'rgba(15, 61, 46, 0.02)', border: '1px dashed rgba(15, 61, 46, 0.15)', borderRadius: '10px', padding: '12px' }}>
                      {massSchedule.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                          Chưa có lịch lễ nào được cấu hình.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {massSchedule.map((item, idx) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#FFFFFF',
                                border: '1px solid rgba(15, 61, 46, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', background: 'rgba(216, 180, 63, 0.15)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                  {idx + 1}
                                </span>
                                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-dark)' }}>{item.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-primary)', background: 'rgba(15, 61, 46, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                                  {item.time}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMassSchedule(item.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                  title="Xóa giờ lễ này"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-gold"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 24px', borderRadius: '10px', fontSize: '14.5px', fontWeight: '700' }}
                      disabled={parishSaveLoading || slugIsUnique === false}
                    >
                      {parishSaveLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                      <span>Lưu Cấu Hình Giáo Xứ</span>
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* TAB 3: THƯ VIỆN LỘC PHỤNG VỤ */}
          {activeTab === 'presets' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Presets Mode Selector */}
              <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)', padding: '20px 24px' }}>
                <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '8px', fontWeight: '800' }}>
                  Thư Viện Lộc Phụng Vụ & Tùy Chọn
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Hệ thống hỗ trợ cả các bộ mẫu có sẵn chuẩn phụng vụ Công giáo và các bộ lộc tùy biến do chính Giáo xứ thiết lập.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPresetsMode('system')}
                    className="btn"
                    style={{
                      padding: '10px 18px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      borderRadius: '12px',
                      backgroundColor: presetsMode === 'system' ? 'var(--color-primary)' : 'rgba(15, 61, 46, 0.06)',
                      color: presetsMode === 'system' ? '#FFFFFF' : 'var(--color-primary)',
                      border: presetsMode === 'system' ? '1.5px solid var(--color-gold)' : '1.5px solid transparent'
                    }}
                  >
                    Bộ mẫu hệ thống (9 bộ)
                  </button>
                  <button
                    onClick={() => setPresetsMode('custom')}
                    className="btn"
                    style={{
                      padding: '10px 18px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      borderRadius: '12px',
                      backgroundColor: presetsMode === 'custom' ? 'var(--color-primary)' : 'rgba(15, 61, 46, 0.06)',
                      color: presetsMode === 'custom' ? '#FFFFFF' : 'var(--color-primary)',
                      border: presetsMode === 'custom' ? '1.5px solid var(--color-gold)' : '1.5px solid transparent'
                    }}
                  >
                    Bộ lộc tự chọn của giáo xứ ({customPresets.length})
                  </button>
                </div>
              </div>

              {presetsMode === 'system' ? (
                <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '12px', marginBottom: '20px' }}>
                    <h4 className="text-serif" style={{ fontSize: '16.5px', color: 'var(--color-primary)', fontWeight: '800' }}>
                      Các bộ lộc chuẩn phụng vụ
                    </h4>
                    
                    {/* Apply Preset Bar */}
                    {wheels.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Áp dụng bộ này cho:</span>
                        <select
                          className="form-control"
                          value={applyWheelId}
                          onChange={(e) => setApplyWheelId(e.target.value)}
                          style={{ height: '36px', padding: '0 12px', fontSize: '13px', width: '180px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                        >
                          <option value="">-- Chọn vòng quay --</option>
                          {wheels.map((w) => (
                            <option key={w.id} value={w.id}>{w.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleApplySystemPresetToWheel}
                          disabled={!applyWheelId}
                          className="btn btn-primary btn-gold"
                          style={{ fontSize: '12.5px', padding: '8px 12px', height: '36px' }}
                        >
                          Nạp lộc
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sub-tabs for presets */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {(['gifts', 'tet', 'christmas', 'easter', 'lent', 'advent', 'marian', 'joseph', 'eucharist'] as const).map((pType) => (
                      <button
                        key={pType}
                        onClick={() => setSelectedPresetTab(pType)}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          borderRadius: '20px',
                          border: selectedPresetTab === pType ? '1.5px solid var(--color-gold)' : '1.5px solid rgba(15, 61, 46, 0.1)',
                          backgroundColor: selectedPresetTab === pType ? 'var(--color-primary)' : '#FFFFFF',
                          color: selectedPresetTab === pType ? '#FFFFFF' : 'var(--color-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pType === 'gifts' && 'Bảy Ơn Chúa Thánh Thần'}
                        {pType === 'tet' && '100 Lộc Tết Lời Chúa'}
                        {pType === 'christmas' && 'Lộc Giáng Sinh'}
                        {pType === 'easter' && 'Lộc Phục Sinh'}
                        {pType === 'lent' && 'Lộc Mùa Chay'}
                        {pType === 'advent' && 'Lộc Mùa Vọng'}
                        {pType === 'marian' && 'Lộc Kính Đức Mẹ'}
                        {pType === 'joseph' && 'Lộc Thánh Giuse'}
                        {pType === 'eucharist' && 'Lộc Thánh Thể'}
                      </button>
                    ))}
                  </div>

                  <div className="data-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(15, 61, 46, 0.08)', borderRadius: '10px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px' }}>STT</th>
                          <th style={{ width: '160px' }}>Lát cắt / Thể loại</th>
                          <th style={{ width: '120px' }}>Trích dẫn</th>
                          <th>Nội dung Lời Chúa / Lời chúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {presetItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item.category || `Lộc ${idx + 1}`}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>{item.quote || '—'}</td>
                            <td style={{ fontSize: '13px', lineHeight: '1.5' }}>{item.text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
                  {/* Left Column: Preset Lists */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(216, 180, 63, 0.25)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-primary)' }}>Bộ lộc tự chọn</strong>
                      <button
                        onClick={() => setShowNewPresetModal(true)}
                        className="btn btn-primary btn-gold"
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Plus size={12} />
                        Tạo mới
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                      {customPresets.length === 0 ? (
                        <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>Chưa có bộ lộc nào.</span>
                      ) : (
                        customPresets.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedCustomPresetId(p.id)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: selectedCustomPresetId === p.id ? 'rgba(15, 61, 46, 0.08)' : 'transparent',
                              border: selectedCustomPresetId === p.id ? '1px solid rgba(15, 61, 46, 0.2)' : '1px solid transparent',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.blessings.length} câu lộc</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomPreset(p.id);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Custom Preset Blessings CRUD */}
                  <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                    {(() => {
                      const selectedPreset = customPresets.find(p => p.id === selectedCustomPresetId);
                      if (!selectedPreset) {
                        return (
                          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                            <BookOpen size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto', color: 'var(--color-primary)' }} />
                            <p style={{ fontSize: '13.5px' }}>Vui lòng chọn hoặc tạo bộ lộc tự chọn mới để quản lý.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Heading & Apply / Add buttons */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '12px', marginBottom: '20px' }}>
                            <div>
                              <h4 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '800' }}>
                                Bộ lộc: {selectedPreset.name}
                              </h4>
                              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                                Quản lý danh sách câu chúc tự chọn.
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {wheels.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: '12px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Nạp vào:</span>
                                  <select
                                    className="form-control"
                                    value={applyWheelId}
                                    onChange={(e) => setApplyWheelId(e.target.value)}
                                    style={{ height: '34px', padding: '0 10px', fontSize: '12.5px', width: '150px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                                  >
                                    <option value="">-- Chọn vòng quay --</option>
                                    {wheels.map((w) => (
                                      <option key={w.id} value={w.id}>{w.title}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={handleApplyPresetToWheel}
                                    disabled={!applyWheelId}
                                    className="btn btn-primary btn-gold"
                                    style={{ fontSize: '12px', padding: '6px 10px', height: '34px' }}
                                  >
                                    Nạp
                                  </button>
                                </div>
                              )}

                              <button
                                onClick={handleOpenAddBlessing}
                                className="btn btn-primary btn-gold"
                                style={{ fontSize: '12.5px', padding: '8px 12px', height: '34px' }}
                              >
                                <Plus size={13} />
                                Thêm câu chúc
                              </button>
                            </div>
                          </div>

                          {/* Blessings CRUD Table */}
                          {selectedPreset.blessings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                              Chưa có câu chúc nào trong bộ lộc này. Hãy bấm <strong>"Thêm câu chúc"</strong> ở trên để bắt đầu nhập.
                            </div>
                          ) : (
                            <div className="data-table-wrapper" style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid rgba(15, 61, 46, 0.08)', borderRadius: '10px' }}>
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th style={{ width: '130px' }}>Lát cắt / Thể loại</th>
                                    <th style={{ width: '110px' }}>Trích dẫn</th>
                                    <th>Nội dung</th>
                                    <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedPreset.blessings.map((b, index) => (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{b.category}</td>
                                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{b.quote || '—'}</td>
                                      <td style={{ fontSize: '13px', lineHeight: '1.4' }}>{b.text}</td>
                                      <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                          <button
                                            onClick={() => handleOpenEditBlessing(index)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary-soft)', cursor: 'pointer', padding: '4px' }}
                                            title="Sửa"
                                          >
                                            <Edit size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteBlessing(index)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '4px' }}
                                            title="Xóa"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: THỐNG KÊ CHI TIẾT */}
          {activeTab === 'analytics' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Statistical summary grid */}
              <div className="dashboard-summary-grid">
                <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Tổng Số Lượt Quay Ghi Nhận</span>
                  <h3 style={{ fontSize: '28px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: '800' }}>{combinedLogs.length}</h3>
                </div>

                <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Vòng Quay Nhiều Lượt Nhất</span>
                  <h3 style={{ fontSize: '16px', color: 'var(--color-primary)', marginTop: '8px', fontWeight: '800' }}>
                    {wheels.map((w) => ({ title: w.title, count: spinCounts[w.id] || 0 })).sort((a, b) => b.count - a.count)[0]?.title || 'Không có'}
                  </h3>
                </div>

                <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Hành động lịch sử</span>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={handleClearAllHistory}
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '6px 12px', gap: '4px' }}
                      disabled={combinedLogs.length === 0}
                    >
                      <Trash2 size={13} />
                      Xóa tất cả lịch sử
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter, Search & Export Bar */}
              <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid rgba(15, 61, 46, 0.08)', padding: '16px 20px', borderRadius: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                  <Search size={16} style={{ color: 'var(--color-text-muted)', position: 'absolute', left: '12px' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm lộc đã quay trúng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '36px', height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  />
                </div>
                
                <div style={{ minWidth: '180px' }}>
                  <select
                    className="form-control"
                    value={filterWheelId}
                    onChange={(e) => setFilterWheelId(e.target.value)}
                    style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  >
                    <option value="all">Tất cả vòng quay</option>
                    {wheels.map((w) => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={exportLogsToCSV}
                  className="btn btn-primary btn-gold"
                  style={{ gap: '8px', height: '40px', padding: '0 16px' }}
                  disabled={filteredLogs.length === 0}
                >
                  <Download size={16} />
                  <span>Xuất Excel/CSV</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Top Spun Blessings Chart */}
                <div className="card" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                  <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '800', marginBottom: '16px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px' }}>
                    Top Lộc Được Giáo Dân Quay Trúng
                  </h3>

                  {topSpunBlessings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      Chưa có lượt quay nào để thống kê.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topSpunBlessings.map((stat, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{stat.item}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{stat.count} lượt quay ({stat.wheel})</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(15, 61, 46, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${(stat.count / topSpunBlessings[0].count) * 100}%`,
                                backgroundColor: 'var(--color-gold)',
                                borderRadius: '3px'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Combined Spin History Table */}
                <div className="card" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px' }}>
                    <h3 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '800', margin: 0 }}>
                      Nhật Ký Quay Trúng
                    </h3>
                    {filteredLogs.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Hiển thị {filteredLogs.length > 100 ? '100' : filteredLogs.length} / {filteredLogs.length}
                      </span>
                    )}
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      Không tìm thấy lượt quay nào phù hợp.
                    </div>
                  ) : (
                    <div className="data-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Vòng quay</th>
                            <th>Lát trúng</th>
                            <th>Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.slice(0, 100).map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontSize: '12.5px', fontWeight: '500' }}>{log.wheelTitle}</td>
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
            </section>
          )}

          {/* TAB 5: HƯỚNG DẪN & QR KIT */}
          {activeTab === 'gcc_guide' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ border: '1px solid rgba(216, 180, 63, 0.25)', boxShadow: '0 8px 24px rgba(15, 61, 46, 0.04)' }}>
                <h3 className="text-serif" style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '16px', fontWeight: '800', borderBottom: '1px solid rgba(15, 61, 46, 0.08)', paddingBottom: '10px' }}>
                  Bộ QR Kit & Cổng Kết Nối Phụng Vụ
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* QR Print Kit Info */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        backgroundColor: 'rgba(216, 180, 63, 0.1)',
                        border: '1.5px solid var(--color-gold)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100px',
                        height: '100px',
                        flexShrink: 0
                      }}
                    >
                      <QrCode size={48} style={{ color: 'var(--color-primary)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                        In Standee / Poster QR code tại cổng Nhà Thờ
                      </strong>
                      <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Tải hình ảnh mã QR Code hoặc copy các đường dẫn vòng quay bên dưới.
                        Thiết kế một tấm standee gỗ/kim loại đặt cạnh hang đá Giáng Sinh, trước đài Đức Mẹ hoặc sảnh đón nhà thờ vào dịp lễ Tết để giáo dân quét mã quay lộc nhanh chóng.
                      </p>
                    </div>
                  </div>

                  {/* List of active wheels and link copies */}
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '16px' }}>
                      Danh sách mã QR vòng quay:
                    </h4>

                    {wheels.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Chưa có vòng quay nào được tạo.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                        {wheels.map((w) => {
                          const wheelUrl = `${window.location.origin}/giao-xu/${parish?.slug}/vong-quay/${w.slug}`;
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wheelUrl)}`;
                          return (
                            <div
                              key={w.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid rgba(15, 61, 46, 0.08)',
                                padding: '20px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 12px rgba(15, 61, 46, 0.03)',
                                gap: '12px'
                              }}
                            >
                              <strong style={{ fontSize: '14.5px', color: 'var(--color-primary)', textAlign: 'center' }}>{w.title}</strong>
                              
                              <div style={{
                                width: '160px',
                                height: '160px',
                                border: '1.5px solid var(--color-gold)',
                                borderRadius: '12px',
                                padding: '8px',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <img
                                  src={qrUrl}
                                  alt={`Mã QR ${w.title}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              </div>

                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)', wordBreak: 'break-all', textAlign: 'center', backgroundColor: 'rgba(15, 61, 46, 0.03)', padding: '6px 10px', borderRadius: '6px', width: '100%' }}>
                                {wheelUrl}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                                <button
                                  onClick={() => downloadQRCode(qrUrl, `qr-${w.slug}.png`)}
                                  className="btn btn-primary btn-gold"
                                  style={{ fontSize: '12.5px', padding: '8px 12px', width: '100%', gap: '6px' }}
                                >
                                  <Download size={13} />
                                  Tải ảnh QR Code
                                </button>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(wheelUrl);
                                      showToastMsg('Đã sao chép liên kết!');
                                    }}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '12px', padding: '8px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                  >
                                    <Clipboard size={12} />
                                    Sao chép
                                  </button>
                                  
                                  <a
                                    href={wheelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ fontSize: '12px', padding: '8px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                                  >
                                    <ExternalLink size={12} />
                                    Mở quay
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Giờ Cha Chờ info card */}
                  <div
                    style={{
                      border: '1.5px solid rgba(15, 61, 46, 0.12)',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: '#FFFFFF',
                      marginTop: '10px',
                      boxShadow: '0 4px 12px rgba(15, 61, 46, 0.02)'
                    }}
                  >
                    <h4 className="text-serif" style={{ fontSize: '16px', color: 'var(--color-primary)', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Church size={18} style={{ color: 'var(--color-gold)' }} />
                      <span>Kết nối Ứng dụng di động "Giờ Cha Chờ"</span>
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                      Hệ thống Vòng Quay Lời Chúa nằm trong dự án hỗ trợ các giáo xứ số hóa phụng vụ và truyền thông.
                      Giáo xứ có thể liên kết vòng quay trực tiếp lên ứng dụng di động <strong>Giờ Cha Chờ</strong> (ứng dụng tra cứu Giờ Lễ & Giờ Xưng Tội toàn quốc dành cho người Công Giáo) để giáo dân của giáo xứ có thể truy cập vòng quay ngay từ trang chủ của ứng dụng khi họ đến nhà thờ của bạn.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600', marginTop: '10px' }}>
                      Liên hệ với Ban Truyền Thông dự án để được hỗ trợ đồng bộ danh mục vòng quay lên ứng dụng di động hoàn toàn miễn phí.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Add Wheel Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="winner-card" style={{ maxWidth: '460px', border: '2.5px double var(--color-gold)', position: 'relative' }}>
            {/* Corner Ornaments */}
            <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', left: '10px' }}></div>
            <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', right: '10px' }}></div>
            <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', left: '10px' }}></div>
            <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', right: '10px' }}></div>

            <div className="winner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '2px solid var(--color-gold)' }}>
              <h3 className="text-serif" style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '800' }}>Tạo Vòng Quay Mới</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWheel} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FFFFFF' }}>
              {modalError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                  {modalError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="modal-title" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên Vòng Quay</label>
                <input
                  id="modal-title"
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Vòng quay Tết Bính Ngọ"
                  value={newTitle}
                  onChange={handleTitleChange}
                  required
                  style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Slug Vòng quay (Đường dẫn riêng biệt)</label>
                <input
                  id="modal-slug"
                  type="text"
                  className="form-control"
                  placeholder="loc-xuan-2026"
                  value={newSlug}
                  onChange={(e) => {
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    setNewWheelSlugError(null);
                  }}
                  onBlur={(e) => checkNewWheelSlugUniqueness(e.target.value)}
                  required
                  style={{ height: '42px', border: newWheelSlugError ? '1.5px solid var(--color-error)' : '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
                {checkingWheelSlug && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Đang kiểm tra...</span>}
                {newWheelSlugError && <span style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>{newWheelSlugError}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="modal-desc" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Mô tả / Lời nhắn nhủ giáo dân</label>
                <textarea
                  id="modal-desc"
                  className="form-control"
                  placeholder="Cha xứ kính chúc quý cộng đoàn năm mới..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-preset" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Nạp sẵn Bộ dữ liệu mẫu</label>
                <select
                  id="modal-preset"
                  className="form-control"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value as 'gifts' | 'tet' | 'empty')}
                  style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                >
                  <option value="gifts">Nạp 7 Ơn Chúa Thánh Thần (Vòng quay Ơn Thánh)</option>
                  <option value="tet">Nạp 100 câu Lộc Lời Chúa Tết (Kho mẫu có sẵn)</option>
                  <option value="empty">Trống - tự cấu hình từ đầu</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gold" disabled={modalLoading}>
                  {modalLoading ? <Loader className="animate-spin" size={16} /> : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Parish Modal */}
      {showNewParishModal && (
        <div className="modal-overlay">
          <div className="winner-card" style={{ maxWidth: '460px', border: '2.5px double var(--color-gold)', position: 'relative' }}>
            {/* Corner Ornaments */}
            <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', left: '10px' }}></div>
            <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', right: '10px' }}></div>
            <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', left: '10px' }}></div>
            <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', right: '10px' }}></div>

            <div className="winner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '2px solid var(--color-gold)' }}>
              <h3 className="text-serif" style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '800' }}>Thêm Giáo Xứ Mới</h3>
              <button onClick={() => setShowNewParishModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateParishSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FFFFFF' }}>
              {newParishError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>
                  {newParishError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="new-parish-name" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên Giáo xứ / Cộng đoàn</label>
                <input
                  id="new-parish-name"
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Giáo xứ Châu Sơn"
                  value={newParishName}
                  onChange={handleNewParishNameChange}
                  required
                  style={{ height: '42px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-parish-slug" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Đường dẫn chia sẻ (Slug URL)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>/giao-xu/</span>
                  <input
                    id="new-parish-slug"
                    type="text"
                    className="form-control"
                    placeholder="giao-xu-chau-son"
                    value={newParishSlug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setNewParishSlug(val);
                      setNewParishSlugError(null);
                    }}
                    required
                    style={{ height: '42px', border: newParishSlugError ? '1.5px solid var(--color-error)' : '1.5px solid rgba(15, 61, 46, 0.15)' }}
                  />
                </div>
                {checkingNewParishSlug && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Đang kiểm tra...</span>}
                {newParishSlugError && <span style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>{newParishSlugError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewParishModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gold" disabled={newParishLoading}>
                  {newParishLoading ? <Loader className="animate-spin" size={16} /> : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Preset Modal */}
      {showNewPresetModal && (
        <div className="modal-overlay">
          <div className="winner-card" style={{ maxWidth: '400px', border: '2.5px double var(--color-gold)', position: 'relative' }}>
            <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', left: '10px' }}></div>
            <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', right: '10px' }}></div>
            <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', left: '10px' }}></div>
            <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', right: '10px' }}></div>

            <div className="winner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '2px solid var(--color-gold)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '800' }}>Tạo Bộ Lộc Tự Chọn Mới</h3>
              <button onClick={() => setShowNewPresetModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPreset} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#FFFFFF' }}>
              <div className="form-group">
                <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên bộ lộc</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Lộc Thánh lễ thiếu nhi, Lộc mừng thọ..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  required
                  style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowNewPresetModal(false)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gold" style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Blessing Modal */}
      {showBlessingModal && (
        <div className="modal-overlay">
          <div className="winner-card" style={{ maxWidth: '440px', border: '2.5px double var(--color-gold)', position: 'relative' }}>
            <div className="corner-ornament top-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', left: '10px' }}></div>
            <div className="corner-ornament top-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', top: '10px', right: '10px' }}></div>
            <div className="corner-ornament bottom-left" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', left: '10px' }}></div>
            <div className="corner-ornament bottom-right" style={{ borderColor: 'var(--color-gold)', width: '10px', height: '10px', bottom: '10px', right: '10px' }}></div>

            <div className="winner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '2px solid var(--color-gold)' }}>
              <h3 className="text-serif" style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '800' }}>
                {blessingModalMode === 'edit' ? 'Chỉnh Sửa Câu Lộc' : 'Thêm Câu Lộc Mới'}
              </h3>
              <button onClick={() => setShowBlessingModal(false)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBlessing} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#FFFFFF' }}>
              <div className="form-group">
                <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Tên Lát Cắt (Category)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Lộc số 1, Ơn Khôn Ngoan, Câu 12..."
                  value={blessingCategory}
                  onChange={(e) => setBlessingCategory(e.target.value)}
                  style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Trích dẫn Kinh Thánh (Tùy chọn)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Tv 23,1 hoặc Ga 3,16"
                  value={blessingQuote}
                  onChange={(e) => setBlessingQuote(e.target.value)}
                  style={{ height: '40px', border: '1.5px solid rgba(15, 61, 46, 0.15)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Nội dung Lời Chúa / Lời chúc</label>
                <textarea
                  className="form-control"
                  placeholder="Nhập nội dung chi tiết của câu lộc..."
                  value={blessingText}
                  onChange={(e) => setBlessingText(e.target.value)}
                  required
                  style={{ minHeight: '80px', resize: 'vertical', border: '1.5px solid rgba(15, 61, 46, 0.15)', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowBlessingModal(false)} className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gold" style={{ fontSize: '13px', padding: '8px 14px' }}>
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
    </div>
  );
};
