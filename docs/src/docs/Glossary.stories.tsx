import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlossaryOverview, GlossaryCode } from './Glossary';

const meta = {
  title: 'Docs Overview/Glossary',
  component: GlossaryOverview,
  parameters: {
    layout: 'padded',
    pageDocs: {
      title: 'Glossary',
      tabs: [
        { label: 'Overview', content: <GlossaryOverview /> },
        { label: 'glossary.yaml', content: <GlossaryCode /> },
      ],
    },
  },
} satisfies Meta<typeof GlossaryOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

// `!dev` hides this story's own canvas entry from the sidebar — see
// Typography.stories.tsx for why.
export const Glossary: Story = {
  tags: ['!dev'],
};
