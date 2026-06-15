Created At: 2026-06-15T02:01:13Z
Completed At: 2026-06-15T02:01:13Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1174
Total Bytes: 48578
Showing lines 590 to 650
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
590:     return (
591:       <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', gap: '16px', padding: '24px', textAlign: 'center' }}>
592:         <AlertTriangle size={48} style={{ color: 'var(--color-error)' }} />
593:         <h3 style={{ fontSize: '18px', color: 'var(--color-text-dark)', fontWeight: '700' }}>{error || 'Đường dẫn không tồn tại.'}</h3>
594:         <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Vui lòng liên hệ với Ban Truyền Thông Giáo xứ để nhận đường dẫn chính xác.</p>
595:         <Link to="/" className="btn btn-primary">
596:           Về Trang Chủ
597:         </Link>
598:       </div>
599:     );
600:   }
601: 
602:   const borderGold = wheel.theme_preset === 'christmas' ? '#F59E0B' : getThemeColors(wheel.theme_preset)[1];
603: 
604:   return (
605:     <div className={wheel.theme_preset === 'christmas' ? "public-layout theme-christmas-layout" : "public-layout"} style={{
606:       ...getLayoutBackground(wheel.theme_preset),
607:       minHeight: '100vh',
608:       display: 'flex',
609:       flexDirection: 'column',
610:       justifyContent: isDesktop ? 'center' : 'space-between',
611:       alignItems: isDesktop ? 'center' : 'stretch',
612:       padding: isDesktop ? '32px 12px' : (isSmallScreen ? '0' : '12px'),
613:       color: '#FFFFFF'
614:     }}>
615:       {/* Holy Card Inner Wrapper */}
616:       <div style={{
617:         flex: isDesktop ? '0 1 auto'
<truncated 1451 bytes>
' }}></div>
638:         <div className="corner-ornament top-right" style={{ borderColor: borderGold, borderTopStyle: 'solid', borderRightStyle: 'solid', borderTopWidth: '2.5px', borderRightWidth: '2.5px', top: isSmallScreen ? '8px' : '12px', right: isSmallScreen ? '8px' : '12px', width: '16px', height: '16px', position: 'absolute' }}></div>
639:         <div className="corner-ornament bottom-left" style={{ borderColor: borderGold, borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderBottomWidth: '2.5px', borderLeftWidth: '2.5px', bottom: isSmallScreen ? '8px' : '12px', left: isSmallScreen ? '8px' : '12px', width: '16px', height: '16px', position: 'absolute' }}></div>
640:         <div className="corner-ornament bottom-right" style={{ borderColor: borderGold, borderBottomStyle: 'solid', borderRightStyle: 'solid', borderBottomWidth: '2.5px', borderRightWidth: '2.5px', bottom: isSmallScreen ? '8px' : '12px', right: isSmallScreen ? '8px' : '12px', width: '16px', height: '16px', position: 'absolute' }}></div>
641:         {/* Header Info */}
642:         <header className="public-header" style={{ padding: isSmallScreen ? '8px 4px 4px 4px' : '16px 12px 8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isSmallScreen ? '4px' : '6px' }}>
643:           <div className="public-logo" style={{
644:             background: `linear-gradient(135deg, ${getThemeColors(wheel.theme_preset)[0]} 0%, ${getThemeColors(wheel.theme_preset)[4]} 100%)`,
645:             color: getThemeColors(wheel.theme_preset)[1],
646:             border: `2px solid ${getThemeColors(wheel.theme_preset)[1]}`,
647:             boxShadow: '0 4px 12px rgba(15, 61, 46, 0.15)',
648:             width: isSmallScreen ? '44px' : '56px',
649:             height: isSmallScreen ? '44px' : '56px',
650:             borderRadius: '50%',
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
