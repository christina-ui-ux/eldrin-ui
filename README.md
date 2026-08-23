# Eldrin UI
 
![status](https://img.shields.io/badge/status-early%20experiment-orange)
![license](https://img.shields.io/github/license/christina-ui-ux/eldrin-ui)
![built with](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript%20%2B%20Tailwind-blue)
![AI ready](https://img.shields.io/badge/AI--ready-Claude%20Code%20%26%20Cursor-violet)
 
Open-source React component library with structured design token intent and component blueprints. Designed for Claude Code and Cursor. Built for humans and AI agents alike.
 
> **Early-stage experiment.** Things will change. Feedback is very welcome.
 
---
 
## What I'm exploring
 
Most component libraries ship components. Eldrin UI is an attempt to ship **meaning** alongside them.
 
The core idea: what if every token knew why it existed, and every component came with a blueprint that both humans and AI agents could read and reason with?
 
- **Token intent** — every design token carries metadata: what it's for, what it's not for, and accessibility requirements
- **Component blueprints** — every component is defined by a machine-readable blueprint before a single line of code is written
- **AI-first structure** — `CLAUDE.md` and `DESIGN.md` give Claude Code and Cursor the full system context out of the box
---
 
## The plan
 
Eldrin UI is being built in the open, one component at a time.
 
**Now**
- Core token system with intent metadata
- First components: Foundation, Button, Input, Badge, Card
- Component blueprints for each
- Astro docs site and a workspace-linked playground app, both scaffolded — content is still thin
**Next**
- Real component implementations, rendered live in the docs site and prototyped in the playground
- Figma library with Token Studio sync
- Figma MCP integration for automated drift detection between design and code
**Later**
- Full component coverage
- Contribution guidelines
- Theming support
---
 
## Stack
 
- React + TypeScript
- Tailwind CSS v4
- Vite
- No ShadCN — every component is built from scratch
---
 
## Using with Claude Code
 
Clone the repo and start Claude Code in the project root.
`CLAUDE.md` loads automatically as context.
 
```bash
git clone https://github.com/DEIN-USERNAME/eldrin-ui.git
cd eldrin-ui
npm install
claude
```
 
For Cursor, `.cursorrules` is included in the root.
 
---
 
## Structure
 
```
eldrin-ui/
├── CLAUDE.md                    # AI context for Claude Code & Cursor
├── DESIGN.md                    # AI context for designers & Figma
├── package.json                 # npm workspace root (private)
├── packages/
│   └── eldrin-ui/                # the published component library
│       └── src/
│           ├── tokens/            # Design tokens with intent metadata
│           └── components/        # Components + blueprints
│               └── Button/
│                   ├── BUTTON.md  # Component blueprint
│                   ├── Button.tsx
│                   └── Button.types.ts
├── apps/
│   └── playground/                # prototyping app, workspace-linked to eldrin-ui
└── docs/                        # Astro docs site, workspace member
```
 
---
 
## License
 
MIT © [Christina W. Söntgerath](https://github.com/christina-ui-ux)