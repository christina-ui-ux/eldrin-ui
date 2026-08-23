export const SITE = {
	title: 'Eldrin UI',
	description:
		'Design tokens with intent metadata and components with machine-readable blueprints.',
	github: 'christina-ui-ux/eldrin-ui',
};

// Static sidebar sections. The "Architecture decisions" section is generated
// dynamically from the `decisions` content collection — see LeftSidebar.astro.
export const SIDEBAR = [
	{ text: 'Core', header: true },
	{ text: 'Introduction', link: '/core/introduction/' },

	{ text: 'Components', header: true },
	{ text: 'Overview', link: '/components/' },
];
