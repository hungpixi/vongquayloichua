Created At: 2026-06-15T02:01:17Z
Completed At: 2026-06-15T02:01:18Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1174
Total Bytes: 48578
Showing lines 70 to 180
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
70: 
71: export const ParishionerWheel: React.FC = () => {
72:   const { parishSlug, wheelSlug, wheelId: shortWheelId } = useParams<{ parishSlug?: string; wheelSlug?: string; wheelId?: string }>();
73: 
74:   const [parish, setParish] = useState<Parish | null>(null);
75:   const [wheel, setWheel] = useState<Wheel | null>(null);
76:   const [blessings, setBlessings] = useState<Blessing[]>([]);
77:   const [loading, setLoading] = useState(true);
78:   const [error, setError] = useState<string | null>(null);
79: 
80:   // Spin States
81:   const [isSpinning, setIsSpinning] = useState(false);
82:   const [winnerBlessing, setWinnerBlessing] = useState<Blessing | null>(null);
83:   const [showWinnerModal, setShowWinnerModal] = useState(false);
84:   const [lockedBlessing, setLockedBlessing] = useState<LockedBlessing | null>(null);
85:   const [isAdClosed, setIsAdClosed] = useState(false);
86:   
87:   // UI feedback Toast
88:   const [toast, setToast] = useState<string | null>(null);
89: 
90:   // Responsive layout state (width >= 1024px)
91:   const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
92: 
93:   useEffect(() => {
94:     const handleResize = () => {
95:       setIsDesktop(window.innerWidth >= 1024);
96:     };
97:     window.addEventListener('resize', handleResize);
98:     return () => {
99:       window.removeEventListener('resize', handleResize);
100:     };
101:   }, []);
102: 
103:   // Viewport responsiveness state
104:   const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
105: 
106:   
<truncated 1205 bytes>
red': // Lễ Hiện Xuống
133:         return ['#7F1D1D', '#D8B43F', '#450a0a', '#FFF8E8', '#991b1b', '#E6B93D'];
134:       case 'blue': // Đức Mẹ
135:         return ['#0E4B75', '#D8B43F', '#072a44', '#FFF8E8', '#1A5F7A', '#E6B93D'];
136:       case 'green': // Thường Niên
137:         return ['#0F5E3D', '#D8B43F', '#0a3d28', '#FFF8E8', '#1F8A55', '#E6B93D'];
138:       case 'gold': // Cổ Điển (Default)
139:       default:
140:         return ['#0F3D2E', '#D8B43F', '#1F6B4A', '#FFF8E8', '#2F6B4F', '#E6B93D'];
141:     }
142:   };
143: 
144:   const getLayoutBackground = (preset: string) => {
145:     switch (preset) {
146:       case 'christmas':
147:         return {};
148:       case 'red':
149:         return {
150:           background: '#2A0505',
151:           backgroundImage: 'radial-gradient(circle at 50% 30%, #5C1515 0%, #2A0505 100%)'
152:         };
153:       case 'blue':
154:         return {
155:           background: '#051C2C',
156:           backgroundImage: 'radial-gradient(circle at 50% 30%, #0E4B75 0%, #051C2C 100%)'
157:         };
158:       case 'green':
159:         return {
160:           background: '#052618',
161:           backgroundImage: 'radial-gradient(circle at 50% 30%, #0F5E3D 0%, #052618 100%)'
162:         };
163:       case 'gold':
164:       default:
165:         return {
166:           background: '#081B15',
167:           backgroundImage: 'radial-gradient(circle at 50% 30%, #164D3B 0%, #081B15 100%)'
168:         };
169:     }
170:   };
171: 
172:   const showToastMsg = React.useCallback((msg: string) => {
173:     setToast(msg);
174:     setTimeout(() => setToast(null), 3000);
175:   }, []);
176: 
177:   const fetchWheelData = React.useCallback(async () => {
178:     setLoading(true);
179:     setError(null);
180:     try {
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
