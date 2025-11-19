import { BsGithub, BsLinkedin } from "react-icons/bs";
import { Link } from "react-router-dom";
import { trackEvent } from "../utils/analytics";

const Footer = () => {
	const footerLinks = {
		company: [
			{
				name: "About ONDC",
				href: "https://ondc.org/",
				analytics: { category: "FOOTER", action: "Clicked on 'About ONDC'" },
			},
			// { name: "Contact Us", href: "#" },
		],
		developers: [
			{
				name: "API Documentation",
				href: "https://github.com/ONDC-Official/automation-framework",
				analytics: {
					category: "FOOTER",
					action: "Clicked on 'API Documentation'",
				},
			},
			{
				name: "SDKs & Tools",
				href: "https://github.com/ONDC-Official/automation-validation-compiler",
				analytics: { category: "FOOTER", action: "Clicked on 'SDKs & Tools'" },
			},
			// { name: "Sandbox Environment", href: "#" },
		],
		support: [
			// { name: "Help Center", href: "#" },
			// { name: "Community Forum", href: "#" },
			{
				name: "Bug Reports",
				href: "https://github.com/ONDC-Official/automation-framework/issues",
				analytics: { category: "FOOTER", action: "Clicked on 'Bug Reports'" },
			},
		],
		quickLinks: [
			{
				name: "Join ONDC",
				href: "https://ondc.org/ondc-how-to-join/",
				analytics: { category: "FOOTER", action: "Clicked on 'Join ONDC'" },
			},
		],
	};

	const socialLinks = [
		{
			name: "LinkedIn",
			href: "https://in.linkedin.com/company/open-network-for-digital-commerce",
			icon: <BsLinkedin />,
			analytics: { category: "FOOTER", action: "Clicked on 'LinkedIn'" },
		},
		{
			name: "GitHub",
			href: "https://github.com/ONDC-Official",
			icon: <BsGithub />,
			analytics: { category: "FOOTER", action: "GitHub'" },
		},
	];

	return (
		<footer className="bg-gray-800 text-white mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Main footer content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
					{/* Company info */}
					<div className="lg:col-span-1">
						<img
							src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
							alt="Logo"
							className="h-12 w-auto"
						/>
						<p className="text-gray-400 text-sm leading-relaxed">
							India's first open commerce network enabling seamless digital
							transactions across domains.
						</p>
						<div className="flex space-x-4 mt-6">
							{socialLinks.map((social) => (
								<a
									key={social.name}
									href={social.href}
									className="text-gray-400 hover:text-sky-400 transition-colors"
									aria-label={social.name}
								>
									<span className="text-2xl">{social.icon}</span>
								</a>
							))}
						</div>
					</div>

					{/* Company links */}
					<div>
						<h3 className="text-white font-semibold mb-4">Company</h3>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.name} onClick={() => trackEvent(link.analytics)}>
									<a
										href={link.href}
										className="text-gray-400 hover:text-white transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Developer links */}
					<div>
						<h3 className="text-white font-semibold mb-4">Developers</h3>
						<ul className="space-y-3">
							{footerLinks.developers.map((link) => (
								<li key={link.name} onClick={() => trackEvent(link.analytics)}>
									<a
										href={link.href}
										className="text-gray-400 hover:text-white transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Support links */}
					<div>
						<h3 className="text-white font-semibold mb-4">Support</h3>
						<ul className="space-y-3">
							{footerLinks.support.map((link) => (
								<li key={link.name} onClick={() => trackEvent(link.analytics)}>
									{link.href.startsWith("/") ? (
										<Link
											to={link.href}
											className="text-gray-400 hover:text-white transition-colors text-sm"
										>
											{link.name}
										</Link>
									) : (
										<a
											href={link.href}
											className="text-gray-400 hover:text-white transition-colors text-sm"
										>
											{link.name}
										</a>
									)}
								</li>
							))}
						</ul>
					</div>

					{/* Quick links */}
					<div>
						<h3 className="text-white font-semibold mb-4">Quick Links</h3>
						<ul className="space-y-3">
							{footerLinks.quickLinks.map((link) => (
								<li key={link.name} onClick={() => trackEvent(link.analytics)}>
									<a
										href={link.href}
										className="text-gray-400 hover:text-white transition-colors text-sm"
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="my-8 bg-gray-700" />

				{/* Bottom footer */}
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="text-gray-400 text-sm">
						© 2024 Open Network for Digital Commerce (ONDC)
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
