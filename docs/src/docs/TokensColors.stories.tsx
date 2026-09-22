import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenColors, ColorsOverview } from './TokensColors';
import { ColorsTokens } from './ColorsTokens';

const meta = {
  title: 'Foundation/Colors',
  component: TokenColors,
  parameters: {
    layout: 'padded',
    pageDocs: {
      title: 'Colors',
      sourcePath: 'packages/eldrin-ui/tokens-source/semantic.json',
      tabs: [
        { label: 'Overview', content: <ColorsOverview /> },
        { label: 'Tokens', content: <ColorsTokens /> },
      ],
    },
  },
} satisfies Meta<typeof TokenColors>;

export default meta;

type Story = StoryObj<typeof meta>;

// `!dev` hides this story's own canvas entry from the sidebar — see
// Typography.stories.tsx for why.
export const Colors: Story = {
  tags: ['!dev'],
};
