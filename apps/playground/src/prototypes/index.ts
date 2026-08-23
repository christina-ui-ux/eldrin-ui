import { lazy } from 'react';

export interface Prototype {
  slug: string;
  title: string;
  description: string;
  Component: React.LazyExoticComponent<React.ComponentType>;
}

// Add an entry here whenever a new prototypes/<slug>/index.tsx is created —
// this list drives both routing (App.tsx) and the home page's link list.
export const prototypes: Prototype[] = [
  {
    slug: 'kitchen-sink',
    title: 'Kitchen sink',
    description: 'Every component rendered with no props — a baseline sanity check.',
    Component: lazy(() => import('./kitchen-sink')),
  },
];
