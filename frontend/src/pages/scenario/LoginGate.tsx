import { useState, type ReactNode } from "react";
import { LogIn, Lock } from "lucide-react";
import { Alert } from "@components/Shadcn/Alert";
import { Button } from "@components/Shadcn/Button";
import { useLoginLabel } from "@hooks/useLoginLabel";

interface ILoginGateProps {
    isLoggedOut: boolean;
    isLoginRedirecting: boolean;
    onLogin: () => void;
    children: ReactNode;
}

/**
 * Covers the new-session form for logged-out visitors with a login prompt.
 * They can still continue without logging in; those sessions have no userId
 * or organisation.
 */
export const LoginGate = ({
    isLoggedOut,
    isLoginRedirecting,
    onLogin,
    children,
}: ILoginGateProps) => {
    const [continueWithoutLogin, setContinueWithoutLogin] = useState(false);
    const { label } = useLoginLabel();

    if (!isLoggedOut) {
        return children;
    }

    if (continueWithoutLogin) {
        return (
            <div className="space-y-4">
                <Alert
                    variant="info"
                    message="You're not logged in"
                    description={
                        <>
                            Sessions you start now aren't linked to an account or organisation.{" "}
                            <Button
                                variant="link"
                                className="h-auto p-0 align-baseline"
                                onClick={onLogin}
                                disabled={isLoginRedirecting}
                            >
                                {label}
                            </Button>
                        </>
                    }
                />
                {children}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* A blurred preview of the form; not focusable or clickable. */}
            <div
                inert
                aria-hidden="true"
                className="max-h-72 overflow-hidden opacity-50 blur-[3px] select-none"
            >
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-surface-elevated/70 px-4 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand-normal">
                    <Lock className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-body-1 font-semibold text-text-primary">
                        Log in to save and track your tests
                    </p>
                    <p className="mt-1 text-body-2 text-text-secondary">
                        Your sessions and reports are linked to your NP Portal organisation.
                    </p>
                </div>
                <Button onClick={onLogin} isLoading={isLoginRedirecting} className="gap-2">
                    <LogIn className="size-4" aria-hidden="true" />
                    {label}
                </Button>
                <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => setContinueWithoutLogin(true)}
                >
                    Fill manually without login
                </Button>
            </div>
        </div>
    );
};
