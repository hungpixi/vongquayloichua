Created At: 2026-06-15T02:01:49Z
Completed At: 2026-06-15T02:01:49Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1200
Total Bytes: 49882
Showing lines 85 to 120
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
85:   const [parish, setParish] = useState<Parish | null>(null);
86:   const [wheel, setWheel] = useState<Wheel | null>(null);
87:   const [blessings, setBlessings] = useState<Blessing[]>([]);
88:   const [loading, setLoading] = useState(true);
89:   const [error, setError] = useState<string | null>(null);
90: 
91:   // Spin States
92:   const [isSpinning, setIsSpinning] = useState(false);
93:   const [winnerBlessing, setWinnerBlessing] = useState<Blessing | null>(null);
94:   const [showWinnerModal, setShowWinnerModal] = useState(false);
95:   const [lockedBlessing, setLockedBlessing] = useState<LockedBlessing | null>(null);
96:   const [isAdClosed, setIsAdClosed] = useState(false);
97:   
98:   // UI feedback Toast
99:   const [toast, setToast] = useState<string | null>(null);
100: 
101:   // Responsive layout state (width >= 1024px)
102:   const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
103: 
104:   useEffect(() => {
105:     const handleResize = () => {
106:       setIsDesktop(window.innerWidth >= 1024);
107:     };
108:     window.addEventListener('resize', handleResize);
109:     return () => {
110:       window.removeEventListener('resize', handleResize);
111:     };
112:   }, []);
113: 
114:   // Viewport responsiveness state
115:   const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
116: 
117:   useEffect(() => {
118:     const handleResize = () => {
119:       setIsSmallScreen(window.innerWidth < 500);
120:     };
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
