import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Sidebar and topbar background matched to the inline-code background
// addon-docs already uses throughout every docs page (#f6f9fc) — pure
// theme config via Storybook's supported manager theming API, not a
// CSS override like main.ts's managerHead hack.
addons.setConfig({
  theme: create({
    base: 'light',
    appBg: '#f6f9fc',
    barBg: '#f6f9fc',
  }),
});
