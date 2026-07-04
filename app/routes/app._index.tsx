
import { type LoaderFunctionArgs, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  InlineGrid,
  Box,
  Frame,
  Divider,
  Badge,
} from "@shopify/polaris";
import {
  LanguageIcon,
  LanguageTranslateIcon,
  DuplicateIcon,
  SettingsIcon,
  DatabaseIcon,
  AutomationIcon,
  CodeIcon,
  StarIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { RouteErrorBoundary } from "app/component/RouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

// ─── Feature highlights shown in the info section ────────────────────────────
const highlights = [
  {
    icon: DatabaseIcon,
    title: "Native Shopify Storage",
    desc: "All translations are stored inside your own Shopify store as Metaobjects - no external database, no third-party API, no extra subscription required.",
  },
  {
    icon: LanguageTranslateIcon,
    title: "Per-Language Editor",
    desc: "Edit every translation key individually for each language. Add flat root keys or nested field groups, delete entries, and undo changes before saving.",
  },
  {
    icon: DuplicateIcon,
    title: "Bulk / CSV Update",
    desc: "Add translation keys across multiple languages at once or import them using a CSV file. Select specific or all languages and track the operation with a real-time progress bar.",
  },
  {
    icon: AutomationIcon,
    title: "Free Auto Translation",
    desc: "Enable Free Auto Translation to automatically generate translations for new keys. Works in both global and per-language translation management.",
  },
  {
    icon: CodeIcon,
    title: "Hydrogen Ready",
    desc: "Query your translations directly in your Hydrogen storefront via a single GraphQL call on the Metaobject. No hardcoded JSON files, no i18n library needed.",
  },
  {
    icon: StarIcon,
    title: "Zero Third-Party Dependency",
    desc: "Your translation data lives in Shopify. Your Hydrogen app fetches it at runtime. No vendor lock-in, no extra API keys, and no additional monthly cost.",
  },
];

// ─── Main actions ─────────────────────────────────────────────────────────────
const actions = [

  {
    icon: LanguageTranslateIcon,
    title: "Single Language",
    desc: "Open the per-language editor to add, edit, or delete individual translation keys and nested fields.",
    label: "Single Language",
    route: "/app/lang",
    badge: null,
  },
  {
    icon: DuplicateIcon,
    title: "Multiple Language",
    desc: "Define keys once and apply them across all selected languages simultaneously, with optional auto-translate.",
    label: "Multiple Language",
    route: "/app/multi_lang",
    badge: null,
  },
  {
    icon: LanguageIcon,
    title: "Manage Definitions",
    desc: "Add or manage the languages your store supports, along with their locale codes (e.g. fr-FR, de-DE, ar).",
    label: "Manage Definitions",
    route: "/app/definition",
    badge: null,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();

  return (
    <Frame>
      <Page
        title="Text Pilot"
        subtitle="Manage your store's multilingual content - stored natively in Shopify Metaobjects."
      >
        <Layout>

          {/* ── Main action cards ── */}
          <Layout.Section>
            <BlockStack gap="300">
              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card key={action.title}>
                      <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="start">
                          <Box
                            background="bg-surface-active"
                            padding="200"
                            borderRadius="200"
                          >
                            <Icon width={22} height={22} />
                          </Box>
                          {action.badge && (
                            <Badge tone="success">{action.badge}</Badge>
                          )}
                        </InlineStack>
                        <BlockStack gap="150">
                          <Text as="h3" variant="headingSm" fontWeight="bold">
                            {action.title}
                          </Text>
                          <Text as="p" tone="subdued">
                            {action.desc}
                          </Text>
                        </BlockStack>
                        <Button onClick={() => navigate(action.route)}>
                          {action.label}
                        </Button>
                      </BlockStack>
                    </Card>
                  );
                })}
              </InlineGrid>
            </BlockStack>
          </Layout.Section>

          {/* ── What this app provides ── */}
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                {/* Header */}
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    What this app provides
                  </Text>
                  <Text as="p" tone="subdued">
                    Everything you need to take your Shopify store multilingual - no extra tools,
                    no external APIs, no hardcoded files.
                  </Text>
                </BlockStack>

                <Divider />

                {/* 2-column feature grid */}
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="500">
                  {highlights.map((h) => {
                    const Icon = h.icon;
                    return (
                      <InlineStack
                        key={h.title}
                        gap="300"
                        blockAlign="start"
                        wrap={false}
                      >
                        <Box
                          background="bg-surface-active"
                          padding="150"
                          borderRadius="200"
                          minWidth="36px"
                        >
                          <Icon width={20} height={20} />
                        </Box>
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            {h.title}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            {h.desc}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    );
                  })}
                </InlineGrid>

                <Divider />

                {/* How it connects to Hydrogen */}
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm" fontWeight="bold">
                      Using this with Hydrogen?
                    </Text>
                    <Text as="p" tone="subdued">
                      See the step-by-step guide and copy-ready GraphQL query to fetch
                      translations at runtime in your Hydrogen storefront.
                    </Text>
                  </BlockStack>
                  <Button
                    icon={SettingsIcon}
                    onClick={() => navigate("/app/guide")}
                  >
                    Developer Guide
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

        </Layout>
      </Page>
    </Frame>
  );
}


export function ErrorBoundary() {
  return <RouteErrorBoundary routeName="Home page" />;
}
