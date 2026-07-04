import { useRef } from 'react';
import { Modal, BlockStack, Card, Text, InlineStack, Button, Banner, InlineGrid, ButtonGroup, Tooltip, Icon } from '@shopify/polaris';
import { ImportIcon, ArrowUpIcon, ArrowDownIcon, InfoIcon } from '@shopify/polaris-icons';
import { useCsvImport, ImportMode } from '../../hooks/useCsvImportMulti';

interface CsvImportModalsProps {
    currentTranslation: Record<string, string> | null;
    onImportConfirm: (updates: Record<string, string>) => void;
    buttonText?: string;
    maxEntries?: number;
    disabled?: boolean;
}

export function CsvImportModals({ currentTranslation, onImportConfirm, buttonText = 'Import', maxEntries, disabled }: CsvImportModalsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const {
        importModalActive,
        importMode,
        previewModalActive,
        csvPreviewData,
        csvValidationErrors,
        csvPreviewFilter,
        fileInputRef,
        openImportModal,
        closeImportModal,
        closePreviewModal,
        setCsvPreviewFilter,
        handleFileSelect,
        handleConfirmImport,
        triggerFileInput
    } = useCsvImport({ currentTranslation, onImportConfirm, maxEntries });

    const hasDuplicates = csvPreviewData.some(d => d.status === 'Duplicate');

    const handleDownloadTemplate = (mode: ImportMode) => {
        let csv = mode === 'keys_only'
            ? "Key\nWelcome\nAdd to Cart\nCheckout\nSearch"
            : "Key,Translation\nWelcome,Bienvenido\nAdd to Cart,Agregar al carrito\nCheckout,Pagar\nSearch,Buscar";
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `template_${mode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Button icon={ImportIcon} onClick={openImportModal} disabled={disabled || !currentTranslation}>
                {buttonText}
            </Button>

            {/* Import Selection Modal */}
            <Modal
                open={importModalActive}
                onClose={closeImportModal}
                title="Upload Translation CSV"
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <Card padding="400">
                            <BlockStack gap="200">
                                <InlineStack gap="100" blockAlign="center">
                                    <Text as="h3" variant="headingSm">Add Keys Only</Text>
                                    <Tooltip content="The maximum limit is 200, but it will divide as per the total of selected languages.">
                                        <Icon source={InfoIcon} tone="subdued" />
                                    </Tooltip>
                                </InlineStack>
                                <Text as="p" tone="subdued">Import only translation keys without translated values.{maxEntries !== undefined ? ` (Maximum ${maxEntries} entries)` : ''}</Text>

                                <InlineStack gap="300" blockAlign="center">
                                    <Button onClick={() => triggerFileInput('keys_only')}>Select CSV File</Button>
                                    <Button variant="plain" onClick={() => handleDownloadTemplate('keys_only')}>Download Template</Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>

                    </BlockStack>
                </Modal.Section>
            </Modal>

            {/* Hidden File Input */}
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Preview Dialog */}
            <Modal
                size="large"
                open={previewModalActive}
                onClose={closePreviewModal}
                title="Import Preview"
                primaryAction={{
                    content: 'Confirm Import',
                    onAction: handleConfirmImport,
                    disabled: csvValidationErrors.length > 0 || csvPreviewData.filter(d => d.status === 'New').length === 0
                }}
                secondaryActions={[{ content: 'Cancel', onAction: closePreviewModal }]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        {csvValidationErrors.length > 0 ? (
                            <Banner title="CSV Validation Errors" tone="critical">
                                <BlockStack gap="200">
                                    <ul>
                                        {csvValidationErrors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </BlockStack>
                            </Banner>
                        ) : (
                            <>
                                <InlineGrid columns="3" gap="400">
                                    <Card padding="300">
                                        <BlockStack gap="100">
                                            <Text as="h3" variant="headingSm">Total CSV Entries</Text>
                                            <Text as="p" variant="headingLg">{csvPreviewData.length}</Text>
                                        </BlockStack>
                                    </Card>
                                    <Card padding="300">
                                        <BlockStack gap="100">
                                            <Text as="h3" variant="headingSm">Valid Entries</Text>
                                            <Text as="p" variant="headingLg" tone="success">
                                                {csvPreviewData.filter(d => d.status === 'New').length}
                                            </Text>
                                        </BlockStack>
                                    </Card>
                                    <Card padding="300">
                                        <BlockStack gap="100">
                                            <Text as="h3" variant="headingSm">Duplicate Entries</Text>
                                            <Text as="p" variant="headingLg" tone="critical">
                                                {csvPreviewData.filter(d => d.status === 'Duplicate').length}
                                            </Text>
                                        </BlockStack>
                                    </Card>
                                </InlineGrid>

                                {csvPreviewData.length > 0 && (
                                    <BlockStack gap="200">
                                        {hasDuplicates ? (
                                            <Banner tone="warning">
                                                <Text as="p">
                                                    <strong>Duplicate entries (repeated in the CSV) will be skipped. Only valid entries will be imported.</strong>
                                                </Text>
                                            </Banner>
                                        ) : (
                                            <Banner tone="info">
                                                <Text as="p">
                                                    <strong>Only valid CSV entries will be added.</strong>
                                                </Text>
                                            </Banner>
                                        )}
                                        <ButtonGroup variant="segmented">
                                            <Button
                                                pressed={csvPreviewFilter === 'valid'}
                                                onClick={() => setCsvPreviewFilter('valid')}
                                            >{`Valid Entries (${csvPreviewData.filter(d => d.status === 'New').length})`}</Button>
                                            <Button
                                                pressed={csvPreviewFilter === 'duplicate'}
                                                onClick={() => setCsvPreviewFilter('duplicate')}
                                            >{`Duplicate Entries (${csvPreviewData.filter(d => d.status === 'Duplicate').length})`}</Button>
                                        </ButtonGroup>
                                        <div style={{ position: 'relative' }}>
                                            {/* Header Row */}
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
                                                    {csvPreviewData
                                                        .filter(item => csvPreviewFilter === 'valid' ? item.status === 'New' : item.status === 'Duplicate')
                                                        .map((item) => (
                                                            <div key={item.index} style={{ display: 'flex', padding: 'var(--p-space-200)', borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                                                                <div style={{ width: '10%' }}>
                                                                    <Text as="span" variant="bodySm" tone="subdued">{item.index + 1}</Text>
                                                                </div>
                                                                <div style={{ width: importMode === 'keys_with_translation' ? '40%' : '70%', paddingRight: '10px' }}>
                                                                    <Text as="span" variant="bodyMd" fontWeight="bold" breakWord>{item.key}</Text>
                                                                </div>
                                                                <div style={{ width: importMode === 'keys_with_translation' ? '50%' : '20%' }}>
                                                                    <Text as="span" variant="bodyMd" tone={item.translation ? undefined : "subdued"} breakWord>
                                                                        {item.translation || ''}
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
                            </>
                        )}
                    </BlockStack>
                </Modal.Section>
            </Modal >
        </>
    );
}
