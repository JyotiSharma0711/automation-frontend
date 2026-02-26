import React, { useState, useMemo } from "react";
import Tippy from "@tippyjs/react";
// import "tippy.js/dist/tippy.css";
import "tippy.js/animations/perspective-subtle.css";

import { SelectedType } from "./session-data-tab";

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonNode = JsonObject;

// Icons for better UX
const ChevronRight = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const ChevronDown = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
    </svg>
);

// Get type badge for values
const getTypeBadge = (value: JsonValue) => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return typeof value;
};

const renderValue = (
    value: JsonValue,
    path: string,
    key: string,
    isSelected: (path: string) => { status: boolean; type: SelectedType | null },
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void
) => {
    const isPrimitive = typeof value !== "object" || value === null || value === undefined;
    const selected = isSelected(path);

    if (!isPrimitive) return null;

    let className =
        "group/value relative cursor-pointer px-2 py-0.5 rounded transition-all duration-150 inline-flex items-center gap-1.5 ";
    let valueColor = "text-gray-300";

    // Color by type
    if (typeof value === "string") valueColor = "text-emerald-400";
    else if (typeof value === "number") valueColor = "text-amber-400";
    else if (typeof value === "boolean") valueColor = "text-purple-400";
    else if (value === null || value === undefined) valueColor = "text-red-400";

    if (selected.status) {
        if (selected.type === SelectedType.SavedInfo) {
            className += "bg-gray-500/30 text-gray-100 font-medium ring-1 ring-gray-500/50";
        } else if (selected.type === SelectedType.SaveData) {
            className += "bg-sky-500/30 text-sky-200 font-medium ring-1 ring-sky-500/50";
        }
    } else {
        className += "hover:bg-sky-500/10 hover:ring-1 hover:ring-sky-500/30";
    }

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(value));
    };

    const stringValue = JSON.stringify(value);
    const isTruncated = stringValue ? stringValue.length > 100 : false;

    return (
        <Tippy
            content={
                <div className="text-xs p-2 rounded-sm bg-slate-900 border border-sky-400">
                    <div className="font-semibold text-sky-300 mb-1">Path:</div>
                    <div className="text-gray-300 font-mono">{path}</div>
                    {isTruncated && (
                        <>
                            <div className="font-semibold text-sky-300 mt-2 mb-1">Full Value:</div>
                            <div className="text-gray-300">{stringValue}</div>
                        </>
                    )}
                </div>
            }
            delay={[250, 0]}
            placement="top"
            arrow={true}
            className="max-w-xs break-words whitespace-normal"
            interactive={true}
            animation="perspective-subtle"
        >
            <span onClick={(e) => handleKeyClick(path, key, e)} className={className}>
                <span className={`${valueColor} truncate max-w-md inline-block`}>
                    {isTruncated ? stringValue.slice(0, 100) + "..." : stringValue}
                </span>
                <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                    {getTypeBadge(value)}
                </span>
                <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover/value:opacity-100 transition-opacity text-gray-400 hover:text-gray-200 flex-shrink-0"
                    title="Copy value"
                >
                    <CopyIcon />
                </button>
            </span>
        </Tippy>
    );
};

const renderJson = ({
    obj,
    currentPath = "$",
    level = 0,
    collapsedPaths,
    setCollapsedPaths,
    isSelected,
    handleKeyClick,
    searchTerm,
    matchingPaths,
}: {
    obj: JsonNode;
    currentPath?: string;
    level?: number;
    collapsedPaths: Record<string, boolean>;
    setCollapsedPaths: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
    searchTerm: string;
    matchingPaths: Set<string>;
}): JSX.Element => {
    const indent = level * 20;

    const toggleCollapse = (path: string) => {
        setCollapsedPaths((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    return (
        <div>
            {Object.entries(obj).map(([key, value]) => {
                const newPath = `${currentPath}.${key}`;

                // Filter based on search
                if (searchTerm && !matchingPaths.has(newPath)) {
                    return null;
                }

                const isObject =
                    typeof value === "object" && value !== null && !Array.isArray(value);
                const isArray = Array.isArray(value);
                const isKeySelected = isSelected(newPath);
                const isCollapsed = collapsedPaths[newPath];

                const itemCount = isArray ? value.length : isObject ? Object.keys(value).length : 0;

                return (
                    <div
                        key={key}
                        style={{ paddingLeft: `${indent}px` }}
                        className="whitespace-nowrap"
                    >
                        <div className="inline-flex items-start py-0.5 hover:bg-gray-800/30 -mx-1 px-1 rounded min-w-0">
                            {(isObject || isArray) && (
                                <button
                                    onClick={() => toggleCollapse(newPath)}
                                    className="text-gray-500 hover:text-gray-300 mr-1.5 mt-0.5 transition-colors flex-shrink-0"
                                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                                >
                                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                </button>
                            )}

                            <div className="inline-flex items-baseline gap-2 min-w-0">
                                <Tippy
                                    content={
                                        <div className="text-xs p-2 rounded-sm bg-slate-900 border border-sky-400">
                                            <div className="font-semibold text-sky-300 mb-1">
                                                Path:
                                            </div>
                                            <div className="text-gray-300 font-mono">{newPath}</div>
                                        </div>
                                    }
                                    delay={[500, 0]}
                                    arrow={true}
                                    disabled={!isObject && !isArray}
                                    placement="top"
                                    className="max-w-xs break-words whitespace-normal"
                                    interactive={true}
                                    animation="perspective-subtle"
                                >
                                    <span
                                        onClick={(e) => handleKeyClick(newPath, key, e)}
                                        className={`font-mono text-sm select-none transition-all duration-150 flex-shrink-0 inline-block ${
                                            isObject || isArray
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                        } ${
                                            isKeySelected.status
                                                ? isKeySelected.type === SelectedType.SaveData
                                                    ? "bg-sky-500/30 text-sky-200 font-semibold px-2 py-0.5 rounded ring-1 ring-sky-500/50"
                                                    : "bg-gray-500/30 text-gray-100 px-2 py-0.5 font-semibold rounded ring-1 ring-gray-500/50"
                                                : isObject || isArray
                                                  ? "text-sky-400 hover:bg-sky-500/10 px-2 py-0.5 rounded hover:ring-1 hover:ring-sky-500/30"
                                                  : "text-sky-400"
                                        }`}
                                    >
                                        {key}
                                    </span>
                                </Tippy>

                                <span className="text-gray-600 font-mono text-sm flex-shrink-0">
                                    :
                                </span>

                                <div className="inline-flex items-baseline gap-2 min-w-0">
                                    {isObject && (
                                        <span className="text-gray-500 font-mono text-sm flex-shrink-0">
                                            {"{"}
                                            {isCollapsed && (
                                                <>
                                                    <span className="text-xs text-gray-600 ml-1">
                                                        {itemCount}{" "}
                                                        {itemCount === 1
                                                            ? "property"
                                                            : "properties"}
                                                    </span>
                                                    <span className="ml-1">{"}"}</span>
                                                </>
                                            )}
                                        </span>
                                    )}
                                    {isArray && (
                                        <span className="text-gray-500 font-mono text-sm flex-shrink-0">
                                            {"["}
                                            {isCollapsed && (
                                                <>
                                                    <span className="text-xs text-gray-600 ml-1">
                                                        {itemCount}{" "}
                                                        {itemCount === 1 ? "item" : "items"}
                                                    </span>
                                                    <span className="ml-1">{"]"}</span>
                                                </>
                                            )}
                                        </span>
                                    )}
                                    {!isObject &&
                                        !isArray &&
                                        renderValue(
                                            value,
                                            newPath,
                                            key,
                                            isSelected,
                                            handleKeyClick
                                        )}
                                </div>
                            </div>
                        </div>

                        {!isCollapsed && (
                            <>
                                {isObject && (
                                    <>
                                        {renderJson({
                                            obj: value,
                                            currentPath: newPath,
                                            level: level + 1,
                                            collapsedPaths,
                                            setCollapsedPaths,
                                            isSelected,
                                            handleKeyClick,
                                            searchTerm,
                                            matchingPaths,
                                        })}
                                        <div
                                            style={{ paddingLeft: `${indent}px` }}
                                            className="text-gray-500 font-mono text-sm py-0.5"
                                        >
                                            {"}"}
                                        </div>
                                    </>
                                )}

                                {isArray && (
                                    <>
                                        {value.map((item: JsonValue, index: number) => {
                                            const arrayPath = `${newPath}[${index}]`;

                                            // Filter array items based on search
                                            if (searchTerm && !matchingPaths.has(arrayPath)) {
                                                return null;
                                            }

                                            if (typeof item === "object" && item !== null) {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="border-l border-gray-700/50"
                                                        style={{ marginLeft: `${indent + 10}px` }}
                                                    >
                                                        {renderJson({
                                                            obj: item as JsonObject,
                                                            currentPath: arrayPath,
                                                            level: level + 1,
                                                            collapsedPaths,
                                                            setCollapsedPaths,
                                                            isSelected,
                                                            handleKeyClick,
                                                            searchTerm,
                                                            matchingPaths,
                                                        })}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div
                                                    key={index}
                                                    style={{ paddingLeft: `${(level + 1) * 20}px` }}
                                                    className="py-0.5 whitespace-nowrap"
                                                >
                                                    <span className="text-gray-600 text-xs mr-2">
                                                        {index}:
                                                    </span>
                                                    {renderValue(
                                                        item,
                                                        arrayPath,
                                                        `${key}_${index}`,
                                                        isSelected,
                                                        handleKeyClick
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div
                                            style={{ paddingLeft: `${indent}px` }}
                                            className="text-gray-500 font-mono text-sm py-0.5"
                                        >
                                            {"]"}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

interface JsonViewerProps {
    data: JsonNode;
    isSelected: (path: string) => { status: boolean; type: SelectedType | null };
    handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, isSelected, handleKeyClick }) => {
    const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");

    // Search logic - find all matching paths
    const matchingPaths = useMemo(() => {
        const matches = new Set<string>();

        if (!searchTerm.trim()) {
            return matches;
        }

        const searchLower = searchTerm.toLowerCase();

        const searchObject = (obj: JsonValue, path: string = "$") => {
            Object.entries(obj || {}).forEach(([key, value]) => {
                const newPath = `${path}.${key}`;

                // Check if key matches
                const keyMatches = key.toLowerCase().includes(searchLower);

                // Check if value matches (for primitives)
                const valueMatches =
                    (typeof value !== "object" || value === null) &&
                    String(value).toLowerCase().includes(searchLower);

                if (keyMatches || valueMatches) {
                    matches.add(newPath);
                    // Add parent paths so they remain visible
                    let parentPath = path;
                    while (parentPath !== "$") {
                        matches.add(parentPath);
                        const lastDot = parentPath.lastIndexOf(".");
                        parentPath = lastDot > 0 ? parentPath.slice(0, lastDot) : "$";
                    }
                }

                // Recurse into objects and arrays
                if (typeof value === "object" && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            const arrayPath = `${newPath}[${index}]`;
                            if (typeof item === "object" && item !== null) {
                                searchObject(item, arrayPath);
                            } else {
                                const itemMatches = String(item)
                                    .toLowerCase()
                                    .includes(searchLower);
                                if (itemMatches) {
                                    matches.add(arrayPath);
                                    matches.add(newPath);
                                }
                            }
                        });
                    } else {
                        searchObject(value, newPath);
                    }
                }
            });
        };

        searchObject(data);
        return matches;
    }, [data, searchTerm]);

    const expandAll = () => setCollapsedPaths({});

    const collapseAll = () => {
        const allPaths: Record<string, boolean> = {};
        const collectPaths = (obj: JsonValue, path: string = "$") => {
            Object.entries(obj || {}).forEach(([key, value]) => {
                const newPath = `${path}.${key}`;
                if (typeof value === "object" && value !== null) {
                    allPaths[newPath] = true;
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (typeof item === "object" && item !== null) {
                                collectPaths(item, `${newPath}[${index}]`);
                            }
                        });
                    } else {
                        collectPaths(value, newPath);
                    }
                }
            });
        };
        collectPaths(data);
        setCollapsedPaths(allPaths);
    };

    return (
        <div className="font-mono text-sm h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700/50 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search keys or values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                    onClick={expandAll}
                    className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors text-gray-300 whitespace-nowrap"
                >
                    Expand All
                </button>
                <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors text-gray-300 whitespace-nowrap"
                >
                    Collapse All
                </button>
            </div>

            {/* JSON Tree - with proper scrolling */}
            <div className="text-gray-400 overflow-auto flex-1">
                <div className="inline-block min-w-full">
                    {"{"}
                    {renderJson({
                        obj: data,
                        collapsedPaths,
                        setCollapsedPaths,
                        isSelected,
                        handleKeyClick,
                        searchTerm,
                        matchingPaths,
                    })}
                    {"}"}
                </div>
            </div>

            {/* No results message */}
            {searchTerm && matchingPaths.size === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No results found for "{searchTerm}"
                </div>
            )}
        </div>
    );
};

export default JsonViewer;
