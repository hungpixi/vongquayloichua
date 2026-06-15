Created At: 2026-06-15T02:04:05Z
Completed At: 2026-06-15T02:04:05Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1024
Total Bytes: 41380
Showing lines 650 to 800
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
650:     } catch (err) {
651:       console.error(err);
652:       showToastMsg('Không thể xuất ảnh thiệp. Vui lòng thử lại.');
653:     }
654:   }, [parish, showToastMsg]);
655: 
656:   const handleOpenLockedModal = React.useCallback(() => {
657:     if (!lockedBlessing || !wheel) return;
658:     const matchedBlessing = blessings.find(b => b.id === lockedBlessing.id) || {
659:       id: lockedBlessing.id,
660:       wheel_id: wheel.id,
661:       category: lockedBlessing.itemSpun,
662:       quote: lockedBlessing.quote,
663:       text: lockedBlessing.text,
664:       is_custom: true
665:     };
666:     setWinnerBlessing(matchedBlessing);
667:     setShowWinnerModal(true);
668:   }, [lockedBlessing, blessings, wheel]);
669: 
670: 
671: 
672:   if (loading) {
673:     return (
674:       <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', gap: '8px' }}>
675:         <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
676:         <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Đang nhận diện Giáo xứ...</span>
677:       </div>
678:     );
679:   }
680: 
681:   if (error || !wheel) {
682:     return (
683:       <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', gap: '16px', padding: '24px', textAlign: 'center' }}>
684:         <AlertTriangle size={48} style={{ color: 'var(--color-er
<truncated 5568 bytes>
:               letterSpacing: isSmallScreen ? '1.5px' : '2px',
767:               textAlign: 'center',
768:               lineHeight: 1.3
769:             }}>
770:               {parish?.name}
771:             </div>
772:             <h2 className="public-event-title" style={{
773:               fontFamily: "'Playfair Display', Georgia, serif",
774:               fontSize: isSmallScreen ? '22px' : '28px',
775:               fontWeight: 800,
776:               color: getThemeColors(wheel.theme_preset)[0],
777:               textAlign: 'center',
778:               margin: '2px 0 6px 0',
779:               lineHeight: 1.25,
780:               textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)'
781:             }}>
782:               {wheel.title}
783:             </h2>
784:             <p className="public-description" style={{
785:               fontSize: isSmallScreen ? '14px' : '15.5px', // optimized readability for elderly
786:               color: '#2D3748', // high-contrast text color
787:               fontWeight: 500,
788:               maxWidth: '520px',
789:               margin: '0 auto',
790:               lineHeight: isSmallScreen ? '1.45' : '1.6',
791:               textAlign: 'center'
792:             }}>
793:               {lockedBlessing 
794:                 ? 'Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.' 
795:                 : wheel.description || 'Xin nhấn nút dưới đây để đón nhận ân sủng Lộc Lời Chúa dành riêng cho quý vị.'}
796:             </p>
797:           </header>
798: 
799:           {/* Main Wheel Canvas Section */}
800:           <div className="wheel-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: isSmallScreen ? '8px 0' : '16px 0', flex: 1 }}>
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
