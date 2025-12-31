import { createAuthClient } from "better-auth/react";

export const authClient: any = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,

  fetchPlugins: [
    {
      id: "next-cookies-request-plugin",
      name: "next-cookies-request-plugin",

      hooks: {
        async onRequest(ctx: any) {
          if (typeof window === "undefined") {
            const { cookies } = await import("next/headers");

            const cookieStore = cookies();
            ctx.headers.set("cookie", cookieStore.toString());
          }
        },
      },
    },
  ],
});
