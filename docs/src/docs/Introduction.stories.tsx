import type { Meta, StoryObj } from '@storybook/react-vite';
import { Introduction as IntroductionPage } from './Introduction';

const meta = {
  title: 'Docs Overview/Introduction',
  component: IntroductionPage,
  parameters: {
    layout: 'padded',
    pageDocs: {
      title: 'Eldrin UI',
      tabs: [{ label: 'Overview', content: <IntroductionPage /> }],
    },
  },
} satisfies Meta<typeof IntroductionPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// `!dev` hides this story's own canvas entry from the sidebar — see
// Typography.stories.tsx for why.
export const Introduction: Story = {
  tags: ['!dev'],
};
