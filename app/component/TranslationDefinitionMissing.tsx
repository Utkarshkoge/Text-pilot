import { useState } from "react";
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
    const fetcher = useFetcher();
    const [showInitModal, setShowInitModal] = useState(false);

    return (
        <Frame>
            <Page title="Translation Definitions">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <EmptyState
                                heading="Start translating your store"
                                action={{
                                    content: 'Initialize translations',
                                    onAction: () => setShowInitModal(true),
                                    loading: fetcher.state === "submitting",
                                }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>
                                    Create your translation definition to unlock multilingual support and reach more customers worldwide.
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
                            This action will create a new Metaobject Definition called <strong>Translation Apply</strong> (<code>translation_apply</code>).
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
