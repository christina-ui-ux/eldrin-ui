import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

// Minimal story: Badge.types.ts has no props yet and the component
// renders null (see BADGE.md — spec is still a TODO stub). Richer
// stories belong here once the spec is filled in (ADR 0011, ADR 0012).
const meta = {
  title: 'Components/Badge',
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
