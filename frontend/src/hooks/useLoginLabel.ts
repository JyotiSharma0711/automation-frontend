import { useGetLoginProviderQuery } from "@store/api";

/** The login button's text, following the login service's LOGIN_PROVIDER. */
export const useLoginLabel = () => {
    const { data } = useGetLoginProviderQuery();
    const provider = data?.provider;
    const label =
        provider === "ondc"
            ? "Login via ONDC"
            : provider === "github"
              ? "Login with GitHub"
              : "Login";
    return { provider, label };
};
