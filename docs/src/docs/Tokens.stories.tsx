import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tokens as TokensPage } from './Tokens';

const meta = {
  title: 'Foundation/Tokens',
  component: TokensPage,
  parameters: {
    layout: 'padded',
    pageDocs: {
      title: 'Tokens',
      tabs: [{ label: 'Overview', content: <TokensPage /> }],
    },
  },
} satisfies Meta<typeof TokensPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// `!dev` hides this story's own canvas entry from the sidebar — see
// Typography.stories.tsx for why.
export const Tokens: Story = {
  tags: ['!dev'],
};
