import { ToastContainer } from "react-toastify";
import "./App.css";
import TopBar, { UserDetails } from "./components/top-bar";
import Modal from "./components/modal";
import { useEffect, useState } from "react";
import Support from "./components/support";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home";
import NotFoundPage from "./components/ui/not-found";
import SchemaValidation from "./pages/schema-validation";
import FlowContent from "./components/flow-testing/flow-page";
import SellerOnboarding from "./pages/seller-onboarding";
import ToolsPage from "./pages/tools";
import GitHubLogin from "./pages/login";
import { UserContext } from "./context/userContext";
import UserProfile from "./pages/user-profile";
import axios from "axios";
import { getGithubAvatarUrl } from "./utils/regsitry-utils";
import { SubscriberData } from "./components/registry-components/registry-types";
import * as api from "./utils/registry-apis";
import Footer from "./components/main-footer";
import { SessionProvider } from "./context/context";
// import { GuideStepsEnums, useGuide } from "./context/guideContext";
import Walkthrough from "./pages/walkthrough";
import { trackPageView } from "./utils/analytics";
import ProtocolPlayGround from "./components/protocol-playground/main";
import PastSessions from "./pages/past-sessions";
import DBBackOffice from "./components/db-back-office/db-back-office";
import FlowTestingWrapper from "./components/flow-testing/flow-testing-wrapper";
// import DevGuidePage from "./components/developer guide/dev-page";

function App() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [user, setUser] = useState<UserDetails | undefined>(undefined);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [subscriberData, setSubscriberData] = useState<SubscriberData>({
		keys: [],
		mappings: [],
	});
	// const [isLoading, setIsLoading] = useState(true);
	// const { setGuideStep } = useGuide();

	useEffect(() => {
		try {
			const key = localStorage.getItem("sessionIdForSupport") as string;
			JSON.parse(key);
		} catch (e) {
			localStorage.removeItem("sessionIdForSupport");
		}
	}, []);

	// Example in React (frontend)
	// init point for guide
	// useEffect(() => {
	// 	init();
	// }, []);

	useEffect(() => {
		trackPageView(location.pathname + location.search);
	}, [location]);

	useEffect(() => {
		fetchUserLookUp();
	}, [location.pathname, user]);

	// const init = async () => {
	// 	const tempUser = await refreshUser();

	// 	if (!tempUser) return;

	// 	const tempSubscriberData: any = await fetchUserLookUp(tempUser);

	// 	if (
	// 		!tempSubscriberData?.keys?.length ||
	// 		!tempSubscriberData?.mappings?.length
	// 	) {
	// 		setGuideStep(GuideStepsEnums.Reg1);
	// 	} else {
	// 		setGuideStep(GuideStepsEnums.Test1);
	// 	}
	// };

	function fetchUserLookUp(tempUser?: any) {
		const userToLookup = tempUser ?? user;

		return api
			.getSubscriberDetails(userToLookup)
			.then((data) => {
				if (data) {
					setSubscriberData(data);
					return data;
				} else {
					return null;
					// toast.error("Failed to load subscriber details");
				}
				// setIsLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching subscriber details:", error);
				// toast.error("Failed to load subscriber details");
				// setIsLoading(false);
				return null;
			});
	}

	async function refreshUser() {
		try {
			const url = `${import.meta.env.VITE_BACKEND_URL}/auth/api/me`;
			const res = await axios.get(url, { withCredentials: true });
			if (res.data.ok) {
				console.log("Logged in user:", res.data);
				const avatarUrl = await getGithubAvatarUrl(res.data.user.githubId);
				setUser({
					...res.data.user,
					avatarUrl: avatarUrl,
				});
				setIsLoggedIn(true);
				return {
					...res.data.user,
					avatarUrl: avatarUrl,
				};
			} else {
				console.log("Not logged in");
				setUser(undefined);
				setIsLoggedIn(false);
				return null;
			}
		} catch (error) {
			console.error("Error fetching user:", error);
			setUser(undefined);
			return null;
		}
	}

	return (
		<UserContext.Provider
			value={{
				isLoggedIn: isLoggedIn,
				userDetails: user,
				refreshUser: refreshUser,
				subscriberData: subscriberData,
				setSubscriberData: setSubscriberData,
			}}
		>
			<SessionProvider>
				<div className="flex flex-col min-h-screen">
					<TopBar onSupportClick={() => setIsModalOpen(true)} />
					<div className="pt-[72px] flex-1">
						<Routes>
							<Route path="/home" element={<HomePage />} />
							<Route path="/schema" element={<SchemaValidation />} />
							{/* <Route path="/unit" element={<ApiTesting />} /> */}
							<Route path="/scenario" element={<FlowContent />} />
							<Route path="/flow-testing" element={<FlowTestingWrapper />} />
							<Route path="/login" element={<GitHubLogin />} />
							<Route path="/profile" element={<UserProfile />} />
							<Route path="/tools" element={<ToolsPage />} />
							<Route path="/seller-onboarding" element={<SellerOnboarding />} />
							<Route path="/playground" element={<ProtocolPlayGround />} />
							<Route path="/walkthrough" element={<Walkthrough />} />
							<Route
								path="/history"
								element={<PastSessions loggedIn={false} />}
							/>
							<Route path="*" element={<NotFoundPage />} />
							<Route path="/db-back-office" element={<DBBackOffice />} />
							{/* <Route path="/docs" element={<DevGuidePage />} /> */}
						</Routes>
					</div>
					<Footer />
				</div>
				<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
					<Support />
				</Modal>
				<ToastContainer
					position="bottom-right"
					autoClose={3000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss={false}
					draggable
					pauseOnHover={false}
					theme="colored"
				/>
			</SessionProvider>
		</UserContext.Provider>
	);
}

export default App;
