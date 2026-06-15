**Defining Build Process**

I've determined the build command is `npm run build`, executing `tsc -b && vite build`. I'm now focused on modifying `ParishionerWheel.tsx`, located at `D:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx`. I will begin designing my planned changes to this file.


**Refining Conditional Logic**

I'm now integrating `isSmallScreen` into `ParishionerWheel.tsx` to ensure responsive layout adjustments. I've pinpointed the relevant section and am replacing the existing styles with conditional logic based on this state. I am carefully adhering to rule 3, making only the necessary changes. I'm focusing on the Holy Card Inner Wrapper and adjusting its `borderRadius` and `padding` based on the screen width.


**Adjusting Layout Padding**

I am now focusing on refining the parent layout's padding in `ParishionerWheel.tsx`. After assessing the current configuration, I've decided to implement a conditional padding assignment. The padding will be zero if `isSmallScreen` is true, otherwise, it remains at 12px. This ensures optimal spacing, preventing a double margin effect when the child's margin is also 12px. I've updated the code accordingly. I'm taking care to consider all related code.


**Revising Ornament Placement**

I've realized the corner ornaments need adjustment on smaller screens. To prevent overlap, I'm now modifying their `top`, `bottom`, `left`, and `right` positions conditionally based on `isSmallScreen`. I've updated the code, so that ornaments use mobile values, 8px, and desktop values, 12px. The card design is now beautiful and responsive!


**Optimizing Header Scaling**

I'm now focusing on the header section within `ParishionerWheel.tsx` to prevent excessive vertical scrolling on smaller devices. I'm adjusting padding, font sizes, logo dimensions, and spacing conditionally based on `isSmallScreen`. The changes will involve inline styles within the header element, specifically for padding, logo sizing and layout, font sizes, and spacing between elements. I've considered text readability for all device sizes, especially for elderly users.


