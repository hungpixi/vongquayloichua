Created At: 2026-06-15T02:01:21Z
Completed At: 2026-06-15T02:01:21Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1174
Total Bytes: 48670
Showing lines 540 to 615
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
540:     const element = modalContentRef.current;
541:     if (!element) return;
542:     
543:     showToastMsg('Đang tạo ảnh thiệp sắc nét...');
544:     try {
545:       await document.fonts.ready;
546: 
547:       const canvas = await html2canvas(element, {
548:         useCORS: true,
549:         backgroundColor: null,
550:         scale: 2.5,
551:         logging: false
552:       });
553:       const dataUrl = canvas.toDataURL('image/png');
554:       
555:       const link = document.createElement('a');
556:       link.download = `Loc_Loi_Chua_${parish?.slug || 'giao_xu'}.png`;
557:       link.href = dataUrl;
558:       link.click();
559:       showToastMsg('Đã tải thiệp Lộc Lời Chúa thành công!');
560:     } catch (err) {
561:       console.error(err);
562:       showToastMsg('Không thể xuất ảnh thiệp. Vui lòng thử lại.');
563:     }
564:   }, [parish, showToastMsg]);
565: 
566:   const handleOpenLockedModal = React.useCallback(() => {
567:     if (!lockedBlessing || !wheel) return;
568:     const matchedBlessing = blessings.find(b => b.id === lockedBlessing.id) || {
569:       id: lockedBlessing.id,
570:       wheel_id: wheel.id,
571:       category: lockedBlessing.itemSpun,
572:       quote: lockedBlessing.quote,
573:       text: lockedBlessing.text,
574:       is_custom: true
575:     };
576:     setWinnerBlessing(matchedBlessing);
577:     setShowWinnerModal(true);
578:   }, [lockedBlessing, blessings, wheel]);
579: 
580:   if (loading) {
581:     return (
582:       <div style={{ dis
<truncated 108 bytes>
g)', gap: '8px' }}>
583:         <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
584:         <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Đang nhận diện Giáo xứ...</span>
585:       </div>
586:     );
587:   }
588: 
589:   if (error || !wheel) {
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
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
