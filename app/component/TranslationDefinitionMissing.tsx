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

export function TranslationDefinitionMissing() {
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
            <Page title="Translation Definitions">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <EmptyState
                                heading={isReloading ? "Reloading workspace..." : "Start translating your store"}
                                action={{
                                    content: isReloading ? 'Completing Setup...' : 'Initialize translations',
                                    onAction: () => setShowInitModal(true),
                                    loading: fetcher.state === "submitting" || isReloading,
                                    disabled: isReloading,
                                }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>
                                    {isReloading 
                                        ? "Your translation definitions have been created! Just waiting a moment for Shopify to finalize the changes..." 
                                        : "Create your translation definition to unlock multilingual support and reach more customers worldwide."}
                                </p>
                            </EmptyState>
                        </Card>
                    </Layout.Section>
                </Layout>
                <Modal
                    open={showInitModal}
                    onClose={() => setShowInitModal(false)}
                    title="Initialize Translations"
                    primaryAction={{
                        content: 'Create Definition',
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
                            This action will create a new Metaobject Definition called <strong>Text Pilot App</strong> (<code>_text_pilot_app</code>).
                        </Text>
                        <Text as="p">
                            This definition is required to store your language configurations and translations. Do you want to proceed?
                        </Text>
                    </Modal.Section>
                </Modal>
            </Page>
        </Frame>
    );
}
