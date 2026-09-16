import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

// Minimal story: Card.types.ts has no props yet and the component
// renders null (see CARD.md — spec is still a TODO stub). Richer
// stories belong here once the spec is filled in (ADR 0011, ADR 0012).
const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
