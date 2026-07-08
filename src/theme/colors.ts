export type ColorScheme = 'dark' | 'light';
export type ThemePreference = ColorScheme | 'auto';

export interface AppColors {
  bg: {
    base: string;
    surface: string;
    sheet: string;
    archive: string;
    elevated: string;
    media: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    placeholder: string;
    ghost: string;
  };
  accent: {
    green: string;
    greenDark: string;
    greenSubtle: string;
    greenBorder: string;
    blue: string;
    blueSubtle: string;
    yellow: string;
    gold: string;
    goldBorder: string;
    red: string;
    redSubtle: string;
  };
  border: {
    default: string;
    medium: string;
    strong: string;
  };
  player: string[];
  team: string[];
}

const sharedAccent = {
  green: '#3ddc84',
  greenDark: '#06140c',
  greenSubtle: 'rgba(61,220,132,0.12)',
  greenBorder: 'rgba(61,220,132,0.28)',
  blue: '#6aa6ff',
  blueSubtle: 'rgba(106,166,255,0.14)',
  yellow: '#f6c350',
  gold: '#ffd45e',
  goldBorder: 'rgba(255,212,94,0.25)',
  red: '#ff5d5a',
  redSubtle: 'rgba(255,93,90,0.14)',
};

const sharedPalette = {
  player: [
    '#3ddc84',
    '#f6c350',
    '#6aa6ff',
    '#c98bff',
    '#ff8f6b',
    '#52d0c8',
    '#e89bd0',
    '#9b8bff',
    '#ffb86b',
    '#7bd389',
  ],
  team: ['#7bd389', '#e89bd0', '#9b8bff', '#ffb86b', '#5ad6cf', '#ff7b7b', '#d0c24a'],
};

export const DarkColors: AppColors = {
  bg: {
    base: '#0c0e10',
    surface: '#16191c',
    sheet: '#15181b',
    archive: '#13161a',
    elevated: '#1e2226',
    media: '#23272b',
  },
  text: {
    primary: '#f4f6f5',
    secondary: '#cfd4d6',
    muted: '#9aa3a7',
    placeholder: '#5d666b',
    ghost: '#6b7378',
  },
  border: {
    default: 'rgba(255,255,255,0.07)',
    medium: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.10)',
  },
  accent: sharedAccent,
  ...sharedPalette,
};

export const LightColors: AppColors = {
  bg: {
    base: '#eef0f3',
    surface: '#ffffff',
    sheet: '#ffffff',
    archive: '#f4f6f8',
    elevated: '#e2e5e9',
    media: '#d8dce0',
  },
  text: {
    primary: '#0c0e10',
    secondary: '#2e3336',
    muted: '#5e676c',
    placeholder: '#9aa3a7',
    ghost: '#b8c0c4',
  },
  border: {
    default: 'rgba(0,0,0,0.07)',
    medium: 'rgba(0,0,0,0.09)',
    strong: 'rgba(0,0,0,0.12)',
  },
  accent: sharedAccent,
  ...sharedPalette,
};

export const colorsByScheme: Record<ColorScheme, AppColors> = {
  dark: DarkColors,
  light: LightColors,
};

// Backwards-compat default (dark)
export const Colors: AppColors = DarkColors;
