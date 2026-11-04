import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ROUTES } from "@constants/routes";
import { getUserInitials } from "@pages/user-profile/utils/getUserInitials";
import { PROFILE_NAV_ITEMS } from "@pages/user-profile/constants";
import type { IProfileSidebarProps } from "@pages/user-profile/types";

export const ProfileSidebar = ({ username, avatarUrl, counts }: IProfileSidebarProps) => (
    <aside className="w-full shrink-0 md:sticky md:top-16 md:w-80 md:self-start">
        <div className="hidden px-10 py-6 text-center md:block">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={`${username ?? "User"}'s avatar`}
                    className="w-20 h-20 rounded-full border-2 border-brand-light-active object-cover mx-auto"
                />
            ) : (
                <div className="w-20 h-20 rounded-full bg-brand-light border-2 border-brand-light-active flex items-center justify-center mx-auto">
                    <span className="text-h5 font-bold text-brand-normal">
                        {getUserInitials(username)}
                    </span>
                </div>
            )}
            <p className="text-body-1 font-semibold text-text-primary mt-4 truncate">
                {username ?? "Guest"}
            </p>
        </div>

        {/* Phones and small tablets: a scrollable row of tabs above the content. */}
        <nav className="flex gap-1 overflow-x-auto px-4 py-3 md:block md:space-y-1 md:py-0">
            {PROFILE_NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === ROUTES.PROFILE}
                    className={({ isActive }) =>
                        cn(
                            "relative flex shrink-0 items-center justify-between gap-2 whitespace-nowrap px-4 py-3 rounded-lg text-body-2 font-medium transition-colors",
                            isActive
                                ? "bg-brand-light text-brand-normal dark:bg-surface-elevated dark:text-brand-normal"
                                : "text-text-primary hover:bg-surface-elevated dark:hover:bg-surface-elevated"
                        )
                    }
                >
                    <span className="pl-1">{item.label}</span>
                    {item.countKey && counts[item.countKey] > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand-normal/20 text-brand-normal text-caption-1 font-semibold">
                            {counts[item.countKey]}
                        </span>
                    ) : null}
                </NavLink>
            ))}
        </nav>
    </aside>
);
