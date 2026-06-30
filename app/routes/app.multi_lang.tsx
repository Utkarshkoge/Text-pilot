import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { useLoaderData, useFetcher, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { BlockStack, Card, Page, Text, Box, InlineStack, Button, Checkbox, TextField, ProgressBar, Banner, Divider, Modal, InlineGrid, useBreakpoints, DataTable } from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';
import { AUTHORS_QUERY } from '../query/translationQuery';
import { fetchMetaobjectById, updateMetaobjectTranslation, hasMetaobjectDefinition } from '../utils/transaltionUpdate';
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";
import { CsvImportModals } from '../component/CsvSync/CsvImportModalsMulti';
import { SaveBar } from '@shopify/app-bridge-react';

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
                <div style={{ width: '10%' }}>
                    <Text as="span" tone="subdued">{index}</Text>
                </div>
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

type LanguageNode = {
    id: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
};

function flattenObject(obj: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value));
        } else {
            result[key] = String(value ?? '');
        }
    }
    return result;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin } = await authenticate.admin(request);

    const hasDef = await hasMetaobjectDefinition(admin);
    if (!hasDef) {
        return { nodes: [], hasDefinition: false };
    }

    const res = await admin.graphql(AUTHORS_QUERY);
    const json = await res.json();
    const nodes = json.data?.metaobjects?.nodes || [];
    return { nodes, hasDefinition: true };
}

export async function action({ request }: ActionFunctionArgs) {
    let metaobjectId = '';
    try {
        const { admin } = await authenticate.admin(request);
        const formData = await request.formData();
        const operation = formData.get('operation');
        metaobjectId = formData.get('metaobjectId') as string;

        if (operation === 'apply_update') {
            const updatesRaw = formData.get('updates') as string;
            const orderedKeysRaw = formData.get('orderedKeys') as string;

            if (!metaobjectId) return { error: 'Missing metaobject ID', metaobjectId };

            // updates is already flat and translated by the client!
            const updates: Record<string, string> = updatesRaw ? JSON.parse(updatesRaw) : {};
            const orderedKeys: string[] = orderedKeysRaw ? JSON.parse(orderedKeysRaw) : [];

            let contentToMerge: Record<string, string> = structuredClone(updates);

            const metaobject = await fetchMetaobjectById(admin, metaobjectId);
            const currentTranslation = flattenObject(metaobject.translation?.jsonValue ?? {});

            let finalTranslation: Record<string, string> = {};
            if (orderedKeys.length > 0) {
                // Add new keys first in the requested order
                for (const key of orderedKeys) {
                    finalTranslation[key] = contentToMerge[key] !== undefined ? contentToMerge[key] : currentTranslation[key];
                }
                // Add any existing keys that aren't in the new updates
                for (const key of Object.keys(currentTranslation)) {
                    if (finalTranslation[key] === undefined) {
                        finalTranslation[key] = currentTranslation[key];
                    }
                }
            } else {
                finalTranslation = { ...currentTranslation, ...contentToMerge };
            }

            const finalResult = await updateMetaobjectTranslation(admin, metaobjectId, finalTranslation);

            return { success: true, metaobjectId, finalTranslation: finalResult.translation?.jsonValue };
        }

        return { error: 'Unknown operation', metaobjectId };

    } catch (error: any) {
        console.error('Action error:', error);
        return { error: error.message, metaobjectId };
    }
}

export default function MultiLanguageUpdate() {
    const { nodes: rawNodes, hasDefinition } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();

    if (!hasDefinition) {
        return <TranslationDefinitionMissing />;
    }

    const nodes = rawNodes as LanguageNode[];

    // schema is always flat: { key: '' }
    const [schema, setSchema] = useState<Record<string, string>>({});
    const [directKey, setDirectKey] = useState('');
    const [processingQueue, setProcessingQueue] = useState<string[]>([]);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'running' | 'complete'>('idle');
    const [completedCount, setCompletedCount] = useState(0);
    const [autoTranslate, setAutoTranslate] = useState(false);
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
    const [showApplySection, setShowApplySection] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedLocale, setSelectedLocale] = useState<Set<string>>(new Set());
    const [locale, setLocale] = useState<string[]>([]);
    const totalToProcess = useRef(0);
    const activeIdRef = useRef<string | null>(null);

    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    function toggleSelection(node: LanguageNode) {
        const next = new Set(selectedIds);
        const nextLocale = new Set(selectedLocale);
        const loc = node?.locale?.jsonValue ?? null;

        if (next.has(node.id)) {
            next.delete(node.id);
            if (nextLocale.has(loc)) nextLocale.delete(loc);
        } else {
            next.add(node.id);
            nextLocale.add(loc);
        }

        setSelectedIds(next);
        setSelectedLocale(nextLocale);
        setShowApplySection(false);
    }

    function toggleAll() {
        if (selectedIds.size === nodes.length) {
            setSelectedIds(new Set());
            setSelectedLocale(new Set());
            setProcessingStatus('idle');
            setAutoTranslate(false);
        } else {
            setSelectedIds(new Set(nodes.map(n => n.id)));
            setSelectedLocale(new Set(nodes.map(n => n.locale?.jsonValue).filter(Boolean)));
        }
        setShowApplySection(false);
    }

    function startOver() {
        setSchema({});
        setDirectKey('');
        setSelectedIds(new Set());
        setProcessingStatus('idle');
        setAutoTranslate(false);
        setShowApplySection(false);
    }

    function addDirectKey() {
        const trimmed = directKey.trim();
        if (!trimmed) return;
        setSchema(prev => ({ [trimmed]: '', ...prev }));
        setDirectKey('');
        setShowApplySection(false);
        setCurrentPage(1);
        setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }

    function removeKey(key: string) {
        setSchema(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setShowApplySection(false);
    }

    function startProcessing() {
        if (selectedIds.size === 0 || Object.keys(schema).length === 0) return;
        if (selectedLocale.size === 0) return;

        const queue = Array.from(selectedIds);
        const loc = Array.from(selectedLocale);

        const initialProgress: Record<string, LanguageProgress> = {};
        const keyCount = Object.keys(schema).length;
        queue.forEach(id => {
            initialProgress[id] = { status: 'pending', keysTotal: keyCount, keysDone: 0 };
        });
        setLanguageProgress(initialProgress);

        setProcessingQueue(queue);
        setLocale(loc);
        totalToProcess.current = queue.length;
        setCompletedCount(0);
        setProcessingStatus('running');
        activeIdRef.current = null;
    }

    useEffect(() => {
        if (processingStatus !== 'running') return;

        // Wait until fetcher is completely idle and we are NOT waiting for a response
        if (fetcher.state !== 'idle' || activeIdRef.current) return;

        if (processingQueue.length === 0 || locale.length === 0) {
            setProcessingStatus('complete');
            setSchema({});
            return;
        }

        const nextId = processingQueue[0];
        const nextLocale = locale[0];
        const info = nodes.find(n => n.id === nextId);

        activeIdRef.current = nextId; // Mark that we are actively waiting for this item to finish

        (async () => {
            try {
                const keysToTranslate = Object.keys(schema);
                let translatedSchema: Record<string, string> = { ...schema };

                if (autoTranslate && keysToTranslate.length > 0) {
                    setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'translating', keysTotal: keysToTranslate.length, keysDone: 0 } }));

                    const CHUNK_SIZE = 2;
                    let doneCount = 0;

                    for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
                        const chunk = keysToTranslate.slice(i, i + CHUNK_SIZE);

                        try {
                            const response = await fetch('/api/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ words: chunk, locale: nextLocale })
                            });

                            if (response.ok) {
                                const data = await response.json();
                                if (!data.error && data.translations) {
                                    Object.assign(translatedSchema, data.translations);
                                }
                            }
                        } catch (err: any) {
                            // Silently ignore chunk failures and proceed with empty strings
                        }

                        doneCount += chunk.length;
                        setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], keysDone: doneCount } }));
                    }
                }

                setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'saving' } }));

                // Submit to action to update the metaobject
                fetcher.submit(
                    {
                        operation: 'apply_update',
                        metaobjectId: nextId,
                        updates: JSON.stringify(translatedSchema),
                        orderedKeys: JSON.stringify(Object.keys(translatedSchema)),
                    },
                    { method: 'POST' }
                );

            } catch (error: any) {
                // Only catches unexpected systemic errors now, not translation errors
                setLanguageProgress(prev => ({ ...prev, [nextId]: { ...prev[nextId], status: 'error', errorMessage: error.message } }));
                activeIdRef.current = null;
                setProcessingQueue(prev => prev.slice(1));
                setLocale(prev => prev.slice(1));
            }
        })();

    }, [processingQueue, processingStatus, fetcher.state, locale, schema, autoTranslate, nodes, fetcher]);

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
                setLocale(prev => prev.slice(1));
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

    const { mdUp } = useBreakpoints();

    return (

        <Page
            title="Multiple Language" fullWidth
            subtitle="Select multiple languages and manage their translations."
            backAction={{ content: "Home", onAction: () => navigate("/app") }}
            secondaryActions={[
                {
                    content: "Instructions",
                    onAction: () => setInstructionsOpen(true),
                },
            ]}
        >
            <SaveBar id="multi-lang-save-bar" open={processingStatus === 'idle' && selectedIds.size > 0 && schemaKeys.length > 0 && !showApplySection}>
                <button variant="primary" onClick={() => {
                    setShowApplySection(true);
                    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                }}>Save changes</button>
                <button onClick={startOver}>Discard</button>
            </SaveBar>

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
                                                    <Checkbox
                                                        label={`${node.language.jsonValue}`}
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (processingStatus === 'running') return;
                                                            toggleSelection(node);
                                                        }}
                                                        disabled={processingStatus === 'running'}
                                                    />
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

                                        {/* <Banner tone="info">
                                    <Text as="p">If <strong>Auto Translate</strong> is on, the "Key Name" will be used as the source text for translation.</Text>
                                </Banner> */}

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
                                                        placeholder="e.g. welcome_message"
                                                    />
                                                </div>
                                                <Box paddingBlockStart="600">
                                                    <InlineStack gap="200">
                                                        <Button onClick={addDirectKey} disabled={!directKey.trim()}>Add</Button>
                                                        <CsvImportModals
                                                            currentTranslation={schema}
                                                            onImportConfirm={(updates) => {
                                                                setSchema(prev => ({ ...updates, ...prev }));
                                                                setShowApplySection(false);
                                                                setCurrentPage(1);
                                                                setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                                                            }}
                                                            buttonText="Add via CSV"
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

                                                    <div style={{ display: 'flex', padding: 'var(--p-space-200)', borderBottom: '1px solid var(--p-color-border-subdued)', fontWeight: 'bold' }}>
                                                        <div style={{ width: '10%' }}>Index</div>
                                                        <div style={{ width: '90%' }}>Key</div>
                                                    </div>

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

                                                    {/* {totalPages > 1 && (
                                                <>
                                                    <Divider />
                                                    <Box paddingBlockStart="200">
                                                        <InlineStack gap="300" blockAlign="center" align="end">
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
                                                    </Box>
                                                </>
                                            )} */}
                                                </BlockStack>
                                            </div>
                                        )}
                                    </BlockStack>
                                </Card>
                            )}

                            {/* 3. APPLY */}
                            {(showApplySection || processingStatus !== 'idle') && (
                                <Card>
                                    <BlockStack gap="100">
                                        <Text as="h2" variant="headingMd">Apply Changes</Text>

                                        {processingStatus === 'idle' && (
                                            <BlockStack gap="400">
                                                <Checkbox
                                                    label="Auto Translate Content"
                                                    checked={autoTranslate}
                                                    onChange={setAutoTranslate}
                                                    helpText="Automatically translate keys into all selected languages."
                                                />

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

                                        {processingStatus === 'running' && (
                                            <BlockStack gap="200">
                                                {/* @ts-ignore */}
                                                <ProgressBar progress={Math.round((completedCount / (totalToProcess.current || 1)) * 100)} />
                                                <Text as="p" alignment="center">
                                                    Processing {completedCount} / {totalToProcess.current} Languages
                                                </Text>

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
                                                            else if (prog.status === 'translating') statusNode = <Text as="span" tone="info">🔄 Translating ({prog.keysDone}/{prog.keysTotal})</Text>;
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
                                            </BlockStack>
                                        )}

                                        {processingStatus === 'complete' && (
                                            <BlockStack gap="100" align="center">
                                                <Text as="h3" variant="headingLg" tone="success" alignment="center">All Done!</Text>
                                                <Box paddingBlockStart="200">
                                                    <Button size="large" onClick={startOver}>Start New Operation</Button>
                                                </Box>
                                            </BlockStack>
                                        )}
                                    </BlockStack>
                                </Card>
                            )}
                        </>
                    )}
                </BlockStack>
            </InlineGrid>

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
                            You are about to apply <strong>{schemaKeys.length}</strong> key{schemaKeys.length !== 1 ? 's' : ''} to <strong>{selectedIds.size}</strong> language{selectedIds.size !== 1 ? 's' : ''}.
                        </Text>
                        <Text as="p">
                            This operation will update the translations for all selected languages. Are you sure you want to proceed?
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

        </Page>
    );
}
