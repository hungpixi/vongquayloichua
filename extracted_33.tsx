Created At: 2026-06-15T02:01:15Z
Completed At: 2026-06-15T02:01:15Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1174
Total Bytes: 48578
Showing lines 80 to 110
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
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
106:   useEffect(() => {
107:     const handleResize = () => {
108:       setIsSmallScreen(window.innerWidth < 500);
109:     };
110:     window.addEventListener('resize', handleResize);
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
