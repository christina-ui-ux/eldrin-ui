import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenColors } from './TokensColors';

const meta = {
  title: 'Foundation/Tokens',
  component: TokenColors,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TokenColors>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Colors: Story = {};
