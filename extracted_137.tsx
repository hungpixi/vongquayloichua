Created At: 2026-06-15T02:04:08Z
Completed At: 2026-06-15T02:04:08Z
File Path: `file:///D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`
Total Lines: 1024
Total Bytes: 41380
Showing lines 500 to 630
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
500: 
501:       setShowWinnerModal(true);
502:     }
503:   }, [wheel, playBellSound]);
504: 
505:   const spinLoop = React.useCallback((colors: string[], targetRotation: number) => {
506:     if (!isMountedRef.current) return;
507:     rotationRef.current += velocityRef.current;
508:     
509:     const numSegments = blessings.length;
510:     const arcSize = (2 * Math.PI) / numSegments;
511:     const lastPos = Math.floor((rotationRef.current - velocityRef.current) / arcSize);
512:     const currPos = Math.floor(rotationRef.current / arcSize);
513:     if (lastPos !== currPos) {
514:       playTickSound();
515:     }
516: 
517:     velocityRef.current *= 0.982; 
518: 
519:     if (velocityRef.current < 0.002) {
520:       if (isMountedRef.current) {
521:         setIsSpinning(false);
522:         isSpinningRef.current = false;
523:       }
524:       velocityRef.current = 0;
525:       
526:       const normalizedRotation = (2 * Math.PI - (rotationRef.current % (2 * Math.PI))) % (2 * Math.PI);
527:       const winnerIndex = Math.floor(normalizedRotation / arcSize) % numSegments;
528:       const winner = blessings[winnerIndex];
529:       
530:       if (isMountedRef.current) {
531:         setWinnerBlessing(winner);
532:       }
533:       handleSpinEnd(winner);
534:     } else {
535:       drawWheel();
536:       animationFrameIdRef.current = requestAnimationFrame(() => {
537:         if (spinLoopRef.current) {
538:           spinLoopRef.current(colors, targetRotation);
539:         }
540:       });
541:     }
542:   }, [blessin
<truncated 2136 bytes>
ối
585:       element.style.width = '430px';
586:       element.style.maxWidth = '430px';
587: 
588:       const canvas = await html2canvas(element, {
589:         useCORS: true,
590:         backgroundColor: null,
591:         scale: 3,
592:         logging: false,
593:         windowWidth: 430,
594:         windowHeight: element.offsetHeight
595:       });
596: 
597:       // Khôi phục lại style ban đầu
598:       element.style.width = originalWidth;
599:       element.style.maxWidth = originalMaxWidth;
600: 
601:       const dataUrl = canvas.toDataURL('image/png');
602:       
603:       const link = document.createElement('a');
604:       link.download = `Loc_Loi_Chua_${parish?.slug || 'giao_xu'}.png`;
605:       link.href = dataUrl;
606:       link.click();
607:       showToastMsg('Đã tải thiệp Lộc Lời Chúa thành công!');
608:     } catch (err) {
609:       console.error(err);
610:       showToastMsg('Không thể xuất ảnh thiệp. Vui lòng thử lại.');
611:     }
612:   }, [parish, showToastMsg]);
613: 
614:   const handleDownloadInlinePNG = React.useCallback(async () => {
615:     const element = inlineCardRef.current;
616:     if (!element) return;
617:     
618:     showToastMsg('Đang tạo ảnh thiệp sắc nét...');
619:     try {
620:       await document.fonts.ready;
621: 
622:       // Lưu trữ các styles ban đầu để khôi phục sau khi chụp
623:       const originalWidth = element.style.width;
624:       const originalMaxWidth = element.style.maxWidth;
625:       
626:       // Ép kích thước cố định chuẩn cho ảnh thiệp xuất ra luôn đồng bộ và cân đối
627:       element.style.width = '430px';
628:       element.style.maxWidth = '430px';
629: 
630:       const canvas = await html2canvas(element, {
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
