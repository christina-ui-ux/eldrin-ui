import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography as TypographyPage, TypographyOverview } from './Typography';
import { TypographyTokens } from './TypographyTokens';

const meta = {
  title: 'Foundation/Typography',
  component: TypographyPage,
  parameters: {
    layout: 'padded',
    pageDocs: {
      title: 'Typography',
      tabs: [
        { label: 'Overview', content: <TypographyOverview /> },
        { label: 'Tokens', content: <TypographyTokens /> },
      ],
    },
  },
} satisfies Meta<typeof TypographyPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// `!dev` hides this story's own canvas entry from the sidebar — a
// documentation page has no separate "raw story" worth clicking into,
// only the Docs render (GlobalDocsContainer's pageDocs branch above).
export const Typography: Story = {
  tags: ['!dev'],
};
