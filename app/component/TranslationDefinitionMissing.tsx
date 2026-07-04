import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
    Page,
    Layout,
    Card,
    EmptyState,
    Frame,
    Modal,
    Text,
} from "@shopify/polaris";

export function TranslationDefinitionMissing({ pagename }: { pagename: string }) {
    const fetcher = useFetcher<any>();
    const [showInitModal, setShowInitModal] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.success) {
            setIsReloading(true);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }, [fetcher.state, fetcher.data]);

    return (
        <Frame>
            <Page title={pagename}>
                <Layout>
                    <Layout.Section>
                        <Card>
                            <EmptyState
                                heading={isReloading ? "Reloading workspace..." : "Start managing translations"}
                                action={{
                                    content: isReloading ? 'Completing Setup...' : 'Create Translation Metaobject',
                                    onAction: () => setShowInitModal(true),
                                    loading: fetcher.state === "submitting" || isReloading,
                                    disabled: isReloading,
                                }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>
                                    {isReloading
                                        ? "Your metaobject have been created! Just waiting a moment for Shopify to finalize the changes..."
                                        : "Create the metaobject to securely store and manage translation data for your Hydrogen storefront."}
                                </p>
                            </EmptyState>
                        </Card>
                    </Layout.Section>
                </Layout>
                <Modal
                    open={showInitModal}
                    onClose={() => setShowInitModal(false)}
                    title="Create Translation Metaobject"
                    primaryAction={{
                        content: 'Create',
                        onAction: () => {
                            // Submit to the definition route which handles this intent
                            fetcher.submit(
                                { intent: 'create_definition' },
                                { method: "post", action: "/app/definition" }
                            );
                            setShowInitModal(false);
                        },
                        loading: fetcher.state === "submitting",
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: () => setShowInitModal(false),
                        }
                    ]}
                >
                    <Modal.Section>
                        <Text as="p">
                            Create a new metaobject called <strong>"Text Pilot App"</strong>  to securely store and manage all translation data in your shopify store.
                        </Text>
                    </Modal.Section>
                </Modal>
            </Page>
        </Frame>
    );
}
