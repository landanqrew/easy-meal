export declare const auth: import("better-auth").Auth<{
    baseURL: string;
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    emailAndPassword: {
        enabled: true;
        minPasswordLength: number;
    };
    socialProviders: {
        google: {
            clientId: string;
            clientSecret: string;
            prompt: "select_account";
        };
    };
    session: {
        expiresIn: number;
        updateAge: number;
    };
    user: {
        additionalFields: {
            householdId: {
                type: "string";
                required: false;
                input: false;
            };
            dietaryRestrictions: {
                type: "string";
                required: false;
                defaultValue: string;
                input: false;
            };
            preferences: {
                type: "string";
                required: false;
                defaultValue: string;
                input: false;
            };
        };
    };
}>;
//# sourceMappingURL=auth.d.ts.map