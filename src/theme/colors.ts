// ─────────────────────────────────────────────
//  LISTA · Theme · Colors
//  Brand palette + dark/light semantic tokens
// ─────────────────────────────────────────────

export const palette = {
  charcoal: '#272727',
  amber: '#FED766',
  teal: '#009FB7',
  slate: '#696773',
  offWhite: '#EFF1F3',
  black: '#0D0D0D',
  white: '#FFFFFF',
  danger: '#E05C5C',
  success: '#4CAF50',
} as const;

export type Theme = {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  primary: string;
  primaryLight: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textOnPrimary: string;
  border: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
  inputBorder: string;
  divider: string;
  danger: string;
  success: string;
  overlay: string;
  shadow: string;
  indicator: string;
};

export const darkTheme: Theme = {
  background: '#1A1A1A',
  surface: '#272727',
  card: '#2F2F2F',
  cardBorder: '#3A3A3A',
  primary: palette.amber,
  primaryLight: '#FEE29A',
  accent: palette.teal,
  textPrimary: palette.offWhite,
  textSecondary: '#A8A5B0',
  textDisabled: '#5A5A5A',
  textOnPrimary: palette.charcoal,
  border: '#3D3D3D',
  tabBar: '#1A1A1A',
  tabBarActive: palette.amber,
  tabBarInactive: '#555555',
  inputBackground: '#333333',
  inputBorder: '#444444',
  divider: '#333333',
  danger: palette.danger,
  success: palette.success,
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.5)',
  indicator: palette.amber,
};

export const lightTheme: Theme = {
  background: palette.offWhite,
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: palette.teal,
  primaryLight: '#66C9D9',
  accent: palette.amber,
  textPrimary: palette.charcoal,
  textSecondary: palette.slate,
  textDisabled: '#B0B0B0',
  textOnPrimary: palette.white,
  border: '#D8D8D8',
  tabBar: palette.charcoal,
  tabBarActive: palette.amber,
  tabBarInactive: '#888888',
  inputBackground: '#FFFFFF',
  inputBorder: '#D0D0D0',
  divider: '#EEEEEE',
  danger: '#D32F2F',
  success: '#388E3C',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.12)',
  indicator: palette.teal,
};
