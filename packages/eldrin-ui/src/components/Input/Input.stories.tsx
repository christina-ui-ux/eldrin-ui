import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

// Minimal story: Input.types.ts has no props yet and the component
// renders null (see INPUT.md — spec is still a TODO stub). Richer
// stories belong here once the spec is filled in (ADR 0011, ADR 0012).
const meta = {
  title: 'Components/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
