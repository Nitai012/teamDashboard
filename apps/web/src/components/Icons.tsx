import { type ReactNode, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconTeam = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7.5" cy="7" r="2.8" />
    <path d="M2.5 16.5c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3" />
    <circle cx="14" cy="6.5" r="2.2" />
    <path d="M13.6 11.4c2.1 0 3.6 1.3 4 3.6" />
  </Icon>
);

export const IconMatrix = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="2.5" width="6" height="6" rx="1.4" />
    <rect x="11.5" y="2.5" width="6" height="6" rx="1.4" />
    <rect x="2.5" y="11.5" width="6" height="6" rx="1.4" />
    <path d="M14.5 11.5v6M11.5 14.5h6" />
  </Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 5.5h8M15 5.5h2M3 14.5h2M9 14.5h8" />
    <circle cx="13" cy="5.5" r="2" />
    <circle cx="7" cy="14.5" r="2" />
  </Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p} strokeWidth="2">
    <path d="M10 4v12M4 10h12" />
  </Icon>
);

/** Points right, which is "back" in a right-to-left layout. */
export const IconBack = (p: IconProps) => (
  <Icon {...p} strokeWidth="2">
    <path d="M8 4.5 13.5 10 8 15.5" />
  </Icon>
);

export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 3.5 16.5 6.5 7 16H4v-3z" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p} strokeWidth="1.9">
    <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
  </Icon>
);

export const IconSun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="3.4" />
    <path d="M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M4.5 15.5l1.1-1.1M14.4 5.6l1.1-1.1" />
  </Icon>
);

export const IconMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16.2 12.6A6.6 6.6 0 0 1 7.4 3.8a6.6 6.6 0 1 0 8.8 8.8Z" />
  </Icon>
);

export const IconLogout = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 4H4.5v12H8M12.5 6.5 9 10l3.5 3.5M9 10h8" />
  </Icon>
);

export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 3v9.5M6 8.5l4 4 4-4M4 16.5h12" />
  </Icon>
);

export const IconUpload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 13V3.5M6 7.5l4-4 4 4M4 16.5h12" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p} strokeWidth="2">
    <path d="M4.5 10.5 8 14l7.5-8" />
  </Icon>
);

export const IconRadar = (p: IconProps) => (
  <Icon {...p} strokeWidth="1.5">
    <circle cx="10" cy="10" r="7.5" opacity="0.45" />
    <path
      d="M10 3.2 15.6 6.6 14.6 13.3 10 16.2 5.6 13 4.6 6.9Z"
      fill="currentColor"
      fillOpacity="0.18"
    />
  </Icon>
);
