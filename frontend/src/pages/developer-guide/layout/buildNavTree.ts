import { ROUTES, getDeveloperGuideDocPath, getDeveloperGuideUseCasePath } from "@constants/routes";
import { extractNestedMarkdownToc, stripHeadingNumberPrefix } from "@utils/markdownToc";
import type { BuildEntry, DocMeta } from "../types";
import {
    groupBuildsByFamily,
    applyDevGuideBetaDomainScope,
    getDomainDisplayLabel,
    getDomainFamilyLabel,
    getDomainFriendlyName,
} from "../domainGrouping";
import { isDomainEnabled, sortDocsByPreferredSequence } from "../utils";
import { resolveNavStatus } from "../shared/statusPlaceholders";
import type { NavNode } from "./navTypes";
import { isNavGroup } from "./navTypes";
import { DOCS_WITH_SIDEBAR_SECTIONS } from "./docsWithSidebarSections";

/** Hide the leading chevron on leaf nodes (links and groups with no children). */
function isNavLeaf(node: NavNode): boolean {
    return !isNavGroup(node) || node.children.length === 0;
}

function applyLeafNodeNoIcon(node: NavNode): NavNode {
    if (isNavGroup(node)) {
        const children = node.children.map(applyLeafNodeNoIcon);
        const updated = { ...node, children };
        return isNavLeaf(updated) ? { ...updated, showArrow: false as const } : updated;
    }
    return { ...node, showArrow: false as const };
}

function buildDocNavWithSections(doc: DocMeta, markdown: string): NavNode {
    const basePath = getDeveloperGuideDocPath(doc.slug);
    const sectionNodes: NavNode[] = extractNestedMarkdownToc(markdown).map(
        ({ section, subsections }) => {
            const label = stripHeadingNumberPrefix(section.text);
            const sectionPath = `${basePath}#${section.id}`;

            if (subsections.length === 0) {
                return {
                    id: `doc-${doc.slug}-${section.id}`,
                    label,
                    type: "link" as const,
                    path: sectionPath,
                    searchText: section.text,
                };
            }

            return {
                id: `doc-${doc.slug}-${section.id}`,
                label,
                type: "group" as const,
                path: sectionPath,
                defaultOpen: true,
                searchText: section.text,
                children: subsections.map((subsection) => ({
                    id: `doc-${doc.slug}-${subsection.id}`,
                    label: stripHeadingNumberPrefix(subsection.text),
                    type: "link" as const,
                    path: `${basePath}#${subsection.id}`,
                    searchText: subsection.text,
                })),
            };
        }
    );

    return {
        id: `doc-${doc.slug}`,
        label: doc.label,
        type: "group",
        path: basePath,
        defaultOpen: true,
        searchText: `${doc.label} ${doc.shortDescription} ${doc.slug}`,
        children: sectionNodes,
    };
}

function buildGettingStartedNav(): NavNode {
    return {
        id: "getting-started",
        label: "Getting Started",
        type: "group",
        path: ROUTES.DEVELOPER_GUIDE_GETTING_STARTED,
        defaultOpen: false,
        searchText: "getting started ondc learn use case glossary",
        children: [],
    };
}

export function buildNavTree(
    builds: BuildEntry[],
    docs: DocMeta[],
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean,
    docMarkdownBySlug?: Record<string, string>
): NavNode[] {
    const sortedDomains = [...builds].sort((a, b) => {
        const aEnabled = isDomainEnabled(a);
        const bEnabled = isDomainEnabled(b);
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return a.key.localeCompare(b.key);
    });
    const sortedDocs = sortDocsByPreferredSequence(docs);

    /** Preferred sequence for Credit (FIS12) use cases: PL, GL, BL, LAMF, PF.
     * Matched by keyword so label variants ("PERSONAL LOAN", "Personal Loan v2") still rank;
     * unmatched use cases fall after these, in the default enabled/alphabetical order. */
    const CREDIT_USECASE_MATCHERS: RegExp[] = [
        /PERSONAL/i,
        /GOLD/i,
        /BUSINESS/i,
        /LAMF|MUTUAL/i,
        /PURCHASE/i,
    ];
    function creditUseCaseRank(label: string): number {
        const idx = CREDIT_USECASE_MATCHERS.findIndex((re) => re.test(label));
        return idx === -1 ? CREDIT_USECASE_MATCHERS.length : idx;
    }
    function isCreditDomain(dom: BuildEntry): boolean {
        return getDomainFriendlyName(dom.key) === "Credit";
    }

    function buildUseCaseNodes(dom: BuildEntry): NavNode[] {
        return (dom.version ?? [])
            .flatMap((ver) => {
                const targetDomainKey = (ver as { domainKey?: string }).domainKey ?? dom.key;
                return (ver.usecase ?? []).map((label) => ({
                    domainKey: targetDomainKey,
                    verKey: ver.key,
                    label,
                    backendStatus: ver.usecaseStatus?.[label] ?? ver.status,
                }));
            })
            .sort((a, b) => {
                if (isCreditDomain(dom)) {
                    const rankDiff = creditUseCaseRank(a.label) - creditUseCaseRank(b.label);
                    if (rankDiff !== 0) return rankDiff;
                }
                const aEn = isUseCaseEnabled(dom, a.label);
                const bEn = isUseCaseEnabled(dom, b.label);
                if (aEn !== bEn) return aEn ? -1 : 1;
                return a.label.localeCompare(b.label) || a.verKey.localeCompare(b.verKey);
            })
            .map(({ domainKey, verKey, label, backendStatus }) => {
                const clickable = isUseCaseEnabled(dom, label);
                const status = resolveNavStatus(backendStatus);
                return {
                    id: `usecase-${domainKey}-${verKey}-${label}`,
                    label,
                    suffix: `v${verKey}`,
                    type: "link" as const,
                    path: getDeveloperGuideUseCasePath(domainKey, verKey, label),
                    disabled: !clickable,
                    searchText: `${domainKey} ${label} v${verKey}`,
                    isDomainUseCaseLink: true,
                    ...(status ? { status } : {}),
                };
            });
    }

    /** Sachet (micro) insurance use cases, nested under one "Sachet Insurance" parent group
     * inside the Insurance domain; Health and Motor stay as its siblings. */
    const SACHET_USECASE_RE = /ACCIDENTAL|HOSPICASH|TRANSIT/i;
    function isInsuranceDomain(dom: BuildEntry): boolean {
        return getDomainFriendlyName(dom.key) === "Insurance";
    }

    function buildDomainGroupNode(dom: BuildEntry): NavNode {
        const enabled = isDomainEnabled(dom);
        const displayLabel = getDomainDisplayLabel(dom.key);
        let children = buildUseCaseNodes(dom);

        if (isInsuranceDomain(dom)) {
            const sachet = children.filter((n) => SACHET_USECASE_RE.test(n.label));
            if (sachet.length > 0) {
                children = [
                    ...children.filter((n) => !SACHET_USECASE_RE.test(n.label)),
                    {
                        id: `domain-${dom.key}-sachet`,
                        label: "Sachet Insurance",
                        type: "group" as const,
                        defaultOpen: false,
                        searchText: `Sachet Insurance ${dom.key} ${sachet
                            .map((n) => n.label)
                            .join(" ")}`,
                        children: sachet,
                    },
                ];
            }
        }

        return {
            id: `domain-${dom.key}`,
            label: displayLabel,
            type: "group" as const,
            defaultOpen: enabled,
            searchText: `${displayLabel} ${getDomainFriendlyName(dom.key)} ${dom.key}`,
            children,
        };
    }

    const domainFamilies = applyDevGuideBetaDomainScope(groupBuildsByFamily(sortedDomains));
    const domainChildren: NavNode[] = domainFamilies.map((family) => {
        const familyEnabled = family.domains.some(isDomainEnabled);
        const familyTitle = getDomainFamilyLabel(family.familyKey);

        return {
            id: `family-${family.familyKey}`,
            label: familyTitle,
            type: "group" as const,
            defaultOpen: familyEnabled,
            searchText: `${familyTitle} ${family.familyKey} ${family.domains
                .map((d) => `${getDomainDisplayLabel(d.key)} ${d.key}`)
                .join(" ")}`,
            // A domain labelled the same as its family (e.g. nic2004:60232 → "Logistics" under
            // "Logistics") would repeat the name, so its use cases sit directly under the family.
            children: family.domains.flatMap((dom) => {
                const node = buildDomainGroupNode(dom);
                return node.type === "group" && node.label === familyTitle ? node.children : [node];
            }),
        };
    });

    const tree: NavNode[] = [
        buildGettingStartedNav(),
        {
            id: "general-docs",
            label: "General Documentation",
            type: "group",
            path: ROUTES.DEVELOPER_GUIDE_GENERAL,
            defaultOpen: true,
            searchText: "general documentation auth tools guides reference",
            children: (() => {
                const authToolsNode: NavNode = {
                    id: "auth-tools",
                    label: "Auth Tools",
                    type: "link",
                    path: ROUTES.DEVELOPER_GUIDE_AUTH_TOOLS,
                    searchText: "auth authorization header blake ed25519",
                };
                const docNodes = sortedDocs.map((doc) => {
                    const markdown = docMarkdownBySlug?.[doc.slug];
                    if (DOCS_WITH_SIDEBAR_SECTIONS.has(doc.slug) && markdown) {
                        return buildDocNavWithSections(doc, markdown);
                    }
                    return {
                        id: `doc-${doc.slug}`,
                        label: doc.label,
                        type: "link" as const,
                        path: getDeveloperGuideDocPath(doc.slug),
                        searchText: `${doc.label} ${doc.shortDescription} ${doc.slug}`,
                    };
                });

                return [...docNodes.slice(0, 2), authToolsNode, ...docNodes.slice(2)];
            })(),
        },
    ];

    if (domainChildren.length > 0) {
        tree.push({
            id: "domains",
            label: "Explore by Domain",
            type: "group",
            path: ROUTES.DEVELOPER_GUIDE_DOMAINS,
            defaultOpen: true,
            searchText: "api reference domain use case flows specifications",
            children: domainChildren,
        });
    }

    return tree.map(applyLeafNodeNoIcon);
}
