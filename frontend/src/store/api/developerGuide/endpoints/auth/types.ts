import { IUser } from "@/types/user";

export interface IGetMeResponse {
    ok: boolean;
    user: IUser;
}

export interface IExchangeCodeResponse {
    token?: string;
}

export type LoginProvider = "github" | "ondc";

export interface ILoginProviderResponse {
    provider: LoginProvider;
}
