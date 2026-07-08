
import { useState, useEffect } from "react";
import { type LoaderFunctionArgs, useNavigate, useOutletContext, useFetcher } from "react-router";
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
  Modal,
  Icon,
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
  ClockIcon,
  CreditCardIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { RouteErrorBoundary } from "app/component/RouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
    return null;
  } catch (error) {
    console.error("Error in app._index loader:", error);
    throw error;
  }
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
    title: "Multiple Languages",
    desc: "Define keys once and apply them across all selected languages simultaneously, with optional auto-translate.",
    label: "Multiple Languages",
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

const CONFETTI_COLORS = ["#FFC107", "#FF5722", "#E91E63", "#9C27B0", "#3F51B5", "#00BCD4", "#4CAF50", "#FFEB3B"];

const confettiParticles = Array.from({ length: 60 }).map((_, i) => {
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 2.5;
  const duration = Math.random() * 2 + 1.5;
  const size = Math.random() * 8 + 6;
  const isCircle = Math.random() > 0.5;
  return { color, left, delay, duration, size, isCircle };
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const { subscription } = useOutletContext<{ subscription: any }>();
  console.log("Subscription status in Index:", subscription);

  const checkFetcher = useFetcher<{ showPopup: boolean }>();
  const closeFetcher = useFetcher();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    checkFetcher.load("/api/checkPopup/subscription");
  }, []);

  useEffect(() => {
    if (checkFetcher.data?.showPopup) {
      setModalOpen(true);
    }
  }, [checkFetcher.data]);

  const handleCloseModal = () => {
    setModalOpen(false);
    closeFetcher.load("/api/closePopup/subscription");
  };

  const subscriptionName = subscription?.present ? "Advanced Plan" : "Free Plan";

  const remainingDays = subscription?.remainingDays;
  return (
    <Frame>
      <Page
        title="Text Pilot"
        subtitle="Manage your store's multilingual content - stored natively in Shopify Metaobjects."
      >
        <Layout>
          {/* ── Subscription Plan Status Card ── */}

          <Layout.Section>
            <Card padding="400">
              <InlineStack align="space-between" blockAlign="center">
                {/* Left: Plan Info */}
                <BlockStack gap="100">
                  <InlineStack gap="200" align="start" blockAlign="center">
                    <Text variant="headingMd" as="h2">
                      Current Subscription
                    </Text>
                    <Badge tone={subscription?.present ? "success" : "attention"}>
                      {subscriptionName}
                    </Badge>
                  </InlineStack>
                  {subscription?.present ? (
                    <Text variant="bodyMd" tone="success" fontWeight="bold" as="strong">
                      Subscription is active. Manage multilingual translations for your Hydrogen storefront.
                    </Text>
                  ) : (
                    <Text variant="bodyMd" tone="success" fontWeight="bold" as="strong">
                      Upgrade your plan to enable multilingual translations for your Hydrogen storefront.
                    </Text>
                  )}
                </BlockStack>

                {/* Right: Icon + Time and Button */}
                <InlineStack gap="600" blockAlign="center">
                  {remainingDays !== undefined && (
                    <Box
                      paddingInlineEnd="400"
                      borderInlineEndWidth={!subscription?.present ? "025" : "0"}
                      borderColor="border-secondary"
                    >
                      <InlineStack gap="300" blockAlign="center">
                        <Box
                          padding="200"
                          background={
                            remainingDays <= 5
                              ? "bg-surface-critical"
                              : "bg-surface-secondary"
                          }
                          borderRadius="200"
                        >
                          <Icon
                            source={ClockIcon}
                            tone={remainingDays <= 5 ? "critical" : "base"}
                          />
                        </Box>
                        <BlockStack gap="100">
                          <Text
                            variant="headingLg"
                            as="p"
                            fontWeight="bold"
                            tone={remainingDays <= 5 ? "critical" : undefined}
                          >
                            {remainingDays} {remainingDays === 1 ? "Day" : "Days"}
                          </Text>
                          <Text
                            variant="bodyXs"
                            tone="subdued"
                            fontWeight="medium"
                            as="span"
                          >
                            REMAINING
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </Box>
                  )}
                  {!subscription?.present && (
                    <Button
                      variant="primary"
                      icon={CreditCardIcon}
                      onClick={() => navigate("/app/billing/subscribe")}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </InlineStack>
              </InlineStack>
            </Card>
          </Layout.Section>

          {/* ── Main action cards ── */}
          <Layout.Section>
            <BlockStack gap="200">
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
              <BlockStack gap="200">
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
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="300">
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
                  <BlockStack>
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

      {/* Celebration Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title=""
        primaryAction={{
          content: "Get Started 🎉",
          onAction: handleCloseModal,
        }}
      >
        <Modal.Section>
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(450px) rotate(360deg); opacity: 0; }
            }
            .confetti-wrapper {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              overflow: hidden;
              z-index: 10;
            }
            .confetti-p {
              position: absolute;
              top: -20px;
              border-radius: 50%;
              animation: confetti-fall linear infinite;
            }
            @keyframes scale-up-bounce {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.1); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
            .celebration-icon {
              font-size: 60px;
              text-align: center;
              animation: scale-up-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
              margin-bottom: 16px;
            }
            .celebration-title {
              text-align: center;
              background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 12px;
            }
            .celebration-text {
              text-align: center;
              color: var(--p-color-text-secondary);
              font-size: 16px;
              line-height: 1.5;
            }
          `}</style>
          <div style={{ position: "relative", minHeight: "260px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            {/* Confetti */}
            <div className="confetti-wrapper">
              {confettiParticles.map((c, idx) => (
                <div
                  key={idx}
                  className="confetti-p"
                  style={{
                    left: `${c.left}%`,
                    backgroundColor: c.color,
                    animationDelay: `${c.delay}s`,
                    animationDuration: `${c.duration}s`,
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    borderRadius: c.isCircle ? "50%" : "0%",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="celebration-icon">🎉</div>
            <div className="celebration-title">
              <Text as="h2" variant="headingLg" fontWeight="bold">
                Subscription Activated!
              </Text>
            </div>
            <div className="celebration-text">
              <BlockStack gap="300">
                <Text as="p" variant="bodyLg">
                  Congratulations! Your store is now upgraded to the <strong>Advance Plan</strong>.
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  You now have access to unlimited supported languages, automatic bulk translations, and native synchronization across all keys.
                </Text>
              </BlockStack>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Frame>
  );
}


export function ErrorBoundary() {
  return <RouteErrorBoundary routeName="Home page" />;
}
