import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

// Minimal story: Button.types.ts has no props yet and the component
// renders null (see BUTTON.md — spec is still a TODO stub). Richer
// stories (variants/sizes/states) belong here once the spec's Variants/
// Sizes/States/Props sections are filled in — a future generator target,
// not hand-authored ahead of the spec (see ADR 0011, ADR 0012).
const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
