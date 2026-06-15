Created At: 2026-06-15T02:04:23Z
Completed At: 2026-06-15T02:04:48Z
The following changes were made by the multi_replace_file_content tool to: D:\khoinghiep\vongquay\src\pages\ParishionerWheel.tsx. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -713,10 +713,10 @@
         margin: '0 auto',
         paddingBottom: !isAdClosed ? '60px' : '0'
       }}>
-        {/* Holy Card Wrapper */}
+        {/* Left/Top: Wheel Card */}
         <div style={{
+          flex: 1,
           width: '100%',
-          maxWidth: '540px',
           display: 'flex',
           flexDirection: 'column',
           border: wheel.theme_preset === 'christmas' ? '6px double #F59E0B' : `2px solid ${borderGold}`,
@@ -723,4 +723,5 @@
           padding: isSmallScreen ? '16px' : '24px 20px',
+          margin: isSmallScreen ? '12px auto' : '0',
           background: 'radial-gradient(circle at center, #FFFDF6 0%, #FFF5DB 100%)',
           color: 'var(--color-text-dark)',
           boxShadow: isDesktop
@@ -978,8 +978,266 @@
             </div>
           )}
         </div>
-        {/* Blessing Result Card (Always Modal on both mobile & desktop) */}
-        {showWinnerModal && winnerBlessing && renderBlessingCard(true)}
+        {/* Right/Bottom: Blessing Result Card (Inline) */}
+        {showWinnerModal && winnerBlessing && (() => {
+          const textLength = winnerBlessing.text?.length || 0;
+          const fontSize = textLength > 150 ? '14px' : textLength > 100 ? '15.5px' : '17.5px';
+          // Make sure scripture text size scales down on small screens to prevent long vertical scrolling
+          const scriptureFontSize = isSmallScreen 
+            ? (textLength > 150 ? '12.5px' : '14px') 
+            : fontSize;
+          const presetColors = getThemeColors(wheel.theme_preset);
+
+          return (
+            <div 
+              className="winner-card" 
+              style={{ 
+                backgroun
<truncated 11063 bytes>
                fontWeight: '600'
+                    }}
+                  >
+                    <Copy size={15} />
+                    <span>Sao chép chữ</span>
+                  </button>
+
+                  <button
+                    onClick={handleDownloadInlinePNG}
+                    className="btn btn-primary"
+                    style={{ 
+                      flex: 1, 
+                      height: '44px', 
+                      borderRadius: '12px', 
+                      background: presetColors[0], 
+                      color: '#ffffff',
+                      fontSize: '13px',
+                      fontWeight: '600',
+                      boxShadow: `0 4px 12px ${presetColors[0]}25`
+                    }}
+                  >
+                    <Download size={15} />
+                    Lưu ảnh Lộc
+                  </button>
+                </div>
+
+                <button
+                  onClick={() => setShowWinnerModal(false)}
+                  className="btn btn-secondary"
+                  style={{ 
+                    width: '100%', 
+                    height: '40px', 
+                    borderRadius: '12px', 
+                    background: '#F3F4F6', 
+                    color: '#4B5563', 
+                    border: 'none',
+                    fontSize: '13px',
+                    fontWeight: '500'
+                  }}
+                >
+                  Đóng
+                </button>
+              </div>
+
+            </div>
+          );
+        })()}
       </div>
 
       {/* Footer Banner Promotion (Graceful footer banner) */}
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.

We did our best to apply changes despite some inaccuracies. Double check if the edit applied is what you intended.