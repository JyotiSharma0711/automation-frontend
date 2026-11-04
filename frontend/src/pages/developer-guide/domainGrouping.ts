import { DOMAIN_FRIENDLY_NAMES } from "@constants/common";
import { isDevGuideEnabled } from "@/types/environment";

import type { BuildEntry } from "./types";
import { isDomainEnabled } from "./utils";

export function getDomainShortLabel(domainKey: string): string {
    return domainKey.replace(/^ONDC:/i, "");
}

/** Domain keys always sorted to the end of their family's list, in this
 * relative order — e.g. Gift Cards (FIS10) and Metro Card Recharge (FIS11)
 * trail the rest of Financial Services rather than sorting alphabetically. */
const TRAILING_DOMAIN_KEYS = ["ONDC:FIS10", "ONDC:FIS11"];

/** Merge derived family keys into a shared group (e.g. NIC → LOG for logistics). */
const DOMAIN_FAMILY_GROUP_ALIASES: Record<string, string> = {
    NIC: "LOG",
    OG: "LOG",
    RETEB: "RET",
    RETINVL: "RET",
};

/** Family key for grouping, e.g. ONDC:FIS12 and ONDC:FIS13 → FIS */
export function getDomainFamilyKey(domainKey: string): string {
    const short = getDomainShortLabel(domainKey);
    const match = short.match(/^([A-Za-z]+)/);
    const raw = match ? match[1].toUpperCase() : short.toUpperCase();
    return DOMAIN_FAMILY_GROUP_ALIASES[raw] ?? raw;
}

/** Display titles keyed by derived family prefix (LOG10 → LOG, ONDC:RET11 → RET). */
const DOMAIN_FAMILY_TITLES: Record<string, string> = {
    FIS: "Financial Services",
    LOG: "Logistics",
    TRV: "Mobility Transit and Tourism",
    RET: "Retail",
    NTS: "Network Services",
};

/** Display title for a domain family (e.g. FIS → "Financial Services"). */
export function getDomainFamilyLabel(familyKey: string): string {
    const key = familyKey.toUpperCase();
    return DOMAIN_FAMILY_TITLES[key] ?? familyKey;
}

/** User-friendly name for a domain code, falling back to its family name (e.g. LOG10 → "Logistics") when no specific name is mapped. */
export function getDomainFriendlyName(domainKey: string): string {
    return DOMAIN_FRIENDLY_NAMES[domainKey] ?? getDomainFamilyLabel(getDomainFamilyKey(domainKey));
}

/** Consistent "Friendly Name (CODE)" label, e.g. "Grocery (RET10)". */
export function getDomainDisplayLabel(domainKey: string): string {
    // return `${getDomainFriendlyName(domainKey)} (${getDomainShortLabel(domainKey)})`;
    return `${getDomainFriendlyName(domainKey)}`;
}

export interface DomainFamilyGroup {
    familyKey: string;
    label: string;
    domains: BuildEntry[];
}

function consolidateSameNameDomains(domains: BuildEntry[]): BuildEntry[] {
    const map = new Map<string, BuildEntry>();

    for (const dom of domains) {
        const friendlyName = getDomainFriendlyName(dom.key);
        const existing = map.get(friendlyName);

        const versionWithDomain = (dom.version ?? []).map((ver) => ({
            ...ver,
            domainKey: (ver as { domainKey?: string }).domainKey ?? dom.key,
        }));

        if (existing) {
            existing.version = [...existing.version, ...versionWithDomain];
        } else {
            map.set(friendlyName, {
                key: dom.key,
                version: versionWithDomain,
            });
        }
    }

    return [...map.values()];
}

export function groupBuildsByFamily(builds: BuildEntry[]): DomainFamilyGroup[] {
    const map = new Map<string, DomainFamilyGroup>();

    for (const dom of builds) {
        const familyKey = getDomainFamilyKey(dom.key);
        const existing = map.get(familyKey);
        if (existing) {
            existing.domains.push(dom);
        } else {
            map.set(familyKey, {
                familyKey,
                label: getDomainFamilyLabel(familyKey),
                domains: [dom],
            });
        }
    }

    return [...map.values()]
        .map((family) => ({
            ...family,
            label: getDomainFamilyLabel(family.familyKey),
            domains: consolidateSameNameDomains(family.domains).sort((a, b) => {
                const aIdx = TRAILING_DOMAIN_KEYS.indexOf(a.key);
                const bIdx = TRAILING_DOMAIN_KEYS.indexOf(b.key);
                if (aIdx !== -1 || bIdx !== -1) {
                    if (aIdx === -1) return -1;
                    if (bIdx === -1) return 1;
                    return aIdx - bIdx;
                }
                return a.key.localeCompare(b.key);
            }),
        }))
        .sort((a, b) => {
            const aEn = a.domains.some(isDomainEnabled);
            const bEn = b.domains.some(isDomainEnabled);
            if (aEn !== bEn) return aEn ? -1 : 1;
            return a.label.localeCompare(b.label);
        });
}

/** Beta release scope for "Explore by Domain": whenever the Developer Guide
 * is enabled (`isDevGuideEnabled`), hides every family except Financial
 * Services, and within it every domain except Credit — applied identically
 * wherever `groupBuildsByFamily`'s output feeds the UI (left sidebar nav
 * tree, the standalone domains page), so both stay in sync from this one
 * place. */
export function applyDevGuideBetaDomainScope(families: DomainFamilyGroup[]): DomainFamilyGroup[] {
    if (!isDevGuideEnabled) return families;
    return families
        .filter((family) => family.familyKey === "FIS")
        .map((family) => ({
            ...family,
            domains: family.domains.filter((dom) => getDomainFriendlyName(dom.key) === "Credit"),
        }));
}
