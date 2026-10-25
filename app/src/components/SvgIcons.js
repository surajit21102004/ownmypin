import React from 'react';
import Svg, { Path, Circle, Rect, Line, G, Polygon } from 'react-native-svg';

/**
 * Premium Home Icon
 */
export function HomeIcon({ size = 22, color = '#64748B', focused = false }) {
  const activeColor = focused ? '#0F172A' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V14C14 13.4477 13.5523 13 13 13H11C10.4477 13 10 13.4477 10 14V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
        fill={focused ? '#0F172A' : 'none'}
        stroke={activeColor}
        strokeWidth={focused ? '1.5' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Search Icon
 */
export function SearchIcon({ size = 22, color = '#64748B', focused = false }) {
  const activeColor = focused ? '#0F172A' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7.5"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.5 20.5L16.5 16.5"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium QR Scanner / Viewfinder Icon
 */
export function ScannerIcon({ size = 22, color = '#64748B', focused = false }) {
  const activeColor = focused ? '#0F172A' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V5C4 4.44772 4.44772 4 5 4H8"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 4H19C19.5523 4 20 4.44772 20 5V8"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 16V19C20 19.5523 19.5523 20 19 20H16"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 20H5C4.44772 20 4 19.5523 4 19V16"
        stroke={activeColor}
        strokeWidth={focused ? '2.4' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="8.5"
        y="8.5"
        width="7"
        height="7"
        rx="1.5"
        fill={focused ? '#0F172A' : 'none'}
        stroke={activeColor}
        strokeWidth="1.6"
      />
    </Svg>
  );
}

/**
 * Premium DSC (Shield with check) Icon
 */
export function DscIcon({ size = 22, color = '#64748B', focused = false }) {
  const activeColor = focused ? '#0F172A' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L4 6V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V6L12 2.5Z"
        fill={focused ? '#0F172A' : 'none'}
        stroke={activeColor}
        strokeWidth={focused ? '1.5' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11.8L11 13.8L15 9.5"
        stroke={focused ? '#FFFFFF' : activeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Account / User Icon
 */
export function AccountIcon({ size = 22, color = '#64748B', focused = false }) {
  const activeColor = focused ? '#0F172A' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
        stroke={activeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="7.5"
        r="4.5"
        fill={focused ? '#0F172A' : 'none'}
        stroke={activeColor}
        strokeWidth={focused ? '1.5' : '1.8'}
      />
    </Svg>
  );
}

/**
 * Premium Notification Bell Icon
 */
export function BellIcon({ size = 22, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 20.5C13.5542 20.8031 13.3019 21.0547 12.9982 21.2295C12.6946 21.4044 12.3501 21.4962 12 21.4962C11.6499 21.4962 11.3054 21.4044 11.0018 21.2295C10.6982 21.0547 10.4458 20.8031 10.27 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Globe / Language Icon
 */
export function GlobeIcon({ size = 18, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M2.5 12H21.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 2.5C14.8 6.5 16.2 9.5 16.2 12C16.2 14.5 14.8 17.5 12 21.5C9.2 17.5 7.8 14.5 7.8 12C7.8 9.5 9.2 6.5 12 2.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Map Pin / Location Icon
 */
export function MapPinIcon({ size = 20, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C16 16.5 19 12.5 19 8.5C19 4.63401 15.866 1.5 12 1.5C8.13401 1.5 5 4.63401 5 8.5C5 12.5 8 16.5 12 21Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="8.5" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

/**
 * Premium Gift / Invite Icon
 */
export function GiftIcon({ size = 20, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M12 8V21" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 8H7.5C6.11929 8 5 6.88071 5 5.5C5 4.11929 6.11929 3 7.5 3C10 3 12 8 12 8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8H16.5C17.8807 8 19 6.88071 19 5.5C19 4.11929 17.8807 3 16.5 3C14 3 12 8 12 8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Share Icon
 */
export function ShareIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth="1.8" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

/**
 * Premium Copy Icon
 */
export function CopyIcon({ size = 18, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="12" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M5 15H4C3.44772 15 3 14.5523 3 14V4C3 3.44772 3.44772 3 4 3H14C14.5523 3 15 3.44772 15 4V5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Premium Store / Business Icon
 */
export function StoreIcon({ size = 20, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9L4.5 4H19.5L21 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M3 9C3 10.1046 3.89543 11 5 11C6.10457 11 7 10.1046 7 9C7 10.1046 7.89543 11 9 11C10.1046 11 11 10.1046 11 9C11 10.1046 11.8954 11 13 11C14.1046 11 15 10.1046 15 9C15 10.1046 15.8954 11 17 11C18.1046 11 19 10.1046 19 9C19 10.1046 19.8954 11 21 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path d="M9 21V15H15V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Premium Flat / Apartment Building Icon
 */
export function BuildingIcon({ size = 20, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="6" x2="10" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="14" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="10" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="14" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="10" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="14" y1="14" x2="16" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 22V18H14V22" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

/**
 * Premium Key / Own Status Icon
 */
export function KeyIcon({ size = 18, color = '#047857' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="15" r="5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M11.5 11.5L20 3M20 3H16M20 3V7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Clipboard / Rent Status Icon
 */
export function ClipboardIcon({ size = 18, color = '#C2410C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Premium Navigation / Compass Icon
 */
export function NavigationIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="3 11 22 2 13 21 11 13 3 11"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Star Icon
 */
export function StarIcon({ size = 16, color = '#D97706', filled = true }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Camera Icon
 */
export function CameraIcon({ size = 18, color = '#475569' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

/**
 * Premium Zoom Icon
 */
export function ZoomIcon({ size = 16, color = '#0284C7' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="11" y1="8" x2="11" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Premium Chevron Right Icon
 */
export function ChevronRightIcon({ size = 18, color = '#94A3B8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Close (X) Icon
 */
export function CloseIcon({ size = 18, color = '#64748B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Verified Checkmark Badge Icon
 */
export function VerifiedCheckIcon({ size = 14, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Premium Shield Lock Icon (Privacy)
 */
export function ShieldLockIcon({ size = 20, color = '#0F172A' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="9" y="11" width="6" height="5" rx="1" stroke={color} strokeWidth="1.6" />
      <Path d="M10 11V9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5V11" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}
