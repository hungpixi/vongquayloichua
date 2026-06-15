export interface BgmOption {
  id: string;
  name: string;
  url: string;
}

export interface SfxOption {
  id: string;
  name: string;
}

export const BGM_OPTIONS: BgmOption[] = [
  { id: 'default-bgm', name: 'Nhạc nền Giờ Cha Chờ (Mặc định - Tải cực nhanh)', url: '/audio/bg-music.mp3' },
  { id: 'schubert-ave-maria', name: 'Ave Maria (Schubert) - Vocal/Piano', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6f/Franz_Schubert_-_Ellens_dritter_Gesang.oga/Franz_Schubert_-_Ellens_dritter_Gesang.oga.mp3' },
  { id: 'gounod-ave-maria', name: 'Ave Maria (Gounod) - Cello/Piano', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d4/JOHN_MICHEL_CELLO-BACH_AVE_MARIA.ogg/JOHN_MICHEL_CELLO-BACH_AVE_MARIA.ogg.mp3' },
  { id: 'canon-in-d', name: 'Canon in D (Pachelbel) - Piano', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/62/Pachelbel%27s_Canon.ogg/Pachelbel%27s_Canon.ogg.mp3' },
  { id: 'silent-night', name: 'Silent Night (Đêm Thánh) - Piano', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Silent_Night_%28Kevin_MacLeod%29_%28ISRC_USUAN1100075%29.oga/Silent_Night_%28Kevin_MacLeod%29_%28ISRC_USUAN1100075%29.oga.mp3' },
  { id: 'jingle-bells', name: 'Jingle Bells (Chuông ngân) - Celesta', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/54/Jingle_Bells_%28Calm%29.ogg/Jingle_Bells_%28Calm%29.ogg.mp3' },
  { id: 'amazing-grace', name: 'Amazing Grace - Organ phụng vụ', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/88/Amazing_Grace-organ.ogg/Amazing_Grace-organ.ogg.mp3' },
  { id: 'church-bells-joy', name: 'Tiếng chuông giáo đường reo mừng', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/Bells_of_St_Peter%27s%2C_Bebington.ogg/Bells_of_St_Peter%27s%2C_Bebington.ogg.mp3' },
  { id: 'bach-cello-suite', name: 'Tĩnh niệm Lời Chúa - Cello Suite', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/43/JOHN_MICHEL_CELLO-J_S_BACH_CELLO_SUITE_1_in_G_Prelude.ogg/JOHN_MICHEL_CELLO-J_S_BACH_CELLO_SUITE_1_in_G_Prelude.ogg.mp3' },
  { id: 'hallelujah-organ', name: 'Hallelujah Chorus - Hợp xướng', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/ce/Handel_-_messiah_-_44_hallelujah.ogg/Handel_-_messiah_-_44_hallelujah.ogg.mp3' },
  { id: 'morning-prayer', name: 'Kinh Nguyện Ban Mai - Hòa tấu', url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg/Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg.mp3' }
];

export const SPIN_SFX_OPTIONS: SfxOption[] = [
  { id: 'tick', name: 'Tick-Tick cổ điển' },
  { id: 'bell', name: 'Tiếng gõ chuông nhỏ' },
  { id: 'harp', name: 'Tiếng đàn Harp gảy nốt' },
  { id: 'organ', name: 'Tiếng đàn Organ phụng vụ' },
  { id: 'chime', name: 'Chuông gió leng keng' }
];

export const WIN_SFX_OPTIONS: SfxOption[] = [
  { id: 'fanfare', name: 'Kèn đồng Fanfare rực rỡ' },
  { id: 'church-bells-joy', name: 'Chuông giáo đường reo liên hồi' },
  { id: 'alleluia-chorus', name: 'Chuỗi nhạc Alleluia tươi vui' },
  { id: 'heaven-glory', name: 'Đàn lia rải hợp âm thiên đàng' },
  { id: 'christmas-chimes', name: 'Chuông Jingle Bells đón lành' }
];
 
export const RELIGIOUS_ICONS = ['✝', '🕊', '🌟', '🍞', '🕯', '🍷', '📖', '💖'];

// 1. TỔNG HỢP SFX KHI QUAY (SPIN SFX)
export const playSynthesizedSpinSFX = (ctx: AudioContext, type: string, clickCount: number) => {
  const t = ctx.currentTime;
  
  switch (type) {
    case 'bell': {
      // Tiếng chuông gõ nhỏ leng keng
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
      
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
      break;
    }
    case 'harp': {
      // Đàn Harp: các nốt rải tăng dần theo nhịp quay
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C4 -> C5
      const freq = scale[clickCount % scale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12); // Vuốt nhẹ
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
      break;
    }
    case 'organ': {
      // Đàn Organ phụng vụ ấm áp, trang trọng
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, t); // A3
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, t); // A4
      
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.15);
      osc2.stop(t + 0.15);
      break;
    }
    case 'chime': {
      // Chuông gió leng keng ngẫu nhiên
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const randomFreq = 1400 + Math.random() * 600;
      osc.frequency.setValueAtTime(randomFreq, t);
      
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
      break;
    }
    case 'tick':
    default: {
      // Tick-Tick cổ điển
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);
      
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
      break;
    }
  }
};

// 2. TỔNG HỢP SFX KHI TRÚNG GIẢI (WIN SFX)
export const playSynthesizedWinSFX = (ctx: AudioContext, type: string) => {
  const t = ctx.currentTime;
  
  switch (type) {
    case 'church-bells-joy': {
      // Chuông giáo đường mừng lễ reo vui rộn rã
      const bells = [220, 277.18, 329.63]; // Hợp âm trưởng A - C# - E
      bells.forEach((baseFreq, idx) => {
        const delay = idx * 0.25;
        // Gõ 3 nhịp
        for (let i = 0; i < 3; i++) {
          const hitTime = t + delay + i * 0.7;
          const osc = ctx.createOscillator();
          const overtone = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = baseFreq;
          
          overtone.type = 'sine';
          overtone.frequency.value = baseFreq * 2.4; // Hài âm kim loại
          
          gain.gain.setValueAtTime(0.08, hitTime);
          gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 1.2);
          
          osc.connect(gain);
          overtone.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(hitTime);
          overtone.start(hitTime);
          osc.stop(hitTime + 1.4);
          overtone.stop(hitTime + 1.4);
        }
      });
      break;
    }
    case 'alleluia-chorus': {
      // Giai điệu Alleluia 4 nốt tươi vui chúc lành
      const notes = [
        { freq: 392.00, delay: 0, dur: 0.22 }, // G4
        { freq: 440.00, delay: 0.22, dur: 0.22 }, // A4
        { freq: 523.25, delay: 0.44, dur: 0.22 }, // C5
        { freq: 440.00, delay: 0.66, dur: 0.5 } // A4
      ];
      notes.forEach(note => {
        const start = t + note.delay;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.value = note.freq;
        
        osc2.type = 'sine';
        osc2.frequency.value = note.freq * 1.006; // Detune nhẹ tạo độ dày đồng ca
        
        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + note.dur + 0.05);
        osc2.stop(start + note.dur + 0.05);
      });
      break;
    }
    case 'heaven-glory': {
      // Đàn lia rải hợp âm thiên đàng cực nhanh bay bổng
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4 -> C6
      arpeggio.forEach((freq, idx) => {
        const noteTime = t + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.05, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(noteTime);
        osc.stop(noteTime + 0.9);
      });
      break;
    }
    case 'christmas-chimes': {
      // Tiếng chuông Jingle Bells quen thuộc ấm áp đón lành
      const notes = [
        { freq: 659.25, time: 0 }, // E5
        { freq: 659.25, time: 0.2 }, // E5
        { freq: 659.25, time: 0.4 }, // E5
        { freq: 659.25, time: 0.7 }, // E5
        { freq: 659.25, time: 0.9 }, // E5
        { freq: 659.25, time: 1.1 }, // E5
        { freq: 659.25, time: 1.4 }, // E5
        { freq: 783.99, time: 1.6 }, // G5
        { freq: 523.25, time: 1.85 }, // C5
        { freq: 587.33, time: 2.1 }  // D5
      ];
      notes.forEach(note => {
        const start = t + note.time * 0.8;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + 0.3);
      });
      break;
    }
    case 'fanfare':
    default: {
      // Fanfare mặc định
      [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(idx === 0 ? 0.1 : 0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t);
        osc.stop(t + 2);
      });
      break;
    }
  }
};
