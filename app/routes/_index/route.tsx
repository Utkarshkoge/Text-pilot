import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData, useNavigate } from "react-router";
import { useEffect } from "react";
import { useRouteError, isRouteErrorResponse } from "react-router";
import { login } from "../../shopify.server";



export const loader = async ({ request }: LoaderFunctionArgs) => {

  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};



const features = [
  {
    title: "Native Shopify Storage",
    desc: "Translations are stored directly in your own Shopify Metaobjects. No external databases, third-party APIs, or extra subscriptions.",
    icon: (
      <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    title: "Per-Language Editor",
    desc: "Edit translation keys individually or update in bulk. Includes free auto-translation and CSV import/export support.",
    icon: (
      <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c-.345 3.522-1.763 6.78-4.002 9.498L6.412 9m0 0a17.96 17.96 0 004.148-5.185L12 3H3" />
      </svg>
    ),
  },
  {
    title: "Hydrogen & Headless Ready",
    desc: "Query your translations directly in your custom storefront via standard Shopify GraphQL. Fast, lightweight, and runtime-ready.",
    icon: (
      <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    // If rendered inside an iframe without a shop parameter (client-side nav from App Title),
    // redirect to the main app dashboard.
    if (window.self !== window.top) {
      navigate("/app");
    }
  }, [navigate]);

  return (
    <div id="index-wrapper" style={{ opacity: 0 }}>
      <script dangerouslySetInnerHTML={{
        __html: `
        if (window.self === window.top) {
          document.getElementById('index-wrapper').style.opacity = '1';
        }
      `}} />
      <div className="min-h-screen bg-white text-black font-sans px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-14">

          {/* Header */}
          <header className="text-center space-y-5">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight uppercase">
              Text Pilot
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your store's multilingual content natively inside Shopify Metaobjects - clean, fast, and subscription-free.
            </p>
          </header>

          {/* Login */}
          {showForm && (
            <section className="flex justify-center">
              <Form
                method="post"
                action="/auth/login"
                className="w-full max-w-md space-y-4 border border-gray-200 rounded-2xl p-6 shadow-sm"
              >
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                    Shop Domain
                  </span>
                  <input
                    type="text"
                    name="shop"
                    placeholder="my-store.myshopify.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold uppercase tracking-wide hover:bg-gray-900 transition"
                >
                  Log in
                </button>
              </Form>
            </section>
          )}

          {/* Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-10">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition duration-200 ease-in-out flex flex-col items-start">
                <div className="p-2 bg-gray-50 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}


export function ErrorBoundary() {
  const error = useRouteError();
  let message = "An unexpected error occurred.";
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
          Something went wrong
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
            onClick={() => window.location.reload()}
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
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

