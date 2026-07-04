import { useState, useCallback } from "react";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import { Page, Layout, Card, BlockStack, Text, Box, Button, InlineStack, ProgressBar, Badge } from "@shopify/polaris";
import { ClipboardIcon, CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { RouteErrorBoundary } from "app/component/RouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        await authenticate.admin(request);
        return null;
    } catch (error) {
        console.error("Error in app.guide loader:", error);
        throw error;
    }
};

function CodeBlock({ code, filename }: { code: string, filename: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    return (
        <Box background="bg-surface-secondary" padding="400" borderRadius="200" borderWidth="025" borderColor="border">
            <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodySm" tone="subdued" fontWeight="bold">
                        {filename}
                    </Text>
                    <Button
                        size="micro"
                        icon={copied ? CheckIcon : ClipboardIcon}
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied!' : 'Copy Code'}
                    </Button>
                </InlineStack>
                <div style={{ overflow: 'auto', maxHeight: '350px', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', color: '#fff' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}>
                        <code>{code}</code>
                    </pre>
                </div>
            </BlockStack>
        </Box>
    );
}

export default function Guide() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Introduction: Metaobjects & Locales",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyLg" fontWeight="bold">
                        How the Translation App Works
                    </Text>
                    <Text as="p" variant="bodyMd">
                        Before diving into the code, it's crucial to understand how translations are stored and retrieved.
                        Our app simplifies translation management for your Hydrogen storefront by creating a <Text as="span" fontWeight="bold">Text Pilot App</Text> metaobject in your Shopify store to securely hold all of your translation data.                    </Text>
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200" borderWidth="025" borderColor="border">
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm">💡 Guide Overview & Integration Strategy</Text>
                            <Text as="p" variant="bodyMd">
                                In this guide, we describe how to implement translations in your Hydrogen storefront. This represents the simplest reference architecture to get up and running quickly. You can easily adapt, extend, or customize this logic to align with your specific business rules and scaling needs.
                            </Text>
                            <Text as="p" variant="bodyMd">
                                The architectural workflow is straightforward:
                            </Text>
                            <BlockStack gap="100">
                                <Text as="p" variant="bodyMd">
                                    1. Pass the storefront's current <Text as="span" fontWeight="bold">locale code</Text> (for example, 'en', 'fr', or 'hi') to your GraphQL metaobject query.
                                </Text>

                                <Text as="p" variant="bodyMd">
                                    2. Query the <Text as="span" fontWeight="bold">Text Pilot App</Text> metaobject using the current <Text as="span" fontWeight="bold">locale code</Text> to fetch the corresponding translation entry.
                                </Text>

                                <Text as="p" variant="bodyMd">
                                    3. Retrieve the <Text as="span" fontWeight="bold">translation JSON</Text> stored in that metaobject.
                                </Text>

                                <Text as="p" variant="bodyMd">
                                    4. Use the returned JSON dictionary throughout your Hydrogen storefront to render translated content dynamically.
                                </Text>
                            </BlockStack>
                        </BlockStack>
                    </Box>
                    <Box padding="400" background="bg-surface-info" borderRadius="200">
                        <BlockStack gap="200">
                            <Text as="h3" variant="headingSm">ℹ️ Global State Management with Zustand</Text>
                            <Text as="p" variant="bodyMd">
                                This project currently uses <Text as="span" fontWeight="bold">Zustand</Text> for global state management. Zustand is a simple, lightweight, and fast state manager that allows translation data to be fetched once and shared across components and pages without requiring additional API requests during the application's lifetime. Storing translations globally ensures that language switches are instantaneous and free of extra network overhead.
                            </Text>
                            <Text as="p" variant="bodyMd">
                                If preferred, you can replace Zustand with another state management solution such as <Text as="span" fontWeight="bold">React Context</Text>, <Text as="span" fontWeight="bold">Jotai</Text>, <Text as="span" fontWeight="bold">Valtio</Text>, or <Text as="span" fontWeight="bold">Redux Toolkit</Text>, depending on your project's requirements.
                            </Text>
                            <InlineStack>
                                <Button
                                    url="https://zustand.docs.pmnd.rs/learn/getting-started/introduction"
                                    external
                                    variant="secondary"
                                >
                                    Read Zustand Documentation
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Box>
                </BlockStack>
            ),
            code: null,
            filename: null
        },
        {
            title: "Step 1: Setup the Zustand Store",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        We use Zustand for lightweight global state management. This store will hold your currently selected language and the cached translation dictionary, making it accessible from anywhere in your Hydrogen app.
                    </Text>
                    <Text as="p" variant="bodyMd">
                        Run <Badge>npm install zustand</Badge> in your Hydrogen project first. This store also exposes a <Text as="span" fontWeight="bold">fetchTranslations</Text> method that calls our proxy API whenever the language changes, dynamically loading the requested locale.
                    </Text>
                </BlockStack>
            ),
            filename: "app/components/ZooStandStore.tsx",
            code: `import { create } from 'zustand';

type TranslationStore = {
    language: string;
    translations: any;
    isLoading: boolean;
    error: string | null;
    setLanguage: (lang: string) => Promise<void>;
    fetchTranslations: (lang: string) => Promise<void>;
};

export const useTranslationStore = create<TranslationStore>((set, get) => ({
    language: '',
    translations: {},
    isLoading: false,
    error: null,

    setLanguage: async (lang: string) => {
        set({ language: lang });
        await get().fetchTranslations(lang);
    },

    fetchTranslations: async (lang: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(\`/api/translation?key=\${lang}\`);
            if (!response.ok) throw new Error('Failed to fetch translations');
            const data = await response.json();

            // The API returns { [lang]: translation }
            set({ translations: data[lang] || data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
}));`
        },
        {
            title: "Step 2: Setup the Translation API Route",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        Because Hydrogen runs on Remix, we can create a secure server-side API route. This route acts as a proxy to fetch translations directly from the Shopify Admin API using the Store Domain and Admin API Token.
                    </Text>

                    <Text as="p" variant="bodyMd">
                        Notice how the GraphQL query searches for the metaobject where the <Text as="span" fontWeight="bold">display_name</Text> matches the requested <Text as="span" fontWeight="bold">locale key</Text>. This is why locale matching is strictly required!
                    </Text>
                </BlockStack>
            ),
            filename: "app/routes/api.translation.ts",
            code: `import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || 'en';
  const { env } = context;

  const QUERY = \`
    query FindTranslationByLocale($query: String!) {
      metaobjects(
        type: "_text_pilot_app"
        first: 1
        query: $query
      ) {
        nodes {
          handle
          translation: field(key: "translation") {
            jsonValue
          }
        }
      }
    }
  \`;

  try {
    const response = await fetch(
      \`https://\${env.PUBLIC_STORE_DOMAIN}/admin/api/2024-04/graphql.json\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': env.PRIVATE_ADMIN_API_TOKEN,
        },
        body: JSON.stringify({
          query: QUERY,
          variables: { query: \`display_name:'\${key}'\` },
        }),
      }
    );

    const data = await response.json();
    const node = data?.data?.metaobjects?.nodes?.[0];

    if (!node?.translation?.jsonValue) {
      return Response.json({});
    }

    return Response.json(node.translation.jsonValue);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}`
        },
        {
            title: "Step 3: Add the Translation Utility Hook",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        Create a simple <Text as="span" fontWeight="bold">t()</Text> utility function to extract translations from the Zustand store.
                    </Text>
                    <Text as="p" variant="bodyMd">
                        This function acts gracefully: if a translation key is missing from the store, it will automatically fallback to rendering the original string, ensuring your UI never breaks.
                    </Text>
                </BlockStack>
            ),
            filename: "app/utils/translation.tsx",
            code: `import { useTranslationStore } from "../components/ZooStandStore";

export const t = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const { translations } = useTranslationStore.getState();

  if (!translations || typeof translations !== 'object') {
    return text.trim();
  }

  const key = text.trim();
  const found = typeof translations[key] === 'string' ? translations[key] : key;

  return found;
}`
        },
        {
            title: "Step 4: Create the Language Selector",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        Provide a way for users to switch their preferred language. You can integrate this dropdown component into your Header or Footer.
                    </Text>
                    <Text as="p" variant="bodyMd">
                        When the dropdown changes, it updates the Zustand store, which automatically triggers the API fetch for the new locale's metaobject data.
                    </Text>
                </BlockStack>
            ),
            filename: "app/components/LanguageSelector.tsx",
            code: `import { useEffect } from 'react';
import { useTranslationStore } from './ZooStandStore';

const LANGUAGES = [
    { code: 'hi', name: 'Hindi' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
];

export function LanguageSelector() {
    const language = useTranslationStore((state) => state.language);
    const setLanguage = useTranslationStore((state) => state.setLanguage);

    useEffect(() => {
        setLanguage('hi'); // Set your default language here
    }, [])

    return (
        <select
            value={language || 'en'}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-selector"
            style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: 'transparent',
                cursor: 'pointer'
            }}
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                </option>
            ))}
        </select>
    );
}`
        },
        {
            title: "Step 5: Apply Translations to Components",
            content: (
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        Finally, you can use the translation setup in any of your components!
                    </Text>
                    <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="bold">Important:</Text> You MUST call <Badge>useTranslationStore()</Badge> inside your component, even if you don't use its return values. This hooks the component into Zustand's reactivity cycle, forcing it to re-render instantly when the language changes. Wrap all static text with the <Badge>t()</Badge> function.
                    </Text>
                </BlockStack>
            ),
            filename: "app/routes/example.jsx",
            code: `import { t } from "../utils/translation";
import { useTranslationStore } from "../components/ZooStandStore";

export default function TranslationTestComponent() {
    // Hooks the component into the store so it re-renders on language change
    const { translations } = useTranslationStore();

    return (
        <div>
            <h1>{t("Translation Testing Component")}</h1>
            <p>{t("Welcome to the dynamically translated Hydrogen storefront!")}</p>
        </div>
    );
}`
        }
    ];

    const currentData = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Page title="Developer Guide: Hydrogen Integration"
            backAction={{ content: "Home", onAction: () => navigate("/app") }}
            subtitle="Learn how to fetch and apply your translations inside a custom Hydrogen storefront.">
            <Layout>
                <Layout.Section>
                    <BlockStack gap="200">

                        {/* Progress Bar */}
                        <Box paddingBlockEnd="200">
                            <BlockStack gap="100">
                                <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">Progress</Text>
                                    <Text as="span" variant="bodySm" tone="subdued">Step {currentStep + 1} of {steps.length}</Text>
                                </InlineStack>
                                <ProgressBar progress={((currentStep + 1) / steps.length) * 100} size="small" tone="primary" />
                            </BlockStack>
                        </Box>

                        {/* Slide Content */}
                        <Card>
                            <BlockStack gap="100">
                                <Text as="h2" variant="headingLg">{currentData.title}</Text>

                                {currentData.content}

                                {currentData.code && currentData.filename && (
                                    <CodeBlock code={currentData.code} filename={currentData.filename} />
                                )}

                                {/* Navigation Actions */}
                                <div style={{ paddingTop: '16px', borderTop: '1px solid #ebebeb' }}>
                                    <InlineStack align="space-between">
                                        <InlineStack gap="200">
                                            {currentStep > 1 && (
                                                <Button onClick={() => setCurrentStep(0)}>
                                                    First Step
                                                </Button>
                                            )}
                                            <Button
                                                disabled={currentStep === 0}
                                                onClick={handleBack}
                                            >
                                                Previous
                                            </Button>
                                        </InlineStack>
                                        <Button
                                            variant="primary"
                                            disabled={currentStep === steps.length - 1}
                                            onClick={handleNext}
                                        >
                                            {currentStep === steps.length - 1 ? 'Finish' : 'Next Step'}
                                        </Button>
                                    </InlineStack>
                                </div>
                            </BlockStack>
                        </Card>

                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export function ErrorBoundary() {
    return <RouteErrorBoundary routeName="Developer Guide" />;
}
