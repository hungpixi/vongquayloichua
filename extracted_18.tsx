Created At: 2026-06-15T02:00:57Z
Completed At: 2026-06-15T02:00:57Z
The following changes were made by the replace_file_content tool to: D:\khoinghiep\vongquay\src\pages\ParishionerWheel.tsx. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -87,6 +87,17 @@
   // UI feedback Toast
   const [toast, setToast] = useState<string | null>(null);
 
+  // Viewport responsiveness state
+  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
+
+  useEffect(() => {
+    const handleResize = () => {
+      setIsSmallScreen(window.innerWidth < 500);
+    };
+    window.addEventListener('resize', handleResize);
+    return () => window.removeEventListener('resize', handleResize);
+  }, []);
+
   // Canvas & Audio Refs
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const audioContextRef = useRef<AudioContext | null>(null);
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.