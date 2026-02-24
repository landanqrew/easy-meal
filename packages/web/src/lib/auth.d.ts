export declare const authClient: {
    signOut: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        success: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    resetPassword: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        newPassword: string;
        token?: string | undefined;
    }> & Record<string, any>, Partial<{
        token?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        newPassword: string;
        token?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    verifyEmail: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<{
        token: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        query: {
            token: string;
            callbackURL?: string | undefined;
        };
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<void | {
        status: boolean;
    }>, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    sendVerificationEmail: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        email: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        email: string;
        callbackURL?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    changeEmail: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        newEmail: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        newEmail: string;
        callbackURL?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    changePassword: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        newPassword: string;
        currentPassword: string;
        revokeOtherSessions?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        newPassword: string;
        currentPassword: string;
        revokeOtherSessions?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        token: string | null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & Record<string, any>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    deleteUser: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        callbackURL?: string | undefined;
        password?: string | undefined;
        token?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        callbackURL?: string | undefined;
        password?: string | undefined;
        token?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        success: boolean;
        message: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    requestPasswordReset: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        email: string;
        redirectTo?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        email: string;
        redirectTo?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
        message: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    resetPassword: {
        ":token": <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<{
            callbackURL: string;
        }> & Record<string, any>, {
            token: string;
        }>>(data_0: import("better-auth").Prettify<{
            query: {
                callbackURL: string;
            };
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<never, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    listSessions: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<import("better-auth").Prettify<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
    }>[], {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeSession: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        token: string;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        token: string;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeSessions: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeOtherSessions: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    linkSocial: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        provider: unknown;
        callbackURL?: string | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            scopes?: string[] | undefined;
        } | undefined;
        requestSignUp?: boolean | undefined;
        scopes?: string[] | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        additionalData?: Record<string, any> | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        provider: unknown;
        callbackURL?: string | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            scopes?: string[] | undefined;
        } | undefined;
        requestSignUp?: boolean | undefined;
        scopes?: string[] | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        additionalData?: Record<string, any> | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        url: string;
        redirect: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    listAccounts: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        scopes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        providerId: string;
        accountId: string;
    }[], {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    deleteUser: {
        callback: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<{
            token: string;
            callbackURL?: string | undefined;
        }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
            query: {
                token: string;
                callbackURL?: string | undefined;
            };
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
            success: boolean;
            message: string;
        }, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    unlinkAccount: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        providerId: string;
        accountId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    refreshToken: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        accessToken: string | undefined;
        refreshToken: string | undefined;
        accessTokenExpiresAt: Date | undefined;
        refreshTokenExpiresAt: Date | undefined;
        scope: string | null | undefined;
        idToken: string | null | undefined;
        providerId: string;
        accountId: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    getAccessToken: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        accessToken: string;
        accessTokenExpiresAt: Date | undefined;
        scopes: string[];
        idToken: string | undefined;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    accountInfo: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<{
        accountId?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: {
            accountId?: string | undefined;
        } | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        user: import("better-auth").OAuth2UserInfo;
        data: Record<string, any>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    signIn: {
        social: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
            provider: (string & {}) | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel";
            callbackURL?: string | undefined;
            newUserCallbackURL?: string | undefined;
            errorCallbackURL?: string | undefined;
            disableRedirect?: boolean | undefined;
            idToken?: {
                token: string;
                nonce?: string | undefined;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
            scopes?: string[] | undefined;
            requestSignUp?: boolean | undefined;
            loginHint?: string | undefined;
            additionalData?: Record<string, any> | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
            provider: (string & {}) | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel";
            callbackURL?: string | undefined;
            newUserCallbackURL?: string | undefined;
            errorCallbackURL?: string | undefined;
            disableRedirect?: boolean | undefined;
            idToken?: {
                token: string;
                nonce?: string | undefined;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
            scopes?: string[] | undefined;
            requestSignUp?: boolean | undefined;
            loginHint?: string | undefined;
            additionalData?: Record<string, any> | undefined;
        } & {
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<{
            redirect: boolean;
            url: string;
        } | {
            redirect: boolean;
            token: string;
            url: undefined;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }>, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    signUp: {
        email: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
            name: string;
            email: string;
            password: string;
            image?: string | undefined;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
            email: string;
            name: string;
            password: string;
            image?: string | undefined;
            callbackURL?: string | undefined;
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<{
            token: null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        } | {
            token: string;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }>, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    signIn: {
        email: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
            email: string;
            password: string;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
            email: string;
            password: string;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        } & {
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
            redirect: boolean;
            token: string;
            url?: string | undefined;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    updateUser: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<Partial<{}> & {
        name?: string | undefined;
        image?: string | undefined | null;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        image?: (string | null) | undefined;
        name?: string | undefined;
        fetchOptions?: FetchOptions | undefined;
    } & Partial<{}>> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    getSession: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<{
        disableCookieCache?: unknown;
        disableRefresh?: unknown;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
        query?: {
            disableCookieCache?: unknown;
            disableRefresh?: unknown;
        } | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        };
    } | null, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    useSession: () => {
        data: {
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            };
        } | null;
        isPending: boolean;
        isRefetching: boolean;
        error: import("@better-fetch/fetch").BetterFetchError | null;
        refetch: (queryParams?: {
            query?: import("better-auth").SessionQueryParams;
        } | undefined) => Promise<void>;
    };
    $Infer: {
        Session: {
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            };
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            };
        };
    };
    $fetch: import("@better-fetch/fetch").BetterFetch<{
        plugins: (import("@better-fetch/fetch").BetterFetchPlugin<Record<string, any>> | {
            id: string;
            name: string;
            hooks: {
                onSuccess(context: import("@better-fetch/fetch").SuccessContext<any>): void;
            };
        } | {
            id: string;
            name: string;
            hooks: {
                onSuccess: ((context: import("@better-fetch/fetch").SuccessContext<any>) => Promise<void> | void) | undefined;
                onError: ((context: import("@better-fetch/fetch").ErrorContext) => Promise<void> | void) | undefined;
                onRequest: (<T extends Record<string, any>>(context: import("@better-fetch/fetch").RequestContext<T>) => Promise<import("@better-fetch/fetch").RequestContext | void> | import("@better-fetch/fetch").RequestContext | void) | undefined;
                onResponse: ((context: import("@better-fetch/fetch").ResponseContext) => Promise<Response | void | import("@better-fetch/fetch").ResponseContext> | Response | import("@better-fetch/fetch").ResponseContext | void) | undefined;
            };
        })[];
        cache?: RequestCache | undefined;
        method: string;
        window?: null | undefined;
        headers?: (HeadersInit & (HeadersInit | {
            accept: "application/json" | "text/plain" | "application/octet-stream";
            "content-type": "application/json" | "text/plain" | "application/x-www-form-urlencoded" | "multipart/form-data" | "application/octet-stream";
            authorization: "Bearer" | "Basic";
        })) | undefined;
        redirect?: RequestRedirect | undefined;
        credentials?: RequestCredentials;
        integrity?: string | undefined;
        keepalive?: boolean | undefined;
        mode?: RequestMode | undefined;
        priority?: RequestPriority | undefined;
        referrer?: string | undefined;
        referrerPolicy?: ReferrerPolicy | undefined;
        signal?: (AbortSignal | null) | undefined;
        onRetry?: ((response: import("@better-fetch/fetch").ResponseContext) => Promise<void> | void) | undefined;
        hookOptions?: {
            cloneResponse?: boolean;
        } | undefined;
        timeout?: number | undefined;
        customFetchImpl: import("@better-fetch/fetch").FetchEsque;
        baseURL: string;
        throw?: boolean | undefined;
        auth?: ({
            type: "Bearer";
            token: string | Promise<string | undefined> | (() => string | Promise<string | undefined> | undefined) | undefined;
        } | {
            type: "Basic";
            username: string | (() => string | undefined) | undefined;
            password: string | (() => string | undefined) | undefined;
        } | {
            type: "Custom";
            prefix: string | (() => string | undefined) | undefined;
            value: string | (() => string | undefined) | undefined;
        }) | undefined;
        body?: any;
        query?: any;
        params?: any;
        duplex?: "full" | "half" | undefined;
        jsonParser: (text: string) => Promise<any> | any;
        retry?: import("@better-fetch/fetch").RetryOptions | undefined;
        retryAttempt?: number | undefined;
        output?: (import("@better-fetch/fetch").StandardSchemaV1 | typeof Blob | typeof File) | undefined;
        errorSchema?: import("@better-fetch/fetch").StandardSchemaV1 | undefined;
        disableValidation?: boolean | undefined;
        disableSignal?: boolean | undefined;
    }, unknown, unknown, {}>;
    $store: {
        notify: (signal?: (Omit<string, "$sessionSignal"> | "$sessionSignal") | undefined) => void;
        listen: (signal: Omit<string, "$sessionSignal"> | "$sessionSignal", listener: (value: boolean, oldValue?: boolean | undefined) => void) => void;
        atoms: Record<string, import("nanostores").WritableAtom<any>>;
    };
    $ERROR_CODES: {
        readonly USER_NOT_FOUND: "User not found";
        readonly FAILED_TO_CREATE_USER: "Failed to create user";
        readonly FAILED_TO_CREATE_SESSION: "Failed to create session";
        readonly FAILED_TO_UPDATE_USER: "Failed to update user";
        readonly FAILED_TO_GET_SESSION: "Failed to get session";
        readonly INVALID_PASSWORD: "Invalid password";
        readonly INVALID_EMAIL: "Invalid email";
        readonly INVALID_EMAIL_OR_PASSWORD: "Invalid email or password";
        readonly SOCIAL_ACCOUNT_ALREADY_LINKED: "Social account already linked";
        readonly PROVIDER_NOT_FOUND: "Provider not found";
        readonly INVALID_TOKEN: "Invalid token";
        readonly ID_TOKEN_NOT_SUPPORTED: "id_token not supported";
        readonly FAILED_TO_GET_USER_INFO: "Failed to get user info";
        readonly USER_EMAIL_NOT_FOUND: "User email not found";
        readonly EMAIL_NOT_VERIFIED: "Email not verified";
        readonly PASSWORD_TOO_SHORT: "Password too short";
        readonly PASSWORD_TOO_LONG: "Password too long";
        readonly USER_ALREADY_EXISTS: "User already exists.";
        readonly USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "User already exists. Use another email.";
        readonly EMAIL_CAN_NOT_BE_UPDATED: "Email can not be updated";
        readonly CREDENTIAL_ACCOUNT_NOT_FOUND: "Credential account not found";
        readonly SESSION_EXPIRED: "Session expired. Re-authenticate to perform this action.";
        readonly FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't unlink your last account";
        readonly ACCOUNT_NOT_FOUND: "Account not found";
        readonly USER_ALREADY_HAS_PASSWORD: "User already has a password. Provide that to delete the account.";
        readonly CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "Cross-site navigation login blocked. This request appears to be a CSRF attack.";
        readonly VERIFICATION_EMAIL_NOT_ENABLED: "Verification email isn't enabled";
        readonly EMAIL_ALREADY_VERIFIED: "Email is already verified";
        readonly EMAIL_MISMATCH: "Email mismatch";
        readonly SESSION_NOT_FRESH: "Session is not fresh";
        readonly LINKED_ACCOUNT_ALREADY_EXISTS: "Linked account already exists";
        readonly INVALID_ORIGIN: "Invalid origin";
        readonly INVALID_CALLBACK_URL: "Invalid callbackURL";
        readonly INVALID_REDIRECT_URL: "Invalid redirectURL";
        readonly INVALID_ERROR_CALLBACK_URL: "Invalid errorCallbackURL";
        readonly INVALID_NEW_USER_CALLBACK_URL: "Invalid newUserCallbackURL";
        readonly MISSING_OR_NULL_ORIGIN: "Missing or null Origin";
        readonly CALLBACK_URL_REQUIRED: "callbackURL is required";
        readonly FAILED_TO_CREATE_VERIFICATION: "Unable to create verification";
        readonly FIELD_NOT_ALLOWED: "Field not allowed to be set";
        readonly ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation is not supported";
        readonly VALIDATION_ERROR: "Validation Error";
        readonly MISSING_FIELD: "Field is required";
    };
};
export declare const signIn: {
    social: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        provider: (string & {}) | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        provider: (string & {}) | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<{
        redirect: boolean;
        url: string;
    } | {
        redirect: boolean;
        token: string;
        url: undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }>, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    email: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        redirect: boolean;
        token: string;
        url?: string | undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
}, signUp: {
    email: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        name: string;
        email: string;
        password: string;
        image?: string | undefined;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth").Prettify<{
        email: string;
        name: string;
        password: string;
        image?: string | undefined;
        callbackURL?: string | undefined;
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<{
        token: null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    } | {
        token: string;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }>, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
}, signOut: <FetchOptions extends import("better-auth").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth").Prettify<{
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
}> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
    success: boolean;
}, {
    code?: string | undefined;
    message?: string | undefined;
}, FetchOptions["throw"] extends true ? true : false>>, useSession: () => {
    data: {
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        };
    } | null;
    isPending: boolean;
    isRefetching: boolean;
    error: import("@better-fetch/fetch").BetterFetchError | null;
    refetch: (queryParams?: {
        query?: import("better-auth").SessionQueryParams;
    } | undefined) => Promise<void>;
};
//# sourceMappingURL=auth.d.ts.map