import { useRouteError, isRouteErrorResponse } from "react-router";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
          <s-section heading="Log in">
            <s-text-field
              name="shop"
              label="Shop domain"
              details="example.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.currentTarget.value)}
              autocomplete="on"
              error={errors.shop}
            ></s-text-field>
            <s-button type="submit">Log in</s-button>
          </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}


export function ErrorBoundary() {
  const error = useRouteError();
  let message = "An unexpected error occurred during authentication.";
  if (isRouteErrorResponse(error)) {
    message = error.statusText || `Error ${error.status}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#fff",
      color: "#000",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{ maxWidth: "450px", width: "100%", textAlign: "center" }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "-0.5px",
          color: "#E02424",
          margin: "0 0 16px 0"
        }}>
          Authentication Error
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#4B5563",
          margin: "0 0 24px 0",
          lineHeight: "1.5"
        }}>
        </p>
        <div>
          <button
            onClick={() => (window.location.href = "/app" + window.location.search)}
            style={{
              display: "inline-block",
              backgroundColor: "#000",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background 0.2s"
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

