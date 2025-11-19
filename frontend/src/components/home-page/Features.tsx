import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoCodespaces, GoWorkflow } from "react-icons/go";
import { MdSchema } from "react-icons/md";
import { fetchFormFieldData } from "../../utils/request-utils";
import { FaChevronDown, FaUserPlus } from "react-icons/fa6";
import { GAEvent, trackEvent } from "../../utils/analytics";

interface Feature {
	title: string;
	subtitle: string;
	description: string;
	path: string;
	icon: JSX.Element;
	analytics?: GAEvent;
}

const features: Feature[] = [
	{
		title: "Schema Validation",
		subtitle: "Verify Individual Payloads Instantly",
		description:
			"Ensure your JSONs are ONDC-compliant by validating schemas against model implementations requirements instantly.",
		path: "/schema",
		icon: <MdSchema className="text-sky-600 text-4xl" />,
		analytics: {
			category: "HOME",
			action: "Clicked in schema validation",
			label: "SCHEMA_VALIDATION",
		},
	},
	{
		title: "Scenario Testing",
		subtitle: "Simulate End-to-End Transaction Flows",
		description:
			"Run complete workflows across buyer app and seller app interactions ensuring accurate transaction flow implementation and protocol compliance.",
		path: "/scenario",
		icon: <GoWorkflow className="text-sky-600 text-4xl" />,
		analytics: {
			category: "HOME",
			action: "Clicked in scenario testing",
			label: "SCENARIO_TESTING",
		},
	},
	{
		title: "Protocol Playground",
		subtitle: "Customize and Experiment with Transaction Flows",
		description:
			"Interactively design and test your mock transaction flows using javascript.",
		path: "/playground",
		icon: <GoCodespaces className="text-sky-600 text-4xl" />,
	},
	{
		title: "Seller Onboarding",
		subtitle: "Quick & Easy Seller Registration",
		description:
			"Streamline the seller onboarding process with our comprehensive registration flow. Manage store details, serviceability areas, and product catalogs effortlessly.",
		path: "/seller-onboarding",
		icon: <FaUserPlus className="text-sky-600 text-4xl" />,
	},
];

const Features: React.FC = () => {
	const navigate = useNavigate();
	const [activeDomain, setActiveDomain] = useState<any>({});

	const getFormFields = async () => {
		const data = await fetchFormFieldData();
		setActiveDomain(data);
	};

	useEffect(() => {
		getFormFields();
	}, []);

	return (
		<div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 min-h-screen relative">
			{/* Subtle background pattern */}
			<div className="absolute inset-0 opacity-40">
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

			{/* Active Domains Section */}
			<div className="bg-gradient-to-b from-gray-50 to-white border-t border-sky-200">
				<div className="max-w-7xl mx-auto px-6 py-16">
					<div className="mb-10">
						<h2 className="text-4xl font-bold text-gray-900 mb-3">
							Active Domains
						</h2>
						<p className="text-gray-600 text-lg">
							Currently supported domain configurations (
							{activeDomain?.domain?.length || 0} domains)
						</p>
					</div>

					<DomainGrid activeDomain={activeDomain} />
				</div>
			</div>
		</div>
	);
};

export default Features;

type DomainItem = {
	id?: string; // ideally unique from your data source
	key: string; // display label, may repeat!
	version: { key: string; usecase: string[] }[];
};

export const DomainGrid = ({
	activeDomain,
}: {
	activeDomain: { domain: DomainItem[] };
}) => {
	const [openId, setOpenId] = useState<string | null>(null);

	const handleToggle = (id: string) => {
		setOpenId((prev) => (prev === id ? null : id));
	};

	return (
		<div>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min items-start">
				{activeDomain?.domain?.map((dom, domIndex) => {
					// Generate a stable, unique id for this card
					const domId = dom.id ?? `${dom.key}__${domIndex}`;
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
							<div
								className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-sky-50 to-sky-100/50 hover:from-sky-100 hover:to-sky-100 transition-colors duration-200"
								onClick={() => handleToggle(domId)}
								aria-expanded={isOpen}
								role="button"
							>
								<div>
									<h3 className="text-xl font-bold text-gray-900">{dom.key}</h3>
									<span className="text-sm text-sky-700 font-semibold">
										{totalUseCases} use cases
									</span>
								</div>
								<div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
									<FaChevronDown
										className={`w-3 h-3 text-sky-600 transition-transform duration-300 ${
											isOpen ? "rotate-180" : ""
										}`}
									/>
								</div>
							</div>

							{/* Content */}
							<div
								className={`transition-all duration-300 ease-in-out ${
									isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
								} overflow-hidden`}
								aria-hidden={!isOpen}
							>
								<div className="p-6">
									<div className="flex flex-col gap-3">
										<div className="flex flex-wrap gap-2">
											{dom.version?.map((ver) =>
												ver.usecase?.map((usecase, usecaseIndex) => (
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
												))
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
				<div className="col-span-full mt-8">
					<div className="bg-white border-2 border-dashed border-sky-200 rounded-2xl p-12 text-center">
						<div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
							<svg
								className="w-8 h-8 text-sky-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-gray-800 mb-2">
							No Domains Found
						</h3>
						<p className="text-gray-600">
							We are loading the configurations. Please wait a moment.
						</p>
					</div>
				</div>
			)}
		</div>
	);
};
