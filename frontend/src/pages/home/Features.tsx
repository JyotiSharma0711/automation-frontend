import { useEffect, useState, FC } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFormFieldData } from "@utils/request-utils";
import { trackEvent } from "@utils/analytics";
import { features } from "@pages/home/constants";
import Domains from "@pages/home/Domains";
import { DomainResponse } from "@pages/home/types";

const Features: FC = () => {
    const navigate = useNavigate();
    const [activeDomain, setActiveDomain] = useState<DomainResponse>({ domain: [] });

    const getFormFields = async () => {
        const data = await fetchFormFieldData();
        setActiveDomain(data as DomainResponse);
    };

    useEffect(() => {
        getFormFields();
    }, []);

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 min-h-screen relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true">
                <div className="absolute top-20 left-1/4 w-2 h-2 bg-sky-300/30 rounded-full"></div>
                <div className="absolute top-40 right-1/3 w-1 h-1 bg-indigo-300/40 rounded-full"></div>
                <div className="absolute bottom-40 left-1/3 w-3 h-3 bg-purple-200/30 rotate-45"></div>
                <div className="absolute top-60 right-1/4 w-1.5 h-1.5 bg-teal-300/35 rounded-full"></div>
            </div>

            {/* Features Grid */}
            <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-white border border-sky-100 rounded-2xl hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer p-8 relative overflow-hidden"
                            onClick={() => {
                                if (feature?.analytics) {
                                    trackEvent(feature.analytics);
                                }
                                navigate(feature.path);
                            }}
                        >
                            {/* Enhanced hover gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 via-sky-100/20 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Geometric accent elements */}
                            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-sky-200/20 to-indigo-200/20 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-500"></div>
                            <div className="absolute bottom-6 left-6 w-3 h-3 bg-sky-300/25 rounded-full group-hover:scale-150 transition-transform duration-300"></div>

                            <div className="relative flex items-start space-x-5">
                                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-sky-100/80 via-sky-200/60 to-indigo-100/80 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-sky-200/30">
                                    {feature.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-sky-900 transition-colors duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sky-600 font-semibold mb-3 group-hover:text-sky-700 transition-colors duration-300">
                                        {feature.subtitle}
                                    </p>
                                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>

                            {/* Subtle border accent */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400/0 via-sky-400/0 to-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </div>

            <Domains activeDomain={activeDomain} />
        </div>
    );
};

export default Features;
