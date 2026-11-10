import {
    stripMarkdownOnThisPage,
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";
import { labelToSlug } from "../utils";
import { isSequenceDiagramDocSlug } from "../FlowInformation/utils";

function prepareDocContent(markdown: string): string {
    return stripRedundantMarkdownHorizontalRules(
        stripMarkdownOnThisPage(stripMarkdownTableOfContents(markdown))
    );
}

/** Resolve use-case documentation from API spec data. */
export function resolveUseCaseDocs(
    apiDocs: Record<string, string> | undefined
): Record<string, string> | undefined {
    if (!apiDocs) return undefined;

    return Object.fromEntries(
        Object.entries(apiDocs).map(([slug, content]) => [slug, prepareDocContent(content)])
    );
}

/** `x-docs` is shared across all use cases under a spec (resolved once from the
 * domain's `./docs` directory) — there's no per-use-case field in the spec data
 * itself. Scoping instead relies on a filename convention in `automation-specifications`:
 * a doc belongs to a use case's Additional Resources tab when its slug is
 * `<usecase-slug>-resources-<anything>` (e.g. `personal-loan-resources-01-kfsdoc`
 * for the "Personal Loan" use case). The numeric segment controls display order —
 * matches are sorted by slug. A use case with no matching docs gets no tab at all. */
const ADDITIONAL_RESOURCES_MARKER = "-resources-";

function isAdditionalResourcesSlug(slug: string): boolean {
    return slug.toLowerCase().includes(ADDITIONAL_RESOURCES_MARKER);
}

/** Resolve the "Additional Resources" docs from API spec data for the given use case
 * (e.g. `apiUsecase ?? slug`) — see `ADDITIONAL_RESOURCES_MARKER` for the naming
 * convention that scopes and orders these. Returned keys have the
 * `<usecase-slug>-resources-<n>-` prefix stripped for display. */
export function resolveAdditionalResourcesDocs(
    apiDocs: Record<string, string> | undefined,
    useCaseId: string | undefined
): Record<string, string> | undefined {
    if (!apiDocs || !useCaseId) return undefined;

    const prefix = `${labelToSlug(useCaseId)}${ADDITIONAL_RESOURCES_MARKER}`;

    const matches = Object.entries(apiDocs)
        .filter(([slug]) => slug.toLowerCase().startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b));
    if (matches.length === 0) return undefined;

    return Object.fromEntries(
        matches.map(([slug, content]) => {
            const displaySlug = slug.slice(prefix.length).replace(/^\d+-/, "") || slug;
            return [displaySlug, prepareDocContent(content)];
        })
    );
}

/** The Changelog tab's markdown comes from the backend as a single shared doc
 * per domain/version — the canonical filename going forward is
 * `changelogs.md`. Matched by normalizing (lowercased, `-`/`_` → space) so
 * minor naming variance still resolves; "changelog"/"release notes" are kept
 * as fallbacks for specs authored before this filename was settled on.
 * DocsViewer's `filteredDocs` excludes this slug from the normal docs tabs,
 * so it never leaks into Use Case Brief. */
const CHANGELOG_SLUGS = new Set(["changelogs", "changelog", "release notes"]);

/** Legacy per-use-case convention (`<usecase-slug>-changelog`, e.g.
 * `business-loan-changelog`) some older specs still ship. No longer used to
 * resolve Changelog tab *content* (the canonical `changelogs.md` doc is the
 * only source now), but still excluded from the normal docs tabs so a
 * leftover file doesn't show up as its own Use Case Brief tab. */
const LEGACY_PER_USE_CASE_SUFFIX = "-changelog";

function isCanonicalChangelogSlug(slug: string): boolean {
    return CHANGELOG_SLUGS.has(slug.toLowerCase().replace(/[-_]/g, " ").trim());
}

/** True for the canonical changelog doc or a legacy per-use-case one — used by
 * `DocsViewer` to keep both out of the normal docs tabs list (same as
 * `isAdditionalResourcesSlug`). */
function isChangelogSlug(slug: string): boolean {
    return (
        isCanonicalChangelogSlug(slug) || slug.toLowerCase().endsWith(LEGACY_PER_USE_CASE_SUFFIX)
    );
}

/** Resolve the Changelog tab's markdown doc from API spec data, if present. */
export function resolveChangelogDoc(
    apiDocs: Record<string, string> | undefined
): string | undefined {
    if (!apiDocs) return undefined;
    const entry = Object.entries(apiDocs).find(([slug]) => isCanonicalChangelogSlug(slug));
    return entry ? prepareDocContent(entry[1]) : undefined;
}

export { isAdditionalResourcesSlug, isChangelogSlug, isSequenceDiagramDocSlug };
