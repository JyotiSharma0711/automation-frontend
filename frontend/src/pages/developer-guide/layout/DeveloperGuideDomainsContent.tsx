import { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Square3Stack3DIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getDeveloperGuideUseCasePath } from "@constants/routes";
import type { BuildEntry } from "../types";
import {
    groupBuildsByFamily,
    getDomainDisplayLabel,
    getDomainFriendlyName,
} from "../domainGrouping";
import { isDomainEnabled, isUseCaseEnabled } from "../utils";
import { useDeveloperGuideShell } from "./DeveloperGuideNav";
import DomainCardsSection from "../landing/DomainCardsSection";
import { Input } from "@components/Shadcn/Input";
import {
    NAV_STATUS_LABEL,
    NAV_STATUS_STYLES,
    NAV_STATUS_VALUES,
} from "../shared/statusPlaceholders";

const DeveloperGuideDomainsContent: FC = () => {
    const navigate = useNavigate();
    const { builds, loadError, closeNavSidebar } = useDeveloperGuideShell();
    const [domainSearch, setDomainSearch] = useState("");

    const handleUseCaseClick = (dom: BuildEntry, versionKey: string, usecaseLabel: string) => {
        if (!isUseCaseEnabled(dom, usecaseLabel)) return;
        closeNavSidebar();
        navigate(getDeveloperGuideUseCasePath(dom.key, versionKey, usecaseLabel));
    };

    const domainFamilies = useMemo(() => groupBuildsByFamily(builds), [builds]);

    const filteredFamilies = useMemo(() => {
        const q = domainSearch.trim().toLowerCase();
        if (!q) return domainFamilies;
        return domainFamilies
            .map((family) => ({
                ...family,
                domains: family.domains.filter(
                    (dom) =>
                        family.label.toLowerCase().includes(q) ||
                        family.familyKey.toLowerCase().includes(q) ||
                        dom.key.toLowerCase().includes(q) ||
                        getDomainFriendlyName(dom.key).toLowerCase().includes(q) ||
                        getDomainDisplayLabel(dom.key).toLowerCase().includes(q)
                ),
            }))
            .filter((family) => family.domains.length > 0);
    }, [domainFamilies, domainSearch]);

    return (
        <div className="min-h-full">
            <header className="border-b border-sky-100 dark:border-sky-500/30 bg-white dark:from-sky-500/10 dark:via-surface-elevated dark:to-surface-elevated">
                <div className="p-8 max-w-3xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                        Explore by <span className="text-sky-500 dark:text-sky-400">domain</span>
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed max-w-2xl p-0 mb-0">
                        Browse protocol specifications and use-case flows grouped by domain family.
                        Expand a domain and select a use case to open its flow documentation.
                    </p>
                </div>
            </header>

            <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center shrink-0">
                            <Square3Stack3DIcon
                                className="w-3.75 h-3.75 text-sky-600 dark:text-sky-400"
                                aria-hidden
                            />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 leading-none mb-2">
                                All domains
                            </p>
                            <p className="text-xs text-slate-500 mb-0">
                                Related domains are grouped (e.g. Credit, Insurance under Financial
                                Services)
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <Input
                            type="search"
                            placeholder="Search domains..."
                            value={domainSearch}
                            onChange={(e) => setDomainSearch(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-elevated border-slate-200 rounded-lg shadow-xs focus-visible:ring-2 focus-visible:ring-sky-100 dark:focus-visible:ring-sky-500/20 focus-visible:border-sky-300 placeholder-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                <DomainCardsSection
                    domainFamilies={filteredFamilies}
                    error={loadError}
                    isDomainEnabled={isDomainEnabled}
                    isUseCaseEnabled={isUseCaseEnabled}
                    onUseCaseClick={handleUseCaseClick}
                />
                <aside
                    className="mt-8 rounded-lg border border-slate-200 dark:border-border-default bg-slate-50 dark:bg-surface-muted px-4 py-3"
                    aria-label="Version status legend"
                >
                    <p className="text-sm font-semibold text-slate-800 dark:text-text-primary mb-1">
                        Note
                    </p>
                    <p className="text-sm text-slate-600 dark:text-text-secondary mb-3 leading-relaxed">
                        Version pills in the sidebar navigation use these colors to indicate
                        documentation lifecycle status:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {NAV_STATUS_VALUES.map((status) => (
                            <span
                                key={status}
                                className={`rounded-full px-2.5 py-1.5 text-caption-2-size font-semibold leading-none ${NAV_STATUS_STYLES[status]}`}
                            >
                                {NAV_STATUS_LABEL[status]}
                            </span>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DeveloperGuideDomainsContent;
