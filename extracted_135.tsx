Created At: 2026-06-15T02:04:05Z
Completed At: 2026-06-15T02:04:06Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1024
Total Bytes: 41380
Showing lines 800 to 1024
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
800:           <div className="wheel-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: isSmallScreen ? '8px 0' : '16px 0', flex: 1 }}>
801:             <div className="wheel-container" style={{
802:               position: 'relative',
803:               width: '440px',
804:               height: '440px',
805:               maxWidth: '85vw',
806:               maxHeight: '85vw',
807:               borderRadius: '50%',
808:               boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(216, 180, 63, 0.25)',
809:               background: '#FFFFFF',
810:               padding: '8px',
811:               borderColor: wheel.theme_preset === 'christmas' ? '#F59E0B' : getThemeColors(wheel.theme_preset)[1],
812:               borderWidth: '8px',
813:               borderStyle: 'double'
814:             }}>
815:               <canvas ref={canvasRef} id="wheel-canvas" width="600" height="600" style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'block' }}></canvas>
816:               
817:               {/* Polished Gold/Brass Pointer */}
818:               <div className="wheel-pointer" style={{
819:                 position: 'absolute',
820:                 top: '50%',
821:                 right: '-16px',
822:                 transform: 'translateY(-50%)',
823:                 zIndex: 10,
824:                 width: '48px',
825:                 height: '48px',
826:                 pointerEvents: 'none'
827:               }}>
828:                 {wheel.theme_preset === 'christmas' ? (
8
<truncated 8547 bytes>
reset)[1] }} />
981:                 Xem lại Lộc Thánh của bạn
982:               </button>
983:             </div>
984:           )}
985:         </div>
986:         {/* Right/Bottom: Blessing Result Card (Inline on Desktop, Modal on Mobile) */}
987:         {showWinnerModal && winnerBlessing && (
988:           isMobile 
989:             ? renderBlessingCard(true) // Render inside modal overlay on mobile
990:             : renderBlessingCard(false) // Render inline on desktop side panel
991:         )}
992:       </div>
993: 
994:       {/* Footer Banner Promotion (Graceful footer banner) */}
995:       {!isAdClosed && (
996:         <div className="footer-ad-banner" style={{ borderTopColor: getThemeColors(wheel.theme_preset)[1] }}>
997:           <div className="ad-content">
998:             <span className="ad-logo-badge">Giờ Cha Chờ</span>
999:             <span className="ad-text">Đồng hành cùng đức tin Công giáo. Tìm nhanh giờ Thánh Lễ & Giờ Xưng Tội gần nhất.</span>
1000:             <a
1001:               href="https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative"
1002:               target="_blank"
1003:               rel="noopener noreferrer"
1004:               className="ad-link-btn"
1005:             >
1006:               Tải miễn phí
1007:             </a>
1008:             <button onClick={() => setIsAdClosed(true)} className="ad-close-btn" title="Đóng quảng cáo">
1009:               <X size={14} />
1010:             </button>
1011:           </div>
1012:         </div>
1013:       )}
1014: 
1015:       {/* Toast popup */}
1016:       {toast && (
1017:         <div className="toast-notification">
1018:           {toast}
1019:         </div>
1020:       )}
1021:     </div>
1022:   );
1023: };
1024: 
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
