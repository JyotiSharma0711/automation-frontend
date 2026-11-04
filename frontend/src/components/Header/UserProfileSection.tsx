import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@hooks/useAuth";
import { LogIn } from "lucide-react";
import { useGitHubLogin } from "@hooks/useGitHubLogin";
import { Button } from "@components/Shadcn/Button";
import GitHubIcon from "@assets/svgs/GitHubIcon";
import { useLoginLabel } from "@hooks/useLoginLabel";
import { getUserDisplayName } from "@/types/user";
import { UserProfileMenu } from "@components/Header/UserProfileMenu";
import { trackEvent } from "@utils/analytics";
import { cn } from "@/lib/utils";

export const UserProfileSection = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { startLogin, isLoginRedirecting } = useGitHubLogin();
    const { provider, label: loginLabel } = useLoginLabel();

    const handleLogin = useCallback(() => {
        trackEvent({
            category: "NAV",
            action: user ? "Clicked on profile" : "Clicked on Login",
            label: user ? "PROFILE" : "LOGIN",
        });

        startLogin(`${location.pathname}${location.search}${location.hash}`);
    }, [location.hash, location.pathname, location.search, startLogin, user]);

    const handleLogout = useCallback(() => {
        try {
            logout();
            toast.success("Log out successful!", {
                description: "You've been securely signed out.",
                position: "top-right",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }, [logout]);

    return (
        <div
            className={cn(
                "relative flex items-center",
                inDrawer && !user ? "w-full" : "shrink-0",
                inDrawer && user ? "min-w-0" : null
            )}
        >
            {user ? (
                <span
                    className={cn(
                        "mr-3 flex min-w-0 flex-col leading-tight",
                        inDrawer ? "items-start" : "max-w-56 items-end"
                    )}
                >
                    <span
                        className="max-w-full truncate text-sm font-semibold text-n-500 dark:text-n-0"
                        title={getUserDisplayName(user)}
                    >
                        {getUserDisplayName(user)}
                    </span>
                    {user.organisationName ? (
                        <span
                            className="max-w-full truncate text-xs text-n-300 dark:text-n-60"
                            title={user.organisationName}
                        >
                            {user.organisationName}
                        </span>
                    ) : null}
                </span>
            ) : null}

            {user ? (
                <UserProfileMenu user={user} onLogout={handleLogout} />
            ) : (
                <Button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoginRedirecting}
                    className={cn(
                        "h-9 gap-3 rounded-full border border-n-40 bg-n-900 px-3 py-2 text-body-2 font-medium text-n-0 hover:bg-n-600 dark:text-neutral-900 dark:border-n-0 dark:bg-n-0 dark:hover:border-n-0 dark:hover:bg-n-30",
                        inDrawer && "w-full justify-center"
                    )}
                    title={loginLabel}
                >
                    {provider === "github" ? (
                        <GitHubIcon className="size-6 text-body-1 font-medium" />
                    ) : (
                        <LogIn className="size-5" aria-hidden="true" />
                    )}
                    {loginLabel}
                </Button>
            )}
        </div>
    );
};
