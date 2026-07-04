
import { useLoaderData, useFetcher, useNavigate } from 'react-router';
import { useEffect, useState, useRef, useMemo } from 'react';
import { BlockStack, Card, Page, Text, Box, InlineStack, Button, Checkbox, TextField, ProgressBar, Banner, Divider, Modal, InlineGrid, useBreakpoints, DataTable, EmptyState, Tooltip, Icon } from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';
import { CsvImportModals } from './CsvSync/CsvImportModalsMulti';
import { Toast, Frame } from '@shopify/polaris';
import { MultiLanguageInstructionsModal } from 'app/component/InstructionsModal';
import { loader } from 'app/routes/app.multi_lang';

type LanguageNode = {
    id: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
};


const KeyPreviewRow = ({ keyName, index, onRemove }: { keyName: string, index: number, onRemove: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: 'var(--p-space-100)',
                borderBottom: '1px solid var(--p-color-border-subdued)',
                backgroundColor: isHovered ? 'var(--p-color-bg-surface-hover)' : 'transparent',
                transition: 'background-color 0.2s'
            }}>
            <InlineStack align="space-between" blockAlign="center" wrap={false}>
                <div style={{ flex: 1, wordBreak: 'break-word', paddingRight: '1rem' }}>
                    <Text as="span" fontWeight="bold">{keyName}</Text>
                </div>
                <div>
                    <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="plain"
                        onClick={onRemove}
                    />
                </div>
            </InlineStack>
        </div>
    );
};

export default function MultiLanguageUpdate() {
    const { nodes: rawNodes } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();
    const nodes = rawNodes as LanguageNode[];
    // schema is always flat: { key: '' }
    const [schema, setSchema] = useState<Record<string, string>>({});
    const [directKey, setDirectKey] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [processingQueue, setProcessingQueue] = useState<string[]>([]);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'running' | 'complete'>('idle');
    const [completedCount, setCompletedCount] = useState(0);
    const [autoTranslate, setAutoTranslate] = useState(false);
    const [showAutoTranslateConfirmModal, setShowAutoTranslateConfirmModal] = useState(false);
    type LanguageStatus = 'pending' | 'translating' | 'saving' | 'complete' | 'error';
    type LanguageProgress = {
        status: LanguageStatus;
        keysTotal: number;
        keysDone: number;
        errorMessage?: string;
    };
    const [languageProgress, setLanguageProgress] = useState<Record<string, LanguageProgress>>({});
    const [isApplyModalActive, setIsApplyModalActive] = useState(false);
    const [isClearModalActive, setIsClearModalActive] = useState(false);
    const [limitExceededModalOpen, setLimitExceededModalOpen] = useState(false);
    const [pendingLimitInfo, setPendingLimitInfo] = useState<{ currentCount: number; newLimit: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const maxEntries = selectedIds.size > 0 ? Math.ceil(200 / selectedIds.size) : 200;
    const totalToProcess = useRef(0);
    const activeIdRef = useRef<string | null>(null);
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const overallProgress = useMemo(() => {
        if (totalToProcess.current === 0) return 0;
        let totalProgressValue = 0;
        Array.from(selectedIds).forEach(id => {
            const prog = languageProgress[id];
            if (!prog) return;
            if (prog.status === 'complete') {
                totalProgressValue += 100;
            } else if (prog.status === 'saving') {
                totalProgressValue += 90;
            } else if (prog.status === 'translating') {
                const subProgress = prog.keysTotal > 0 ? (prog.keysDone / prog.keysTotal) * 80 : 0;
                totalProgressValue += subProgress;
            } else if (prog.status === 'error') {
                totalProgressValue += 100;
            }
        });
        return Math.round(totalProgressValue / totalToProcess.current);
    }, [languageProgress, selectedIds]);

    function toggleSelection(node: LanguageNode) {
        const next = new Set(selectedIds);
        if (next.has(node.id)) {
            next.delete(node.id);
            setSelectedIds(next);
        } else {
            const nextSize = next.size + 1;
            const newMaxEntries = Math.ceil(200 / nextSize);
            const currentKeysCount = Object.keys(schema).length;

            if (currentKeysCount > newMaxEntries) {
                setPendingLimitInfo({ currentCount: currentKeysCount, newLimit: newMaxEntries });
                setLimitExceededModalOpen(true);
                return;
            }

            next.add(node.id);
            setSelectedIds(next);
        }
    }
    function toggleAll() {
        if (selectedIds.size === nodes.length) {
            setSelectedIds(new Set());
            setProcessingStatus('idle');
            setAutoTranslate(false);
        } else {
            const nextSize = nodes.length;
            const newMaxEntries = Math.ceil(200 / nextSize);
            const currentKeysCount = Object.keys(schema).length;

            if (currentKeysCount > newMaxEntries) {
                setPendingLimitInfo({ currentCount: currentKeysCount, newLimit: newMaxEntries });
                setLimitExceededModalOpen(true);
                return;
            }

            setSelectedIds(new Set(nodes.map(n => n.id)));
        }
    }

    function startOver() {
        setSchema({});
        setDirectKey('');
        setSelectedIds(new Set());
        setProcessingStatus('idle');
        setAutoTranslate(false);
    }
    function addDirectKey() {
        const trimmed = directKey.trim();
        if (!trimmed) return;
        if (Object.keys(schema).length >= maxEntries) {
            setToastMessage(`Cannot add key. Maximum limit of ${maxEntries} keys reached.`);
            return;
        }
        if (schema[trimmed] !== undefined) {
            setToastMessage(`Key "${trimmed}" is already added.`);
            return;
        }
        setSchema(prev => ({ [trimmed]: '', ...prev }));
        setDirectKey('');
        setCurrentPage(1);
        setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
    function removeKey(key: string) {
        setSchema(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }
    function startProcessing() {
        if (selectedIds.size === 0 || Object.keys(schema).length === 0) return;
        const queue = Array.from(selectedIds);
        const initialProgress: Record<string, LanguageProgress> = {};
        const keyCount = Object.keys(schema).length;
        queue.forEach(id => {
            initialProgress[id] = { status: 'pending', keysTotal: keyCount, keysDone: 0 };
        });
        setLanguageProgress(initialProgress);
        setProcessingQueue(queue);
        totalToProcess.current = queue.length;
        setCompletedCount(0);
        setProcessingStatus('running');
        activeIdRef.current = null;
    }
    useEffect(() => {
        if (processingStatus !== 'running') return;
        // Wait until fetcher is completely idle and we are NOT waiting for a response
        if (fetcher.state !== 'idle' || activeIdRef.current) return;
        if (processingQueue.length === 0) {
            setProcessingStatus('complete');
            setSchema({});
            setToastMessage("Changes saved successfully to all selected languages.");
            return;
        }
        const nextId = processingQueue[0];
        const info = nodes.find(n => n.id === nextId);
        const nextLocale = info?.locale?.jsonValue;
        if (!nextLocale) {
            console.error(`[MultiLang] Missing locale for metaobject ID: ${nextId}`);
            setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'error', errorMessage: 'Missing locale' } }));
            setProcessingQueue(prev => prev.slice(1));
            return;
        }
        activeIdRef.current = nextId; // Mark that we are actively waiting for this item to finish
        console.log(`[MultiLang] Processing queue start for ${nextId} (${nextLocale}). Auto-translate: ${autoTranslate}`);
        (async () => {
            try {
                const keysToTranslate = Object.keys(schema);
                let translatedSchema: Record<string, string> = { ...schema };
                if (autoTranslate && keysToTranslate.length > 0) {
                    setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'translating', keysTotal: keysToTranslate.length, keysDone: 0 } }));
                    const CHUNK_SIZE = 2;
                    let doneCount = 0;
                    for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
                        const chunk = keysToTranslate.slice(i, i + CHUNK_SIZE).map(w => w.trim());
                        console.log(`[MultiLang] Translating chunk: ${JSON.stringify(chunk)} for locale: ${nextLocale}`);
                        try {
                            const response = await fetch('/api/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ words: chunk, locale: nextLocale })
                            });
                            console.log(`[MultiLang] Translate API response status: ${response.status}`);
                            if (response.ok) {
                                const data = await response.json();
                                console.log(`[MultiLang] Translate API response data:`, data);
                                if (!data.error && data.translations) {
                                    Object.assign(translatedSchema, data.translations);
                                }
                            }
                        } catch (err: any) {
                            console.error(`[MultiLang] Translate chunk error:`, err);
                        }
                        doneCount += chunk.length;
                        setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], keysDone: doneCount } }));
                    }
                }
                console.log(`[MultiLang] Submitting updates for ${nextId}:`, translatedSchema);
                setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'saving' } }));
                fetcher.submit(
                    {
                        operation: 'apply_update',
                        metaobjectId: nextId,
                        updates: JSON.stringify(translatedSchema),
                    },
                    { method: 'POST' }
                );
            } catch (error: any) {
                console.error(`[MultiLang] Systemic queue processing error for ${nextId}:`, error);
                setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'error', errorMessage: error.message } }));
                activeIdRef.current = null;
                setProcessingQueue(prev => prev.slice(1));
            }
        })();
    }, [processingQueue, processingStatus, fetcher.state, schema, autoTranslate, nodes, fetcher]);
    useEffect(() => {
        if (
            processingStatus === 'running' &&
            fetcher.state === 'idle' &&
            activeIdRef.current
        ) {
            // Check if the current fetcher.data belongs to the item we just processed
            // OR if it's an error without an ID (system failure fallback)
            if (
                fetcher.data?.metaobjectId === activeIdRef.current ||
                (fetcher.data?.error && !fetcher.data?.metaobjectId)
            ) {
                const currentId = activeIdRef.current as string;
                console.log(`[MultiLang] Fetcher submission completed for ${currentId}:`, fetcher.data);
                if (fetcher.data.success) {
                    setCompletedCount(c => c + 1);
                    setLanguageProgress(prev => ({ ...prev, [currentId]: { ...prev[currentId], status: 'complete' } }));
                } else {
                    setLanguageProgress(prev => ({ ...prev, [currentId]: { ...prev[currentId], status: 'error', errorMessage: fetcher.data.error } }));
                }
                // Clear the active ID so the next item can be submitted
                activeIdRef.current = null;
                // Advance the queue
                setProcessingQueue(prev => prev.slice(1));
            }
        }
    }, [fetcher.state, fetcher.data, processingStatus]);
    const schemaKeys = Object.keys(schema);
    const totalPages = Math.max(1, Math.ceil(schemaKeys.length / pageSize));
    const paginatedKeys = schemaKeys.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);
    let currentImportKeysCount = schemaKeys.length;
    let autoTranslationLimitExceeded = currentImportKeysCount > maxEntries;
    const { mdUp } = useBreakpoints();
    return (
        <Frame>
            <Page
                title="Multiple Languages" fullWidth
                subtitle="Select multiple languages and manage their translations."
                backAction={{ content: "Home", onAction: () => navigate("/app") }}
                secondaryActions={nodes.length !== 0 && [
                    {
                        content: "Instructions",
                        onAction: () => setInstructionsOpen(true),
                    },
                ]}
            >
                {nodes.length === 0 ? (
                    <Card>
                        <Box padding="800">
                            <BlockStack gap="400" align="center" inlineAlign="center">
                                <div style={{ maxWidth: '200px', margin: '0 auto' }}>
                                    <img src="/empty-state.png" alt="Empty State" style={{ width: '100%', display: 'block' }} />
                                </div>
                                <Text as="h2" variant="headingLg" alignment="center">Empty languages</Text>
                                <Text as="p" tone="subdued" alignment="center">
                                    You need to create at least one language before managing translations.
                                </Text>
                                <Button variant="primary" onClick={() => navigate("/app/definition")}>Add Language</Button>
                            </BlockStack>
                        </Box>
                    </Card>
                ) : (
                    <InlineGrid columns={mdUp && processingStatus === 'idle' ? '240px 1fr' : '1fr'} gap="400" alignItems="start">
                        {/* 1. SELECT LANGUAGES */}
                        {processingStatus === 'idle' && (
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">Select Languages ({selectedIds.size})</Text>
                                    {processingStatus === 'idle' && (
                                        <Box paddingBlockEnd="200" borderColor="border" borderBlockEndWidth="025">
                                            <Button onClick={toggleAll} size="micro">
                                                {selectedIds.size === nodes.length ? "Deselect All" : "Select All"}
                                            </Button>
                                        </Box>
                                    )}
                                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        <BlockStack gap="050">
                                            {nodes.map(node => {
                                                const isSelected = selectedIds.has(node.id);
                                                return (
                                                    <div
                                                        key={node.id}
                                                        onClick={() => toggleSelection(node)}
                                                        style={{
                                                            padding: 'var(--p-space-200)',
                                                            cursor: 'pointer',
                                                            borderRadius: 'var(--p-border-radius-200)',
                                                            transition: 'all 0.2s',
                                                            borderLeft: '3px solid',
                                                            borderColor: isSelected ? 'var(--p-color-border-interactive)' : 'transparent',
                                                            backgroundColor: isSelected ? 'var(--p-color-bg-surface-hover)' : 'transparent',
                                                        }}
                                                    >
                                                        <InlineStack align="space-between" blockAlign="center">
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <Checkbox
                                                                    label={`${node.language.jsonValue}`}
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelection(node)}
                                                                />
                                                            </div>
                                                        </InlineStack>
                                                    </div>
                                                );
                                            })}
                                        </BlockStack>
                                    </div>
                                </BlockStack>
                            </Card>
                        )}
                        {/* RIGHT COLUMN */}
                        <BlockStack gap="100">
                            {selectedIds.size === 0 ? (
                                <Card>
                                    <Box padding="800">
                                        <BlockStack gap="200" align="center" inlineAlign="center">
                                            <div style={{ maxWidth: '200px', margin: '0 auto' }}>
                                                <img src="/empty-state.png" alt="Empty State" style={{ width: '100%', display: 'block' }} />
                                            </div>
                                            <Text as="h2" variant="headingMd" alignment="center">No Language Selected</Text>
                                            <Text as="p" tone="subdued" alignment="center">
                                                Please select at least one language from the list first to define keys and apply translations.
                                            </Text>
                                        </BlockStack>
                                    </Box>
                                </Card>
                            ) : (
                                <>
                                    {/* 2. DEFINE KEYS */}
                                    {processingStatus === 'idle' && (
                                        <Card>
                                            <BlockStack gap="100">
                                                <Text as="h2" variant="headingMd">Add Keys</Text>
                                                <Text as="p" tone="subdued">Define the keys to add across selected languages.</Text>

                                                {/* ADD KEY INPUT */}
                                                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                                                    <InlineStack gap="300" align="start">
                                                        <div
                                                            style={{ flex: 1 }}
                                                            onKeyDown={(e: React.KeyboardEvent) => {
                                                                if (e.key === 'Enter') addDirectKey();
                                                            }}
                                                        >
                                                            <TextField
                                                                label="Key Name"
                                                                value={directKey}
                                                                onChange={setDirectKey}
                                                                autoComplete="off"
                                                                placeholder={schemaKeys.length >= maxEntries ? "Limit reached" : "e.g. welcome_message"}
                                                                disabled={schemaKeys.length >= maxEntries}
                                                            />
                                                        </div>
                                                        <Box paddingBlockStart="600">
                                                            <InlineStack gap="200">
                                                                <Button onClick={addDirectKey} disabled={!directKey.trim() || schemaKeys.length >= maxEntries}>Add</Button>
                                                                <CsvImportModals
                                                                    currentTranslation={schema}
                                                                    onImportConfirm={(updates) => {
                                                                        setSchema(prev => ({ ...prev, ...updates }));
                                                                        setCurrentPage(1);
                                                                        setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                                                                    }}
                                                                    buttonText="Add via CSV"
                                                                    maxEntries={maxEntries}
                                                                    disabled={schemaKeys.length >= maxEntries}
                                                                />
                                                            </InlineStack>
                                                        </Box>
                                                    </InlineStack>
                                                </Box>
                                                {/* PREVIEW LIST */}
                                                {schemaKeys.length > 0 && (
                                                    <div style={{
                                                        padding: 'var(--p-space-200)',
                                                        border: '1px solid var(--p-color-border)',
                                                        borderRadius: 'var(--p-border-radius-200)',
                                                        marginTop: 'var(--p-space-200)'
                                                    }}>
                                                        <BlockStack gap="200">
                                                            <InlineStack align="space-between">
                                                                <InlineStack gap="300" blockAlign="center">
                                                                    <Text as="h3" variant="headingSm">Keys to Apply ({schemaKeys.length})</Text>
                                                                    <Button variant="plain" tone="critical" onClick={() => setIsClearModalActive(true)}>Clear All</Button>
                                                                </InlineStack>
                                                                {totalPages > 1 && (
                                                                    <InlineStack gap="300" blockAlign="center">
                                                                        <Button onClick={() => {
                                                                            setCurrentPage(1);
                                                                            setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                                                                        }} disabled={currentPage === 1}>First</Button>
                                                                        <Button onClick={() => {
                                                                            setCurrentPage(p => p - 1);
                                                                            setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                                                                        }} disabled={currentPage === 1}>Previous</Button>
                                                                        <Text as="span" variant="bodySm">
                                                                            Page {currentPage} of {totalPages}
                                                                        </Text>
                                                                        <Button onClick={() => {
                                                                            setCurrentPage(p => p + 1);
                                                                            setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                                                                        }} disabled={currentPage === totalPages}>Next</Button>
                                                                    </InlineStack>
                                                                )}
                                                            </InlineStack>
                                                            <Divider />
                                                            <div ref={scrollContainerRef} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                                <BlockStack gap="0">
                                                                    {paginatedKeys.map((key, index) => {
                                                                        const overallIndex = (currentPage - 1) * pageSize + index + 1;
                                                                        return (
                                                                            <KeyPreviewRow
                                                                                key={key}
                                                                                keyName={key}
                                                                                index={overallIndex}
                                                                                onRemove={() => removeKey(key)}
                                                                            />
                                                                        );
                                                                    })}
                                                                </BlockStack>
                                                            </div>
                                                        </BlockStack>
                                                    </div>
                                                )}
                                            </BlockStack>
                                        </Card>
                                    )}
                                    {/* 3. APPLY */}
                                    {(schemaKeys.length > 0 || processingStatus !== 'idle') && (
                                        <Card>
                                            <BlockStack>
                                                {processingStatus === 'idle' && (
                                                    <BlockStack gap="200">
                                                        <Text as="h2" variant="headingMd">
                                                            Auto Translations
                                                        </Text>
                                                        <BlockStack gap="100">
                                                            <InlineStack gap="100" align="start" blockAlign="center">
                                                                <Checkbox
                                                                    label="Enable auto-translation for new keys"
                                                                    checked={autoTranslate}
                                                                    onChange={(v) => {
                                                                        if (v) {
                                                                            setShowAutoTranslateConfirmModal(true);
                                                                        } else {
                                                                            setAutoTranslate(false);
                                                                        }
                                                                    }}
                                                                />
                                                            </InlineStack>
                                                            <BlockStack gap="100">
                                                                <Banner tone="warning">
                                                                    <Text as="p">
                                                                        <strong>Auto Translate</strong> uses a free translation service. Please verify the generated translations before using them. The <strong>Key Name</strong> will be used as the source text.
                                                                    </Text>
                                                                </Banner>
                                                            </BlockStack>
                                                        </BlockStack>
                                                        {selectedIds.size > 0 && schemaKeys.length > 0 && (
                                                            <Button
                                                                variant="primary"
                                                                size="large"
                                                                onClick={() => setIsApplyModalActive(true)}
                                                            >
                                                                Apply Changes
                                                            </Button>
                                                        )}
                                                    </BlockStack>
                                                )}
                                                {(processingStatus === 'running' || processingStatus === 'complete') && (
                                                    <BlockStack gap="300">
                                                        {processingStatus === 'complete' && (
                                                            <Banner tone="success" title="All Translations Processed Successfully">
                                                                <Text as="p">
                                                                    Bulk translation operation has completed.
                                                                </Text>
                                                            </Banner>
                                                        )}
                                                        <BlockStack gap="200">
                                                            {/* @ts-ignore */}
                                                            <ProgressBar progress={processingStatus === 'complete' ? 100 : overallProgress} />
                                                            <Text as="p" alignment="center">
                                                                {processingStatus === 'complete' ? (
                                                                    `Completed processing of all languages`
                                                                ) : (
                                                                    `Processing ${completedCount} / ${totalToProcess.current} Languages (${overallProgress}%)`
                                                                )}
                                                            </Text>
                                                        </BlockStack>
                                                        <div style={{
                                                            border: '1px solid var(--p-color-border-secondary)',
                                                            borderRadius: 'var(--p-border-radius-200)',
                                                            maxHeight: '300px',
                                                            overflowY: 'auto'
                                                        }}>
                                                            <BlockStack gap="0">
                                                                {Array.from(selectedIds).map(id => {
                                                                    const node = nodes.find(n => n.id === id);
                                                                    const prog = languageProgress[id];
                                                                    if (!node || !prog) return null;
                                                                    let statusNode;
                                                                    if (prog.status === 'pending') statusNode = <Text as="span" tone="subdued">⏳ Pending</Text>;
                                                                    else if (prog.status === 'translating') statusNode = <Text as="span" tone="caution">🔄 Translating ({prog.keysDone}/{prog.keysTotal})</Text>;
                                                                    else if (prog.status === 'saving') statusNode = <Text as="span" tone="caution">💾 Saving...</Text>;
                                                                    else if (prog.status === 'complete') statusNode = <Text as="span" tone="success">✅ Complete</Text>;
                                                                    else if (prog.status === 'error') statusNode = <Text as="span" tone="critical">❌ Error: {prog.errorMessage}</Text>;
                                                                    return (
                                                                        <div key={id} style={{
                                                                            padding: 'var(--p-space-200)',
                                                                            borderBottom: '1px solid var(--p-color-border-secondary)',
                                                                            backgroundColor: prog.status === 'translating' || prog.status === 'saving' ? 'var(--p-color-bg-surface-hover)' : 'transparent'
                                                                        }}>
                                                                            <InlineStack align="space-between" blockAlign="center">
                                                                                <Text as="span" fontWeight={prog.status === 'translating' || prog.status === 'saving' ? "bold" : "regular"}>
                                                                                    {node.language.jsonValue} ({node.locale.jsonValue})
                                                                                </Text>
                                                                                {statusNode}
                                                                            </InlineStack>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </BlockStack>
                                                        </div>
                                                        {processingStatus === 'complete' && (
                                                            <InlineStack gap="300" align="center">
                                                                <Button size="large" onClick={startOver}>All Clear</Button>
                                                                <Button size="large" variant="primary" onClick={() => navigate('/app/lang')}>Preview Changes</Button>
                                                            </InlineStack>
                                                        )}
                                                    </BlockStack>
                                                )}
                                            </BlockStack>
                                        </Card>
                                    )}
                                </>
                            )}
                        </BlockStack>
                    </InlineGrid>
                )}
                <Modal
                    open={isApplyModalActive}
                    onClose={() => setIsApplyModalActive(false)}
                    title="Confirm Bulk Update"
                    primaryAction={{
                        content: 'Apply Changes',
                        onAction: () => {
                            startProcessing();
                            setIsApplyModalActive(false);
                        },
                    }}
                    secondaryActions={[{
                        content: 'Cancel',
                        onAction: () => setIsApplyModalActive(false),
                    }]}
                >
                    <Modal.Section>
                        <BlockStack gap="200">
                            <Text as="p">
                                You are about to save <strong>{schemaKeys.length}</strong> key{schemaKeys.length !== 1 ? 's' : ''} to <strong>{selectedIds.size}</strong> language{selectedIds.size !== 1 ? 's' : ''}.
                            </Text>
                            <Text as="p">
                                This operation will update the translations for all selected languages. Do you want to continue with these changes?
                            </Text>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
                <Modal
                    open={isClearModalActive}
                    onClose={() => setIsClearModalActive(false)}
                    title="Clear All Keys"
                    primaryAction={{
                        content: 'Clear All',
                        onAction: () => {
                            startOver();
                            setIsClearModalActive(false);
                        },
                        destructive: true,
                    }}
                    secondaryActions={[{
                        content: 'Cancel',
                        onAction: () => setIsClearModalActive(false),
                    }]}
                >
                    <Modal.Section>
                        <Text as="p">
                            Are you sure you want to clear all defined keys? This action will reset your current selection and cannot be undone.
                        </Text>
                    </Modal.Section>
                </Modal>
                <Modal
                    open={showAutoTranslateConfirmModal}
                    onClose={() => setShowAutoTranslateConfirmModal(false)}
                    title="Confirm Auto Translation"
                    primaryAction={{
                        content: 'Confirm',
                        onAction: () => {
                            setAutoTranslate(true);
                            setShowAutoTranslateConfirmModal(false);
                        }
                    }}
                    secondaryActions={[{
                        content: 'Cancel',
                        onAction: () => setShowAutoTranslateConfirmModal(false)
                    }]}
                >
                    <Modal.Section>
                        <BlockStack gap="300">
                            <Text as="p">
                                Are you sure you want to enable auto-translation for new keys?
                            </Text>
                            <Card background="bg-surface-secondary" padding="300">
                                <BlockStack gap="100" >
                                    <Text as="p" fontWeight="semibold">
                                        Auto Translation
                                    </Text>
                                    <Text as="p">
                                        • Uses free translation services.
                                    </Text>
                                    <Text as="p">
                                        • The Key Name is used as the source text.
                                    </Text>
                                    <Text as="p">
                                        • Translations are not guaranteed to be available or accurate.
                                    </Text>
                                    <Text as="p">
                                        • A translation is only added when a valid translated result is returned.
                                    </Text>
                                    <Text as="p">
                                        • If translation fails or matches the source text, it will be skipped.
                                    </Text>
                                </BlockStack>
                            </Card>
                            <Banner tone="info">
                                Always <strong>review</strong> translations before saving. You can also <strong>Update</strong>  them later.
                            </Banner>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
                {limitExceededModalOpen && pendingLimitInfo && (
                    <Modal
                        open={limitExceededModalOpen}
                        onClose={() => setLimitExceededModalOpen(false)}
                        title="Key Limit Exceeded"
                        primaryAction={{
                            content: 'OK',
                            onAction: () => setLimitExceededModalOpen(false),
                        }}
                    >
                        <Modal.Section>
                            <BlockStack gap="400">
                                <Banner title="Limit Exceeded" tone="critical">
                                    <BlockStack gap="200">
                                        <Text as="p">
                                            Selecting this language reduces the maximum allowed keys per language to <strong>{pendingLimitInfo.newLimit}</strong>.
                                        </Text>
                                        <Text as="p">
                                            You currently have <strong>{pendingLimitInfo.currentCount}</strong> keys, which exceeds the new limit.
                                        </Text>
                                        <Text as="p">
                                            Please remove some keys or save your changes before selecting additional languages.
                                        </Text>
                                    </BlockStack>
                                </Banner>
                            </BlockStack>
                        </Modal.Section>
                    </Modal>
                )}
                {toastMessage && (
                    <Toast content={toastMessage} duration={2000} onDismiss={() => setToastMessage(null)} error={toastMessage.toLowerCase().includes('already') || toastMessage.toLowerCase().includes('error')} />
                )}

                <MultiLanguageInstructionsModal
                    open={instructionsOpen}
                    onClose={() => setInstructionsOpen(false)}
                />

            </Page>
        </Frame>
    );
}
