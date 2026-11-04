import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Spinner from "@components/Shadcn/Spinner";
import { useAuth } from "@hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectIsLoginPending } from "@store/slices/authSlice";
import { resetActivityHistoryCount } from "@store/slices/profileShellSlice";
import { useProfileCounts } from "@store/selectors/profileSelectors";
import { ROUTES } from "@constants/routes";
import { ProfileSidebar } from "@pages/user-profile/ProfileSidebar";
import { getUserDisplayName } from "@/types/user";

const UserProfileLayout = () => {
    const { user } = useAuth();
    const counts = useProfileCounts();

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-surface-muted md:flex-row">
            <ProfileSidebar
                username={getUserDisplayName(user)}
                avatarUrl={user.avatarUrl}
                counts={counts}
            />
            <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] bg-surface-elevated px-6">
                <Outlet />
            </main>
        </div>
    );
};

const UserProfile = () => {
    const { isAuthLoading, user, token } = useAuth();
    const isLoginPending = useAppSelector(selectIsLoginPending);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthSettling = isAuthLoading || isLoginPending || Boolean(token && !user);

    useEffect(() => {
        if (isAuthSettling || user) {
            return;
        }

        navigate(ROUTES.HOME);
    }, [isAuthSettling, navigate, user]);

    // Match prior Provider unmount: clear history badge when leaving the profile route.
    useEffect(() => {
        return () => {
            dispatch(resetActivityHistoryCount());
        };
    }, [dispatch]);

    if (isAuthSettling) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-surface-muted">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <UserProfileLayout />;
};

export default UserProfile;
