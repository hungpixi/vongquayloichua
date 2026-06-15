**Refining Download Logic**

I'm now focusing on `handleDownloadInlinePNG` and how it utilizes `inlineCardRef`. I'm clarifying the purpose of `handleDownloadPNG` for the modal versus the inline card. Since the overlays are no longer in use, I'm adjusting my thought process.


**Clarifying Inline Rendering**

I've realized there's no modal at all! `handleDownloadPNG` won't be used. Now, I am examining the inline card rendering block around line 980 in the current file and redesigning it.  I'm addressing how the `inlineCardRef` will be used and how it adapts to mobile viewports. I am making sure the card wrapper styles dynamically adjust, based on screen size, and implementing new styling logic.


**Implementing Dynamic Styles**

I'm now focusing on dynamic styling for mobile viewports. I've added a margin of 12px to the Wheel Card and Blessing Result Card wrappers on small screens for breathing room. I'm also addressing font size scaling. I will scale the event title, description, and "LỘC LỜI CHÚA" titles as required for small screens. Also, I'll adjust the Category Label Badge's font size, padding and margin bottom. Finally, I'll reduce Scripture Text's font size on smaller viewports.


