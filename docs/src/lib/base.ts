/** Prefix a root-relative path with the site's configured `base`. */
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}/${path.replace(/^\//, '')}`;
}
