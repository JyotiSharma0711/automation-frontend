/** Doc slugs whose section headings appear in the shell sidebar. */
export const DOCS_WITH_SIDEBAR_SECTIONS = new Set(["ondc-FAQs"]);

/** General docs shown as a single shell link with no section navigation anywhere. */
export const DOCS_WITH_FLAT_CONTENT = new Set<string>([]);

export function docUsesSidebarSections(slug: string | undefined): boolean {
    return slug !== undefined && DOCS_WITH_SIDEBAR_SECTIONS.has(slug);
}

export function docUsesFlatContent(slug: string | undefined): boolean {
    return slug !== undefined && DOCS_WITH_FLAT_CONTENT.has(slug);
}

export function docShowsInPageToc(slug: string | undefined): boolean {
    return Boolean(slug);
}

export function docStripsEmbeddedToc(slug: string | undefined): boolean {
    return Boolean(slug);
}
