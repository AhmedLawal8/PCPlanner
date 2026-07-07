import { createTheme, type MantineColorsTuple } from '@mantine/core';

const brandOrange: MantineColorsTuple = [
  '#fdf1ea',
  '#fbdfcb',
  '#f7c2a0',
  '#f2a374',
  '#ee8b52',
  '#ed8224',
  '#db6023',
  '#b94f1d',
  '#973f17',
  '#752f11',
];

export const theme = createTheme({
  primaryColor: 'brandOrange',
  colors: { brandOrange },
  black: '#333232',
  other: {
    neutralLight: '#c9c9c9',
    neutralMid: '#7a7a79',
  },
});

declare module '@mantine/core' {
  export interface MantineThemeOther {
    neutralLight: string;
    neutralMid: string;
  }
}
