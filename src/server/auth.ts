import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import {
    getServerSession,
    type DefaultSession,
    type NextAuthOptions,
} from "next-auth";

import Email from "next-auth/providers/email";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: DefaultSession["user"] & {
            id: string;
            roles: Role[];
            // ...other properties
            // role: UserRole;
        };
    }

    interface User {
        roles: Role[];
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                id: user.id,
                roles: user.roles,
            },
        }),
    },
    adapter: PrismaAdapter(db),
    providers: [
        Email({
            normalizeIdentifier(identifier) {
                const verifiedEmail = z.string().email().parse(identifier);

                return verifiedEmail;
            },
            type: "email",
            async sendVerificationRequest({ identifier: email, url }) {
                // Call the cloud Email provider API for sending emails
                // See https://docs.sendgrid.com/api-reference/mail-send/mail-send
                const response = await fetch(
                    "https://api.sendgrid.com/v3/mail/send",
                    {
                        // The body format will vary depending on provider, please see their documentation
                        // for further details.
                        body: JSON.stringify({
                            personalizations: [{ to: [{ email }] }],
                            from: { email: "Noah3141@gmail.com" },
                            subject: "Sign in to Classroom",
                            content: [
                                {
                                    type: "text/plain",
                                    value: `Please click here to authenticate - ${url}`,
                                },
                            ],
                            dynamic_template_content: {
                                link: url,
                            },
                            dynamic_template_id:
                                "d-e50198912cfd437e9c2b832a6b2e62b3",
                        }),
                        headers: {
                            // Authentication will also vary from provider to provider, please see their docs.
                            Authorization: `Bearer ${env.SENDGRID_API}`,
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                    },
                );

                if (!response.ok) {
                    const errors = (await response.json()) as unknown;
                    throw new Error(JSON.stringify(errors));
                }
            },
        }),
        // DiscordProvider({
        //     clientId: env.DISCORD_CLIENT_ID,
        //     clientSecret: env.DISCORD_CLIENT_SECRET,
        // }),
        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
    req: GetServerSidePropsContext["req"];
    res: GetServerSidePropsContext["res"];
}) => {
    return getServerSession(ctx.req, ctx.res, authOptions);
};
