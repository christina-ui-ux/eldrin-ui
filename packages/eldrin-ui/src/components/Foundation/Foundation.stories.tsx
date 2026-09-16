import type { Meta, StoryObj } from '@storybook/react-vite';
import { Foundation } from './Foundation';

// Minimal story: Foundation.types.ts has no props yet and the component
// renders null (see FOUNDATION.md — spec is still a TODO stub). Richer
// stories belong here once the spec is filled in (ADR 0011, ADR 0012).
const meta = {
  title: 'Components/Foundation',
  component: Foundation,
} satisfies Meta<typeof Foundation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
