Created At: 2026-06-15T02:01:50Z
Completed At: 2026-06-15T02:01:50Z
The following changes were made by the replace_file_content tool to: D:\khoinghiep\vongquay\src\pages\ParishionerWheel.tsx. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -98,20 +98,18 @@
   // UI feedback Toast
   const [toast, setToast] = useState<string | null>(null);
 
-  // Responsive layout state (width >= 1024px)
-  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
-
-  useEffect(() => {
-    const handleResize = () => {
-      setIsDesktop(window.innerWidth >= 1024);
-    };
-    window.addEventListener('resize', handleResize);
-    return () => {
-      window.removeEventListener('resize', handleResize);
-    };
-  }, []);
-
-  // Viewport responsiveness state
+  // Responsive layout state (width < 768px)
+  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
+
+  useEffect(() => {
+    const handleResize = () => {
+      setIsMobile(window.innerWidth < 768);
+    };
+    window.addEventListener('resize', handleResize);
+    return () => window.removeEventListener('resize', handleResize);
+  }, []);
+
+  // Viewport responsiveness state (width < 500px)
   const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
 
   useEffect(() => {
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.