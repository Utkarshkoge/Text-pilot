import { LoaderFunctionArgs, ActionFunctionArgs, useLoaderData, useFetcher, useOutletContext } from "react-router";
import { useEffect } from "react";
import {
    Page,
    Layout,
    Card,
    Text,
    Button,
    BlockStack,
    Box,
    Badge,
    Grid,
    InlineStack,
    List,
    Divider
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const PLANS = {
    ADVANCED: {
        name: "Advance Plan",
        price: 5,
    },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { session } = await authenticate.admin(request);
        const shopDomain = session.shop;

        const active = await prisma.activeSubscription.findUnique({
            where: { shopDomain },
            select: {
                subscriptionId: true,
            },
        });

        // Default to FREE if no active subscription
        const currentPlan = active ? "ADVANCED" : "FREE";
        return {
            currentPlan,
            shopDomain,
        };
    } catch (error) {
        console.error("Error in app.billing.subscribe loader:", error);
        throw error;
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const isTest = process.env.SUBSCRIPTION === "true";
    try {
        const { admin, session } = await authenticate.admin(request);
        const shop = session.shop;
        const url = new URL(request.url);

        const formData = await request.formData();
        let host = url.searchParams.get("host") || "";
        if (!host) {
            const hostUrl = `${shop}/admin`;
            host = Buffer.from(hostUrl).toString("base64");
        }

        const planKey = formData.get("plan") as PlanKey;
        const plan = PLANS[planKey];
        if (!plan) {
            throw new Response("Invalid plan", { status: 400 });
        }

        const returnUrl =
            `${process.env.SHOPIFY_APP_URL}/app` +
            `?shop=${shop}&host=${encodeURIComponent(host)}`;

        const graphqlResponse = await admin.graphql(
            `#graphql
          mutation CreateSubscription(
            $name: String!
            $returnUrl: URL!
            $test: Boolean!
            $amount: Decimal!
            $currency: CurrencyCode!
          ) {
            appSubscriptionCreate(
              name: $name
              returnUrl: $returnUrl
              test: $test
              lineItems: [{
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: $amount, currencyCode: $currency }
                    interval: EVERY_30_DAYS
                  }
                }
              }]
            ) {
              confirmationUrl
              userErrors {
                field
                message
              }
            }
          }
        `,
            {
                variables: {
                    name: plan.name,
                    returnUrl,
                    test: isTest,
                    amount: plan.price,
                    currency: "USD",
                },
            }
        );

        const data = await graphqlResponse.json();
        const result = data.data?.appSubscriptionCreate;

        if (!result) {
            throw new Response("Billing error", { status: 500 });
        }

        if (result.userErrors?.length) {
            throw new Response(
                result.userErrors.map((e: any) => e.message).join(", "),
                { status: 400 }
            );
        }

        return { confirmationUrl: result.confirmationUrl };
    } catch (error) {
        console.error("Error in app.billing.subscribe action:", error);
        throw error;
    }
}

export default function BillingPage() {
    const { currentPlan } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const { subscription } = useOutletContext<{ subscription: any }>();
    console.log("Subscription status in BillingPage:", subscription);



    const handleSubscribe = (plan: PlanKey) => {
        fetcher.submit(
            { plan },
            {
                method: "post",
                action: "/app/billing/subscribe",
            }
        );
    };

    useEffect(() => {
        if (fetcher.data && "confirmationUrl" in fetcher.data) {
            const url = (fetcher.data as { confirmationUrl: string }).confirmationUrl;
            if (window.top) {
                window.top.location.href = url;
            }
        }
    }, [fetcher.data]);

    return (
        <Page title="Plans & Billing" subtitle="Choose the right plan for your international expansion.">
            <Layout>
                <Layout.Section>
                    <Grid>
                        {/* Free Plan */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <InlineStack align="space-between">
                                            <Text as="h2" variant="headingLg">Free Plan</Text>
                                            {currentPlan === "FREE" && <Badge tone="success">Active</Badge>}
                                        </InlineStack>
                                        <Text as="p" variant="bodyLg" fontWeight="bold">
                                            $0 <Text as="span" variant="bodySm" tone="subdued">/ month</Text>
                                        </Text>
                                    </BlockStack>

                                    <Divider />

                                    <BlockStack gap="200">
                                        <Text as="p" variant="bodyMd" fontWeight="medium">Features included:</Text>
                                        <List type="bullet">
                                            <List.Item>1 Supported Language definition</List.Item>
                                            <List.Item>Standard Translation translation capabilities</List.Item>
                                            <List.Item>Native Shopify Metaobject Storage</List.Item>
                                        </List>
                                    </BlockStack>

                                    <Box paddingBlockStart="400">
                                        <Button
                                            fullWidth
                                            variant="secondary"
                                            disabled
                                        >
                                            {currentPlan === "FREE" ? "Current Plan" : "Free Plan"}
                                        </Button>
                                    </Box>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Advanced Plan */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Box background="bg-surface-secondary" borderRadius="300" padding="050">
                                <Card>
                                    <BlockStack gap="400">
                                        <BlockStack gap="200">
                                            <InlineStack align="space-between">
                                                <Text as="h2" variant="headingLg">Advance Plan</Text>
                                                {currentPlan === "ADVANCED" ? (
                                                    <Badge tone="success">Active</Badge>
                                                ) : (
                                                    <Badge tone="attention">Recommended</Badge>
                                                )}
                                            </InlineStack>
                                            <Text as="p" variant="bodyLg" fontWeight="bold">
                                                $5 <Text as="span" variant="bodySm" tone="subdued">/ month</Text>
                                            </Text>
                                        </BlockStack>

                                        <Divider />

                                        <BlockStack gap="200">
                                            <Text as="p" variant="bodyMd" fontWeight="medium">Features included:</Text>
                                            <div style={{ color: 'var(--p-color-text-success)' }}>
                                                <List type="bullet">
                                                    <List.Item>Unlimited supported languages (add more than one)</List.Item>
                                                    <List.Item>Sync translation keys across languages</List.Item>
                                                    <List.Item>Automatic bulk language translation</List.Item>
                                                    <List.Item>Priority storefront loading and native storage</List.Item>
                                                </List>
                                            </div>
                                        </BlockStack>

                                        <Box paddingBlockStart="400">
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                // disabled={currentPlan === "ADVANCED"}
                                                onClick={() => handleSubscribe("ADVANCED")}
                                                loading={
                                                    fetcher.state === "submitting" &&
                                                    fetcher.formData?.get("plan") === "ADVANCED"
                                                }
                                            >
                                                {currentPlan === "ADVANCED" ? "Current Plan" : "Upgrade to Advance Plan"}
                                            </Button>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </Box>
                        </Grid.Cell>
                    </Grid>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
