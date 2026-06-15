Created At: 2026-06-15T02:01:04Z
Completed At: 2026-06-15T02:01:04Z
The following changes were made by the replace_file_content tool to: D:\khoinghiep\vongquay\src\pages\ParishionerWheel.tsx. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -608,7 +608,7 @@
       display: 'flex',
       flexDirection: 'column',
       justifyContent: 'space-between',
-      padding: '12px',
+      padding: isSmallScreen ? '0' : '12px',
       color: '#FFFFFF'
     }}>
       {/* Holy Card Inner Wrapper */}
@@ -616,8 +616,9 @@
         display: 'flex',
         flexDirection: 'column',
         border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${borderGold}`,
-        borderRadius: '20px',
-        padding: '20px 14px',
+        borderRadius: isSmallScreen ? '16px' : '20px',
+        padding: isSmallScreen ? '16px' : '20px 14px',
+        margin: isSmallScreen ? '12px' : '0',
         background: 'radial-gradient(circle at center, #FFFDF6 0%, #FFF5DB 100%)',
         color: 'var(--color-text-dark)',
         boxShadow: wheel.theme_preset === 'christmas'
@@ -626,13 +626,12 @@
         overflow: 'hidden'
       }}>
         {/* Subtle decorative corners inside the main page wrapper */}
-        <div className="corner-ornament top-left" style={{ borderColor: borderGold, borderTopStyle: 'solid', borderLeftStyle: 'solid', borderTopWidth: '2.5px', borderLeftWidth: '2.5px', top: '12px', left: '12px', width: '16px', height: '16px', position: 'absolute' }}></div>
-        <div className="corner-ornament top-right" style={{ borderColor: borderGold, borderTopStyle: 'solid', borderRightStyle: 'solid', borderTopWidth: '2.5px', borderRightWidth: '2.5px', top: '12px', right: '12px', width: '16px', height: '16px', position: 'absolute' }}></div>
-        <div className="corner-ornament bottom-left" style={{ borderColor: borderGold, borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderBottomWidth: '2.5px', bo
<truncated 3183 bytes>
    fontWeight: 800,
             color: getThemeColors(wheel.theme_preset)[0],
             textTransform: 'uppercase',
-            letterSpacing: '2px',
+            letterSpacing: isSmallScreen ? '1.5px' : '2px',
             textAlign: 'center',
             lineHeight: 1.3
           }}>
@@ -658,7 +658,7 @@
           </div>
           <h2 className="public-event-title" style={{
             fontFamily: "'Playfair Display', Georgia, serif",
-            fontSize: '28px',
+            fontSize: isSmallScreen ? '22px' : '28px',
             fontWeight: 800,
             color: getThemeColors(wheel.theme_preset)[0],
             textAlign: 'center',
@@ -668,7 +668,7 @@
             {wheel.title}
           </h2>
           <p className="public-description" style={{
-            fontSize: '15.5px', // optimized readability for elderly
+            fontSize: isSmallScreen ? '14px' : '15.5px', // optimized readability for elderly
             color: '#2D3748', // high-contrast text color
             fontWeight: 500,
             maxWidth: '520px',
@@ -675,4 +675,4 @@
-            lineHeight: '1.6',
+            lineHeight: isSmallScreen ? '1.45' : '1.6',
             textAlign: 'center'
           }}>
             {lockedBlessing 
@@ -681,7 +681,7 @@
         </header>
 
         {/* Main Wheel Canvas Section */}
-        <div className="wheel-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0', flex: 1 }}>
+        <div className="wheel-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: isSmallScreen ? '8px 0' : '16px 0', flex: 1 }}>
           <div className="wheel-container" style={{
             position: 'relative',
             width: '440px',
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.