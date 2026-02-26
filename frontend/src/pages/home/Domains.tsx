import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { DomainItem } from "@pages/home/types";
import EmptyState from "@components/EmptyState";

const Domains = ({ activeDomain }: { activeDomain: { domain: DomainItem[] } }) => {
    const [openId, setOpenId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="bg-gradient-to-b from-gray-50 to-white border-t border-sky-200">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="mb-10">
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">Active Domains</h2>
                    <p className="text-gray-600 text-lg">
                        Currently supported domain configurations (
                        {activeDomain?.domain?.length || 0} domains)
                    </p>
                </div>

                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min items-start">
                        {activeDomain?.domain?.map((dom, domIndex) => {
                            // Generate a stable, unique id for this card
                            const domId = String(dom.id ?? `${dom.key}__${domIndex}`);
                            const isOpen = openId === domId;

                            const totalUseCases = (dom.version ?? []).reduce(
                                (total, ver) => total + (ver.usecase?.length ?? 0),
                                0
                            );

                            return (
                                <div
                                    key={domId}
                                    className="bg-white rounded-2xl shadow-lg shadow-sky-100/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 border border-sky-100"
                                >
                                    {/* Header */}
                                    <button
                                        type="button"
                                        className="w-full text-left flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-sky-50 to-sky-100/50 hover:from-sky-100 hover:to-sky-100 transition-colors duration-200"
                                        onClick={() => handleToggle(domId)}
                                        aria-expanded={isOpen}
                                        aria-controls={`domain-content-${domId}`}
                                    >
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {dom.key}
                                            </h3>
                                            <span className="text-sm text-sky-700 font-semibold">
                                                {totalUseCases} use cases
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm pointer-events-none">
                                            <FaChevronDown
                                                className={`w-3 h-3 text-sky-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                            />
                                        </div>
                                    </button>

                                    {/* Content */}
                                    <div
                                        id={`domain-content-${domId}`}
                                        className={`transition-all duration-300 ease-in-out ${
                                            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        } overflow-hidden`}
                                        aria-hidden={!isOpen}
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {dom.version?.map((ver) =>
                                                        ver.usecase?.map(
                                                            (usecase, usecaseIndex) => (
                                                                <span
                                                                    key={`${domId}__${ver.key}__${usecaseIndex}`}
                                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                   bg-gradient-to-r from-sky-50 to-sky-100 text-sky-800 border border-sky-300
                   hover:from-sky-200 hover:to-sky-300 transition-colors duration-150"
                                                                >
                                                                    {usecase}
                                                                    <span className="ml-2 text-xs text-sky-800">
                                                                        ({ver.key})
                                                                    </span>
                                                                </span>
                                                            )
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {(!activeDomain?.domain || activeDomain.domain.length === 0) && (
                        <EmptyState
                            title="No Domains Found"
                            message="We are loading the configurations. Please wait a moment."
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Domains;
