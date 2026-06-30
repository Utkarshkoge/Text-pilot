import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { useLoaderData, useFetcher, useNavigate } from 'react-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { AUTHORS_QUERY } from '../query/translationQuery';
import { fetchMetaobjectById, updateMetaobjectTranslation, hasMetaobjectDefinition } from '../utils/transaltionUpdate';
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";
import {
    Page,
    Card,
    BlockStack,
    Box,
    Button,
    InlineStack,
    Text,
    Divider,
    Checkbox,
    Spinner,
    Frame,
    Modal,
    Toast,
    InlineGrid,
    useBreakpoints,
    ProgressBar,
    Banner,
    ButtonGroup,
    TextField,
    Icon
} from '@shopify/polaris';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    SearchIcon
} from '@shopify/polaris-icons';
import { SaveBar } from '@shopify/app-bridge-react';
import { TranslationRow, AddRootContent } from '../component/translation';
import { flattenObject } from '../utils/csvSyncUtils';
import { CsvExportButton } from '../component/CsvSync/CsvExportButton';
import { CsvImportModals } from '../component/CsvSync/CsvImportModals';
import { DataSyncModals } from '../component/CsvSync/DataSyncModals';
import type { LanguageNode } from '../hooks/useDataSync';

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin } = await authenticate.admin(request);

    const hasDef = await hasMetaobjectDefinition(admin);
    if (!hasDef) {
        return { nodes: [], hasDefinition: false };
    }

    const res = await admin.graphql(AUTHORS_QUERY);
    const json = await res.json();

    const nodes = json.data?.metaobjects?.nodes;

    if (!nodes) {
        throw new Response('No authors found', { status: 404 });
    }
    return { nodes, hasDefinition: true };
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { admin } = await authenticate.admin(request);
        const formData = await request.formData();
        const operation = formData.get('operation');

        if (operation === 'fetch') {
            const metaobjectId = formData.get('metaobjectId') as string;

            if (!metaobjectId) {
                throw new Response('Missing metaobject id', { status: 400 });
            }

            const metaobject = await fetchMetaobjectById(admin, metaobjectId);

            return { Translation: metaobject.translation?.jsonValue ?? null };
        }

        if (operation === 'fetch_sync_source') {
            const metaobjectId = formData.get('metaobjectId') as string;

            if (!metaobjectId) {
                throw new Response('Missing metaobject id', { status: 400 });
            }

            const metaobject = await fetchMetaobjectById(admin, metaobjectId);

            return { syncSourceTranslation: metaobject.translation?.jsonValue ?? null };
        }

        if (operation === 'submit_changes') {
            const metaobjectId = formData.get('metaobjectId') as string;

            if (!metaobjectId) {
                throw new Response('Missing metaobject id', { status: 400 });
            }
            const updatesRaw = formData.get('updatesToMerge') as string;
            const orderedKeysRaw = formData.get('orderedKeys') as string;

            let updatesToMerge: Record<string, string | null> = updatesRaw ? JSON.parse(updatesRaw) : {};
            let orderedKeys: string[] = orderedKeysRaw ? JSON.parse(orderedKeysRaw) : [];

            // Fetch current state from server to prevent overwriting parallel changes
            const metaobject = await fetchMetaobjectById(admin, metaobjectId);
            const currentTranslation = flattenObject(metaobject.translation?.jsonValue ?? {});

            // Apply updates and deletions
            for (const [key, value] of Object.entries(updatesToMerge)) {
                if (value === null) {
                    delete currentTranslation[key];
                } else {
                    currentTranslation[key] = value;
                }
            }

            // Reconstruct object in the exact order requested by the client
            let finalOrderedTranslation: Record<string, string> = {};
            if (orderedKeys.length > 0) {
                for (const key of orderedKeys) {
                    if (currentTranslation[key] !== undefined) {
                        finalOrderedTranslation[key] = currentTranslation[key];
                    }
                }
                // Add any extra keys that might have been added in parallel by another user
                for (const key of Object.keys(currentTranslation)) {
                    if (finalOrderedTranslation[key] === undefined) {
                        finalOrderedTranslation[key] = currentTranslation[key];
                    }
                }
            } else {
                finalOrderedTranslation = currentTranslation;
            }

            const updatedMetaoTranslation = await updateMetaobjectTranslation(admin, metaobjectId, finalOrderedTranslation);

            return { updatedMetaoTranslation };
        }

    } catch (error: any) {
        console.error('Action error:', error);
    }
}

export default function LanguageSelector() {
    const { nodes: rawNodes, hasDefinition } = useLoaderData<typeof loader>();
    console.log(rawNodes, hasDefinition, '......json');

    const fetcher = useFetcher();
    const { mdUp } = useBreakpoints();
    const navigate = useNavigate();

    if (!hasDefinition) {
        return <TranslationDefinitionMissing />;
    }

    const nodes = rawNodes as LanguageNode[];
    const data = { nodes };

    // translation is always a flat Record<string, string>
    const [translation, setTranslation] = useState<Record<string, string> | null>(null);
    const totalKeys = useMemo(() => Object.keys(translation || {}).length, [translation]);
    const [originalTranslation, setOriginalTranslation] = useState<Record<string, string> | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [autoTranslate, setAutoTranslate] = useState<boolean>(false);
    const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [confirmModalActive, setConfirmModalActive] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [successToast, setSuccessToast] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationProgress, setTranslationProgress] = useState<{ done: number, total: number } | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [translationFilter, setTranslationFilter] = useState<'all' | 'translated' | 'not_translated'>('all');
    const [isRunning, setIsRunning] = useState(false);
    const [instructionsOpen, setInstructionsOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const filteredTranslations = useMemo(() => {
        if (!translation) return null;

        let entries = Object.entries(translation);

        if (translationFilter === 'translated') {
            entries = entries.filter(([, value]) => value.trim() !== '');
        } else if (translationFilter === 'not_translated') {
            entries = entries.filter(([, value]) => value.trim() === '');
        }

        if (!searchQuery.trim()) return entries;
        const query = searchQuery.trim().toLowerCase();
        return entries.filter(([key, value]) =>
            key.toLowerCase().includes(query) || value.toLowerCase().includes(query)
        );
    }, [translation, searchQuery, translationFilter]);

    const totalPages = Math.max(1, Math.ceil((filteredTranslations?.length || 0) / pageSize));

    const paginatedTranslations = useMemo(() => {
        if (!filteredTranslations) return null;
        const startIndex = (currentPage - 1) * pageSize;
        return filteredTranslations.slice(startIndex, startIndex + pageSize);
    }, [filteredTranslations, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, translationFilter]);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const toggleModal = useCallback(() => setConfirmModalActive((active) => !active), []);
    const inputBufferRef = useRef<Record<string, string>>({});

    const handleSelectChange = useCallback((node: LanguageNode) => {
        if (!node) return;
        setSelectedLocale(node?.locale?.jsonValue);
        setSelectedId(node.id);
        setTranslation(null);
        setOriginalTranslation(null);
        setIsDirty(false);
        setAutoTranslate(false);
        setSearchQuery('');
        setTranslationFilter('all');
        setCurrentPage(1);
        fetcher.submit({ operation: 'fetch', metaobjectId: node.id }, { method: 'post' });
    }, [fetcher]);

    // Auto-select first node on load
    useEffect(() => {
        if (!selectedId && data.nodes.length > 0) {
            handleSelectChange(data.nodes[0]);
        }
    }, [selectedId, data.nodes, handleSelectChange]);

    const handleKeyChange = useCallback((key: string, v: string) => {
        inputBufferRef.current[key] = v;
        setIsDirty(true);
    }, []);

    const commitBufferedValue = useCallback((key: string) => {
        const val = inputBufferRef.current[key];
        if (val !== undefined) {
            setTranslation((prev) => ({ ...prev!, [key]: val }));
        }
    }, []);

    async function handleSubmitChanges() {
        if (!selectedId || !translation) return;

        // Flush any buffered inputs into translation before submitting
        let finalTranslation = { ...translation, ...inputBufferRef.current };

        if (autoTranslate && selectedLocale && originalTranslation) {
            const keysToTranslate = Object.keys(finalTranslation).filter(key =>
                !finalTranslation[key].trim() && !originalTranslation.hasOwnProperty(key)
            );

            if (keysToTranslate.length > 0) {
                setIsTranslating(true);
                setTranslationProgress({ done: 0, total: keysToTranslate.length });

                const CHUNK_SIZE = 2;
                let doneCount = 0;

                for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
                    const chunk = keysToTranslate.slice(i, i + CHUNK_SIZE);
                    try {
                        const response = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ words: chunk, locale: selectedLocale })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (!data.error && data.translations) {
                                Object.assign(finalTranslation, data.translations);
                            }
                        }
                    } catch (err) {
                        // ignore chunk errors
                    }
                    doneCount += chunk.length;
                    setTranslationProgress({ done: doneCount, total: keysToTranslate.length });
                }

                setIsTranslating(false);
                setTranslationProgress(null);
            }
        }

        const updatesToMerge: Record<string, string | null> = {};

        // Add modified or new keys
        for (const key of Object.keys(finalTranslation)) {
            if (finalTranslation[key] !== originalTranslation?.[key]) {
                updatesToMerge[key] = finalTranslation[key];
            }
        }

        // Add deleted keys as null
        if (originalTranslation) {
            for (const key of Object.keys(originalTranslation)) {
                if (!finalTranslation.hasOwnProperty(key)) {
                    updatesToMerge[key] = null;
                }
            }
        }

        fetcher.submit(
            {
                operation: 'submit_changes',
                metaobjectId: selectedId,
                updatesToMerge: JSON.stringify(updatesToMerge),
                orderedKeys: JSON.stringify(Object.keys(finalTranslation)),
            },
            { method: 'post' }
        );
    }

    const addRootKey = useCallback((key: string) => {
        if (translation && translation[key] !== undefined) {
            setToastMessage(`Key "${key}" already exists`);
            return;
        }
        setTranslation((p) => {
            if (!p) return { [key]: '' };
            return { [key]: '', ...p };
        });
        inputBufferRef.current[key] = '';
        setIsDirty(true);
        setCurrentPage(1);
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }, [translation]);

    const syncResolverRef = useRef<((data: Record<string, string>) => void) | null>(null);

    useEffect(() => {
        if (!fetcher.data || typeof fetcher.data !== 'object') return;

        if ('updatedMetaoTranslation' in fetcher.data) {
            const updated = (fetcher.data as any).updatedMetaoTranslation?.translation?.jsonValue ?? {};
            const flat = flattenObject(updated);

            setTranslation(flat);
            setOriginalTranslation(flat);
            setIsDirty(false);
            setAutoTranslate(false);
            inputBufferRef.current = {};
            setSuccessToast(true);
            setCurrentPage(1);
            return;
        }

        if ('error' in fetcher.data) {
            setToastMessage((fetcher.data as any).error);
            return;
        }

        if ('syncSourceTranslation' in fetcher.data) {
            const sourceJson = (fetcher.data as any).syncSourceTranslation || {};
            const sourceFlat = flattenObject(sourceJson);
            if (syncResolverRef.current) {
                syncResolverRef.current(sourceFlat);
                syncResolverRef.current = null;
            }
            return;
        }

        if ('Translation' in fetcher.data) {
            const translationJson = (fetcher.data as any).Translation || {};
            const flat = flattenObject(translationJson);
            setTranslation(flat);
            setOriginalTranslation(flat);
            inputBufferRef.current = {};
        }
    }, [fetcher.data]);

    function undoAllChanges() {
        if (!originalTranslation) return;
        setTranslation(structuredClone(originalTranslation));
        setAutoTranslate(false);
        setIsDirty(false);
        inputBufferRef.current = {};
    }

    const selectedNode = data.nodes.find(n => n.id === selectedId);

    return (
        <Frame>
            <Page
                title="Single Language" fullWidth
                subtitle="Select any language and manage its translations."
                backAction={{ content: "Home", onAction: () => navigate("/app") }}
                secondaryActions={[
                    {
                        content: "Instructions",
                        onAction: () => setInstructionsOpen(true),
                    },
                ]}
            >
                <SaveBar id="translation-save-bar" open={isDirty}>
                    <button variant="primary" onClick={handleSubmitChanges} loading={fetcher.state === 'submitting' || isTranslating ? "true" : undefined}>Save changes</button>
                    <button onClick={undoAllChanges} disabled={isTranslating || fetcher.state === 'submitting'}>Undo</button>
                </SaveBar>

                {/* Loading Overlay */}
                {((fetcher.state === 'submitting' && fetcher.formData?.get('operation') === 'submit_changes') || isTranslating) && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                    }}>
                        <Spinner size="large" />
                        <Text as="h2" variant="headingLg">
                            {isTranslating && translationProgress
                                ? `Translating ${translationProgress.done} of ${translationProgress.total} keys...`
                                : 'Updating translation...'}
                        </Text>
                        {isTranslating && translationProgress && (
                            <div style={{ width: '300px' }}>
                                {/* @ts-ignore */}
                                <ProgressBar progress={Math.round((translationProgress.done / translationProgress.total) * 100)} />
                            </div>
                        )}
                    </div>
                )}

                <InlineGrid columns={mdUp ? '240px 1fr' : '1fr'} gap="400" alignItems="start">
                    <Card>
                        <BlockStack gap="200">
                            <Text as="h2" variant="headingMd">Languages</Text>
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <BlockStack gap="050">
                                    {data.nodes.map((node) => {
                                        const isSelected = node.id === selectedId;

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
                                                onClick={() => handleSelectChange(node)}
                                            >
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text as="span" variant="bodySm" fontWeight={isSelected ? "bold" : "regular"}>
                                                        {node.language.jsonValue} {node.total_translations?.value ? `(${node.total_translations.value})` : '(0)'}
                                                    </Text>
                                                </InlineStack>
                                                <Text as="p" variant="bodyXs" tone="subdued">{node.handle}</Text>
                                            </div>
                                        );
                                    })}
                                </BlockStack>
                            </div>
                        </BlockStack>
                    </Card>

                    <Card>
                        {selectedId ? (
                            <BlockStack gap="200">
                                <InlineStack align="space-between" blockAlign="start">
                                    <BlockStack>
                                        <Text as="h2" variant="headingLg">{selectedNode?.language.jsonValue || selectedNode?.handle}</Text>
                                    </BlockStack>
                                    {translation && (
                                        <ButtonGroup>
                                            <CsvExportButton translation={translation} filename={selectedNode?.handle || 'translations'} />
                                            <CsvImportModals
                                                currentTranslation={translation}
                                                onImportConfirm={(updates) => {
                                                    setTranslation(prev => ({ ...updates, ...prev! }));
                                                    setIsDirty(true);
                                                    setToastMessage(`Imported ${Object.keys(updates).length} valid entries.`);
                                                    setCurrentPage(1);
                                                    setTimeout(() => {
                                                        if (scrollContainerRef.current) {
                                                            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }
                                                    }, 100);
                                                }}
                                            />
                                            <DataSyncModals
                                                currentTranslation={translation}
                                                availableNodes={data.nodes}
                                                currentLanguageId={selectedId}
                                                onSyncComplete={(updates) => {
                                                    setTranslation(prev => ({ ...updates, ...prev! }));
                                                    setIsDirty(true);
                                                    setCurrentPage(1);
                                                    setTimeout(() => {
                                                        if (scrollContainerRef.current) {
                                                            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }
                                                    }, 100);
                                                }}
                                                fetchSyncSource={(nodeId) => {
                                                    return new Promise((resolve) => {
                                                        syncResolverRef.current = resolve;
                                                        fetcher.submit({ operation: 'fetch_sync_source', metaobjectId: nodeId }, { method: 'post' });
                                                    });
                                                }}
                                            />
                                        </ButtonGroup>
                                    )}
                                </InlineStack>

                                <Box paddingBlock="100">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="300" blockAlign="center">
                                            <div style={{ width: '400px' }}>
                                                <TextField
                                                    label="Search translations"
                                                    labelHidden
                                                    value={searchQuery}
                                                    onChange={setSearchQuery}
                                                    placeholder="Search by key or translation..."
                                                    autoComplete="off"
                                                    clearButton
                                                    onClearButtonClick={() => setSearchQuery('')}
                                                    prefix={<Icon source={SearchIcon} />}
                                                />
                                            </div>
                                            <ButtonGroup segmented>
                                                <Button
                                                    pressed={translationFilter === 'all'}
                                                    onClick={() => setTranslationFilter('all')}
                                                >All</Button>
                                                <Button
                                                    pressed={translationFilter === 'translated'}
                                                    onClick={() => setTranslationFilter('translated')}
                                                >Translated</Button>
                                                <Button
                                                    pressed={translationFilter === 'not_translated'}
                                                    onClick={() => setTranslationFilter('not_translated')}
                                                >Not Translated</Button>
                                            </ButtonGroup>
                                        </InlineStack>
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
                                    </InlineStack>
                                    <Box paddingBlockStart="100">
                                        <Text as="span" variant="bodySm" tone="subdued">
                                            {`Current ${totalKeys} Keys / Saved ${selectedNode?.total_translations?.value || '0'} Keys`}
                                        </Text>
                                    </Box>
                                </Box>

                                <Divider />

                                {(fetcher.state === 'loading' || fetcher.state === 'submitting') && !translation ? (
                                    <Box padding="800">
                                        <BlockStack inlineAlign="center" gap="400">
                                            <Spinner size="large" />
                                            <Text variant="bodyLg" as="p">Language keys are loading...</Text>
                                        </BlockStack>
                                    </Box>
                                ) : (
                                    translation && (
                                        <div style={{ position: 'relative' }}>
                                            <div
                                                ref={scrollContainerRef}
                                                style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}
                                            >
                                                <BlockStack gap="100">
                                                    {paginatedTranslations?.map(([key, value]) => (
                                                        <TranslationRow
                                                            key={key}
                                                            label={key}
                                                            value={value}
                                                            isMultiline={value.length > 60 || value.includes('\n')}
                                                            onChange={(v) => handleKeyChange(key, v)}
                                                            onBlur={() => commitBufferedValue(key)}
                                                            onDelete={() => {
                                                                setTranslation((p) => {
                                                                    const c = { ...p! };
                                                                    delete c[key];
                                                                    return c;
                                                                });
                                                                delete inputBufferRef.current[key];
                                                                setIsDirty(true);
                                                            }}
                                                        />
                                                    ))}
                                                </BlockStack>
                                            </div>

                                            <Box paddingBlock="200">
                                                <Divider />

                                                <Box paddingBlockStart="200">
                                                    <BlockStack gap="200">
                                                        {/* Auto Translation Section */}
                                                        <Card>
                                                            <BlockStack>
                                                                <Text as="h2" variant="headingMd">
                                                                    Auto Translations
                                                                </Text>

                                                                <BlockStack gap="100">
                                                                    <Checkbox
                                                                        label="Enable auto-translation for new keys"
                                                                        checked={autoTranslate}
                                                                        onChange={(v) => setAutoTranslate(v)}
                                                                    />

                                                                    <Banner tone="warning">
                                                                        <Text as="p">If <strong>Auto Translate</strong> is on, the "Key Name" will be used as the source text for translation.</Text>
                                                                    </Banner>
                                                                </BlockStack>
                                                            </BlockStack>
                                                        </Card>
                                                        {/* Key Management Section */}
                                                        <AddRootContent onAddKey={addRootKey} />
                                                    </BlockStack>
                                                </Box>
                                            </Box>

                                            {/* Scroll buttons */}
                                            <div style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <Button
                                                    icon={ArrowUpIcon}
                                                    onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                                    accessibilityLabel="Scroll to top"
                                                    variant="secondary"
                                                    size="slim"
                                                />
                                                <Button
                                                    icon={ArrowDownIcon}
                                                    onClick={() => scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' })}
                                                    accessibilityLabel="Scroll to bottom"
                                                    variant="secondary"
                                                    size="slim"
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </BlockStack>
                        ) : (
                            <Box padding="1200" minHeight="200px">
                                <BlockStack gap="200" align="center" inlineAlign="center">
                                    <Text as="h2" variant="headingLg" tone="subdued" alignment="center">
                                        Select a language
                                    </Text>
                                    <Text as="p" tone="subdued" alignment="center">
                                        Choose a language from the list on the left to start editing translations.
                                    </Text>
                                </BlockStack>
                            </Box>
                        )}
                    </Card>
                </InlineGrid>

                <Modal
                    open={confirmModalActive}
                    onClose={toggleModal}
                    title="Confirm Changes"
                    primaryAction={{
                        content: 'Save Updates',
                        onAction: () => {
                            handleSubmitChanges();
                            setConfirmModalActive(false);
                        },
                        loading: fetcher.state === 'submitting'
                    }}
                    secondaryActions={[{ content: 'Cancel', onAction: toggleModal }]}
                >
                    <Modal.Section>
                        <Text as="p">
                            Are you sure you want to update the translations for <strong>{selectedNode?.language.jsonValue}</strong>? This action cannot be undone immediately.
                        </Text>
                    </Modal.Section>
                </Modal>

                {toastMessage && (
                    <Toast content={toastMessage} duration={2000} onDismiss={() => setToastMessage(null)} error={toastMessage.toLowerCase().includes('already') || toastMessage.toLowerCase().includes('error')} />
                )}

                {successToast && (
                    <Toast content="Changes saved successfully" duration={2000} onDismiss={() => setSuccessToast(false)} />
                )}

            </Page>
        </Frame >
    );
}
