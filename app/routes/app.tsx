import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const shopDomain = session.shop;

    const activeSub = await prisma.activeSubscription.findUnique({
      where: { shopDomain }
    });

    let present = !!activeSub;
    let remainingDays: number | undefined = undefined;

    if (activeSub && activeSub.updatedAt) {
      const subscriptionDate = new Date(activeSub.updatedAt);
      const today = new Date();
      const diffTime = today.getTime() - subscriptionDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const calculatedDays = Math.max(-1, 30 - diffDays);

      if (calculatedDays === -1) {
        await prisma.activeSubscription.deleteMany({
          where: { shopDomain }
        });
        present = false;
        remainingDays = 0;
      } else {
        present = true;
        remainingDays = calculatedDays;
      }
    }

    // eslint-disable-next-line no-undef
    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      subscription: {
        present,
        remainingDays
      }
    };
  } catch (error) {
    console.error("Error in app.tsx loader:", error);
    throw error;
  }
};


export default function App() {
  const { apiKey, subscription } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={translations}>
        <s-app-nav>
          <s-link href="/app/lang">Single Language</s-link>
          <s-link href="/app/multi_lang">Multiple Languages</s-link>
          <s-link href="/app/definition">Manage Definitions</s-link>
          <s-link href="/app/guide">Developer Guide</s-link>
          <s-link href="/app/billing/subscribe">Billing</s-link>

        </s-app-nav>
        <Outlet context={{ subscription }} />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
