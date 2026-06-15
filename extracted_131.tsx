Created At: 2026-06-15T02:04:03Z
Completed At: 2026-06-15T02:04:03Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1024
Total Bytes: 41380
Showing lines 80 to 140
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
80:   timestamp: number;
81: }
82: 
83: export const ParishionerWheel: React.FC = () => {
84:   const { parishSlug, wheelSlug, wheelId: shortWheelId } = useParams<{ parishSlug?: string; wheelSlug?: string; wheelId?: string }>();
85: 
86:   const [parish, setParish] = useState<Parish | null>(null);
87:   const [wheel, setWheel] = useState<Wheel | null>(null);
88:   const [blessings, setBlessings] = useState<Blessing[]>([]);
89:   const [loading, setLoading] = useState(true);
90:   const [error, setError] = useState<string | null>(null);
91: 
92:   // Spin States
93:   const [isSpinning, setIsSpinning] = useState(false);
94:   const [winnerBlessing, setWinnerBlessing] = useState<Blessing | null>(null);
95:   const [showWinnerModal, setShowWinnerModal] = useState(false);
96:   const [lockedBlessing, setLockedBlessing] = useState<LockedBlessing | null>(null);
97:   const [isAdClosed, setIsAdClosed] = useState(false);
98:   
99:   // UI feedback Toast
100:   const [toast, setToast] = useState<string | null>(null);
101: 
102:   // Responsive layout state (width >= 1024px)
103:   const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
104: 
105:   useEffect(() => {
106:     const handleResize = () => {
107:       setIsDesktop(window.innerWidth >= 1024);
108:     };
109:     window.addEventListener('resize', handleResize);
110:     return () => window.removeEventListener('resize', handleResize);
111:   }, []);
112: 
113:   // Viewport responsiveness state (width < 500px)
114:   const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
115: 
116:   useEffect(() => {
117:     const handleResize = () => {
118:       setIsSmallScreen(window.innerWidth < 500);
119:     };
120:     window.addEventListener('resize', handleResize);
121:     return () => window.removeEventListener('resize', handleResize);
122:   }, []);
123: 
124:   const isMobile = !isDesktop;
125: 
126:   // Canvas & Audio Refs
127:   const canvasRef = useRef<HTMLCanvasElement | null>(null);
128:   const audioContextRef = useRef<AudioContext | null>(null);
129:   const rotationRef = useRef(0);
130:   const velocityRef = useRef(0);
131:   const animationFrameIdRef = useRef<number | null>(null);
132:   const isMountedRef = useRef(true);
133:   const isSpinningRef = useRef(false);
134:   const spinLoopRef = useRef<((colors: string[], targetRotation: number) => void) | null>(null);
135:   
136:   // Modal ref for screenshot download
137:   const modalContentRef = useRef<HTMLDivElement | null>(null);
138:   // Inline card ref for screenshot download
139:   const inlineCardRef = useRef<HTMLDivElement | null>(null);
140: 
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
