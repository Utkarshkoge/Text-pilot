import { useRef, useState } from 'react';
import { Modal, BlockStack, Text, Button, Banner, InlineGrid, Card, ButtonGroup } from '@shopify/polaris';
import { RefreshIcon, ArrowUpIcon, ArrowDownIcon } from '@shopify/polaris-icons';
import { useDataSync, LanguageNode } from '../../hooks/useDataSync';

interface DataSyncModalsProps {
    currentTranslation: Record<string, string> | null;
    availableNodes: LanguageNode[];
    currentLanguageId: string | null;
    onSyncComplete: (updates: Record<string, string>) => void;
    fetchSyncSource: (nodeId: string) => Promise<Record<string, string>>;
}

export function DataSyncModals({
    currentTranslation,
    availableNodes,
    currentLanguageId,
    onSyncComplete,
    fetchSyncSource
}: DataSyncModalsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isFetching, setIsFetching] = useState(false);

    const {
        syncModalActive,
        syncSourceLanguage,
        syncPreviewModalActive,
        syncPreviewData,
        syncPreviewFilter,
        openSyncModal,
        closeSyncModal,
        closeSyncPreviewModal,
        setSyncPreviewFilter,
        processSyncKeys,
        handleConfirmSync,
        selectSyncSource
    } = useDataSync({ currentTranslation, onSyncComplete });

    const handleSelectSource = async (node: LanguageNode) => {
        selectSyncSource(node);
        setIsFetching(true);
        try {
            const sourceTranslation = await fetchSyncSource(node.id);
            processSyncKeys(sourceTranslation);
        } catch (error) {
            console.error("Failed to fetch sync source", error);
        } finally {
            setIsFetching(false);
        }
    };

    const nodesToSync = availableNodes.filter(
        n => n.id !== currentLanguageId && Number(n.total_translations?.value || 0) > 0
    );

    return (
        <>
            <Button icon={RefreshIcon} onClick={openSyncModal} disabled={!currentTranslation}>
                Sync Translation Keys
            </Button>

            {/* Sync Selection Modal */}
            <Modal
                open={syncModalActive}
                onClose={closeSyncModal}
                title="Sync Translation Keys"
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <Text as="p" tone="subdued">Select a language to synchronize missing translation keys from. Translation values will not be copied.</Text>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <BlockStack gap="100">
                                {nodesToSync.map(node => (
                                    <div
                                        key={node.id}
                                        style={{
                                            padding: 'var(--p-space-300)',
                                            border: '1px solid var(--p-color-border-subdued)',
                                            borderRadius: 'var(--p-border-radius-200)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <BlockStack>
                                            <Text as="span" variant="bodyMd" fontWeight="bold">{node.language.jsonValue}</Text>
                                            <Text as="span" variant="bodySm" tone="subdued">Total Translation Keys: {node.total_translations?.value || '0'}</Text>
                                        </BlockStack>
                                        <Button size="micro" onClick={() => handleSelectSource(node)} loading={isFetching && syncSourceLanguage?.id === node.id}>
                                            Select
                                        </Button>
                                    </div>
                                ))}
                                {nodesToSync.length === 0 && (
                                    <Text as="p" tone="subdued">No other languages available to sync from.</Text>
                                )}
                            </BlockStack>
                        </div>
                    </BlockStack>
                </Modal.Section>
            </Modal>

            {/* Sync Preview Dialog */}
            <Modal
                size="large"
                open={syncPreviewModalActive}
                onClose={closeSyncPreviewModal}
                title={`Sync Preview (${syncSourceLanguage?.language?.jsonValue || 'Source'})`}
                primaryAction={{
                    content: 'Confirm Sync',
                    onAction: handleConfirmSync,
                    disabled: syncPreviewData.filter(d => d.status === 'New').length === 0
                }}
                secondaryActions={[{ content: 'Cancel', onAction: closeSyncPreviewModal }]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <InlineGrid columns="3" gap="400">
                            <Card padding="400">
                                <BlockStack gap="100">
                                    <Text as="h3" variant="headingSm">Total Sync Entries</Text>
                                    <Text as="p" variant="headingLg">{syncPreviewData.length}</Text>
                                </BlockStack>
                            </Card>
                            <Card padding="400">
                                <BlockStack gap="100">
                                    <Text as="h3" variant="headingSm">Valid Entries</Text>
                                    <Text as="p" variant="headingLg" tone="success">
                                        {syncPreviewData.filter(d => d.status === 'New').length}
                                    </Text>
                                </BlockStack>
                            </Card>
                            <Card padding="400">
                                <BlockStack gap="100">
                                    <Text as="h3" variant="headingSm">Duplicate Entries</Text>
                                    <Text as="p" variant="headingLg" tone="critical">
                                        {syncPreviewData.filter(d => d.status === 'Duplicate').length}
                                    </Text>
                                </BlockStack>
                            </Card>
                        </InlineGrid>

                        {syncPreviewData.length > 0 && (
                            <BlockStack gap="200">
                                <Banner tone="info">
                                    <Text as="p"><strong>Duplicate entries will be ignored. Only valid keys will be added.</strong></Text>
                                </Banner>
                                <ButtonGroup segmented>
                                    <Button
                                        pressed={syncPreviewFilter === 'valid'}
                                        onClick={() => setSyncPreviewFilter('valid')}
                                    >Valid Entries ({syncPreviewData.filter(d => d.status === 'New').length})</Button>
                                    <Button
                                        pressed={syncPreviewFilter === 'duplicate'}
                                        onClick={() => setSyncPreviewFilter('duplicate')}
                                    >Duplicate Entries ({syncPreviewData.filter(d => d.status === 'Duplicate').length})</Button>
                                </ButtonGroup>
                                <div style={{ position: 'relative' }}>
                                    {/* Header Row (Keys Only Format) */}
                                    <div style={{ display: 'flex', padding: 'var(--p-space-200)', borderBottom: '1px solid var(--p-color-border-subdued)', fontWeight: 'bold' }}>
                                        <div style={{ width: '10%' }}>Index</div>
                                        <div style={{ width: '90%' }}>Key</div>
                                    </div>

                                    {/* Scrollable Data Rows */}
                                    <div
                                        ref={scrollRef}
                                        style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}
                                    >
                                        <BlockStack gap="0">
                                            {syncPreviewData
                                                .filter(item => syncPreviewFilter === 'valid' ? item.status === 'New' : item.status === 'Duplicate')
                                                .map((item) => (
                                                    <div key={item.index} style={{ display: 'flex', padding: 'var(--p-space-200)', borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                                                        <div style={{ width: '10%' }}>
                                                            <Text as="span" variant="bodySm" tone="subdued">{item.index + 1}</Text>
                                                        </div>
                                                        <div style={{ width: '70%', paddingRight: '10px' }}>
                                                            <Text as="span" variant="bodyMd" fontWeight="bold" breakWord>{item.key}</Text>
                                                        </div>
                                                        <div style={{ width: '20%' }}>
                                                            <Text as="span" variant="bodyMd" tone="subdued" breakWord>
                                                                {/* Sync does not copy translations */}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                ))}
                                        </BlockStack>
                                    </div>

                                    {/* Scroll buttons */}
                                    <div style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <Button
                                            icon={ArrowUpIcon}
                                            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                            accessibilityLabel="Scroll to top"
                                            variant="secondary"
                                            size="slim"
                                        />
                                        <Button
                                            icon={ArrowDownIcon}
                                            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                                            accessibilityLabel="Scroll to bottom"
                                            variant="secondary"
                                            size="slim"
                                        />
                                    </div>
                                </div>
                            </BlockStack>
                        )}
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </>
    );
}
