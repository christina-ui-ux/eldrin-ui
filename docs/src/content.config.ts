import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const decisions = defineCollection({
	// docs/decisions/000N-*.md — the `template.md` file is intentionally excluded
	// by the numeric-prefix pattern, since it holds placeholder values that
	// wouldn't pass the schema below.
	loader: glob({ pattern: '[0-9][0-9][0-9][0-9]-*.md', base: 'decisions' }),
	schema: z.object({
		id: z.number(),
		title: z.string(),
		status: z.enum(['proposed', 'accepted', 'superseded']),
		date: z.coerce.date(),
		superseded_by: z.number().nullable().optional(),
	}),
});

export const collections = { decisions };
