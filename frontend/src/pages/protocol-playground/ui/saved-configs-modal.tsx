import React, { useContext, useState, useEffect, useMemo } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { SavedConfigMetadata } from "../utils/config-storage";
import {
    FiX,
    FiTrash2,
    FiArrowRight,
    FiClock,
    FiGithub,
    FiChevronRight,
    FiChevronDown,
    FiFolder,
    FiFile,
    FiInbox,
    FiFolderPlus,
} from "react-icons/fi";

interface SavedConfigsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigSelected: (domain: string, version: string, flowId: string) => void;
}

// ─── Types for grouped structure ────────────────────────────────────────────

interface FlowNode {
    config: SavedConfigMetadata;
}

interface VersionNode {
    version: string;
    flows: FlowNode[];
}

interface DomainNode {
    domain: string;
    versions: VersionNode[];
    totalConfigs: number;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface FlowRowProps {
    config: SavedConfigMetadata;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}

const FlowRow: React.FC<FlowRowProps> = ({ config, onLoad, onDelete }) => {
    const isGist = config.configId.startsWith("gist_");

    return (
        <div className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-lg hover:bg-sky-50 transition-colors border border-transparent hover:border-sky-100">
            {/* Connector line visual */}
            <div className="flex items-center gap-2 shrink-0 text-gray-300">
                <span className="w-4 h-px bg-gray-200" />
                <FiFile className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            </div>

            {/* Flow label */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 truncate">{config.flowId}</span>
                {isGist && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                        <FiGithub className="w-2.5 h-2.5" />
                        Gist
                    </span>
                )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mr-2">
                <FiClock className="w-3 h-3" />
                {new Date(config.savedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </div>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onLoad(config)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                    title="Load configuration"
                >
                    Load
                    <FiArrowRight className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onDelete(config)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete configuration"
                >
                    <FiTrash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

interface VersionFolderProps {
    node: VersionNode;
    domainKey: string;
    openVersions: Set<string>;
    onToggle: (key: string) => void;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}

const VersionFolder: React.FC<VersionFolderProps> = ({
    node,
    domainKey,
    openVersions,
    onToggle,
    onLoad,
    onDelete,
}) => {
    const key = `${domainKey}::${node.version}`;
    const isOpen = openVersions.has(key);

    return (
        <div>
            {/* Version row */}
            <button
                onClick={() => onToggle(key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
                <div className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-4 h-px bg-gray-200" />
                    {isOpen ? (
                        <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </div>
                {isOpen ? (
                    <FiFolderPlus className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                    <FiFolder className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-sm font-semibold text-gray-600">v{node.version}</span>
                <span className="ml-auto text-xs text-gray-400 font-normal">
                    {node.flows.length} flow{node.flows.length !== 1 ? "s" : ""}
                </span>
            </button>

            {/* Flows */}
            {isOpen && (
                <div className="ml-8 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                    {node.flows.map((f) => (
                        <FlowRow
                            key={f.config.configId}
                            config={f.config}
                            onLoad={onLoad}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface DomainFolderProps {
    node: DomainNode;
    openDomains: Set<string>;
    openVersions: Set<string>;
    onToggleDomain: (domain: string) => void;
    onToggleVersion: (key: string) => void;
    onLoad: (config: SavedConfigMetadata) => void;
    onDelete: (config: SavedConfigMetadata) => void;
}

const DomainFolder: React.FC<DomainFolderProps> = ({
    node,
    openDomains,
    openVersions,
    onToggleDomain,
    onToggleVersion,
    onLoad,
    onDelete,
}) => {
    const isOpen = openDomains.has(node.domain);

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Domain header */}
            <button
                onClick={() => onToggleDomain(node.domain)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
                {isOpen ? (
                    <FiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                    <FiChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                {isOpen ? (
                    <FiFolderPlus className="w-5 h-5 text-sky-500 shrink-0" />
                ) : (
                    <FiFolder className="w-5 h-5 text-sky-400 shrink-0" />
                )}
                <span className="font-semibold text-gray-800 text-sm">{node.domain}</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium border border-sky-100">
                        {node.versions.length} version{node.versions.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium border border-gray-100">
                        {node.totalConfigs} config{node.totalConfigs !== 1 ? "s" : ""}
                    </span>
                </div>
            </button>

            {/* Versions */}
            {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-0.5 border-t border-gray-50 bg-gray-50/40">
                    {node.versions.map((v) => (
                        <VersionFolder
                            key={v.version}
                            node={v}
                            domainKey={node.domain}
                            openVersions={openVersions}
                            onToggle={onToggleVersion}
                            onLoad={onLoad}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────

export const SavedConfigsModal: React.FC<SavedConfigsModalProps> = ({
    isOpen,
    onClose,
    onConfigSelected,
}) => {
    const { getSavedConfigs, loadSavedConfig, deleteSavedConfig } = useContext(PlaygroundContext);

    const [savedConfigs, setSavedConfigs] = useState<SavedConfigMetadata[]>([]);
    const [openDomains, setOpenDomains] = useState<Set<string>>(new Set());
    const [openVersions, setOpenVersions] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            const configs = getSavedConfigs();
            setSavedConfigs(configs);

            // Auto-expand if only one domain
            const domains = [...new Set(configs.map((c) => c.domain))];
            if (domains.length === 1) {
                setOpenDomains(new Set(domains));
            }
        }
    }, [isOpen, getSavedConfigs]);

    // Build tree, filtered by search
    const tree = useMemo<DomainNode[]>(() => {
        const q = search.toLowerCase().trim();
        const filtered = q
            ? savedConfigs.filter(
                  (c) =>
                      c.domain.toLowerCase().includes(q) ||
                      c.version.toLowerCase().includes(q) ||
                      c.flowId.toLowerCase().includes(q)
              )
            : savedConfigs;

        const domainMap = new Map<string, Map<string, SavedConfigMetadata[]>>();
        for (const cfg of filtered) {
            if (!domainMap.has(cfg.domain)) domainMap.set(cfg.domain, new Map());
            const verMap = domainMap.get(cfg.domain)!;
            if (!verMap.has(cfg.version)) verMap.set(cfg.version, []);
            verMap.get(cfg.version)!.push(cfg);
        }

        return [...domainMap.entries()].map(([domain, verMap]) => {
            const versions: VersionNode[] = [...verMap.entries()].map(([version, cfgs]) => ({
                version,
                flows: cfgs
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                    .map((c) => ({ config: c })),
            }));
            versions.sort((a, b) => a.version.localeCompare(b.version));
            return {
                domain,
                versions,
                totalConfigs: versions.reduce((s, v) => s + v.flows.length, 0),
            };
        });
    }, [savedConfigs, search]);

    // Auto-expand matching folders when searching
    useEffect(() => {
        if (search.trim()) {
            const allDomains = new Set(tree.map((d) => d.domain));
            const allVersionKeys = new Set(
                tree.flatMap((d) => d.versions.map((v) => `${d.domain}::${v.version}`))
            );
            setOpenDomains(allDomains);
            setOpenVersions(allVersionKeys);
        }
    }, [search, tree]);

    const toggleDomain = (domain: string) => {
        setOpenDomains((prev) => {
            const next = new Set(prev);
            if (next.has(domain)) {
                next.delete(domain);
            } else {
                next.add(domain);
            }
            return next;
        });
    };

    const toggleVersion = (key: string) => {
        setOpenVersions((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const handleLoad = (config: SavedConfigMetadata) => {
        const success = loadSavedConfig(config.configId);
        if (success) {
            onConfigSelected(config.domain, config.version, config.flowId);
            onClose();
        }
    };

    const handleDelete = (config: SavedConfigMetadata) => {
        if (window.confirm(`Delete "${config.domain} / v${config.version} / ${config.flowId}"?`)) {
            deleteSavedConfig(config.configId);
            setSavedConfigs(getSavedConfigs());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Saved Configurations
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {savedConfigs.length} configuration
                            {savedConfigs.length !== 1 ? "s" : ""} across{" "}
                            {[...new Set(savedConfigs.map((c) => c.domain))].length} domain
                            {[...new Set(savedConfigs.map((c) => c.domain))].length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Search ── */}
                {savedConfigs.length > 0 && (
                    <div className="px-6 py-3 border-b border-gray-50">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter by domain, version, or flow…"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 placeholder:text-gray-400 transition"
                        />
                    </div>
                )}

                {/* ── Tree body ── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {tree.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                                <FiInbox className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                                {search ? "No matching configurations" : "No saved configurations"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                {search
                                    ? "Try a different search term"
                                    : "Save a configuration from the playground to access it here"}
                            </p>
                        </div>
                    ) : (
                        tree.map((domainNode) => (
                            <DomainFolder
                                key={domainNode.domain}
                                node={domainNode}
                                openDomains={openDomains}
                                openVersions={openVersions}
                                onToggleDomain={toggleDomain}
                                onToggleVersion={toggleVersion}
                                onLoad={handleLoad}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
