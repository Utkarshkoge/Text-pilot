import { useState, useEffect, useCallback, useRef } from "react";
import { useLoaderData, useFetcher, useNavigate, useOutletContext } from "react-router";
import {
    Page,
    Layout,
    Card,
    Button,
    Modal,
    Text,
    FormLayout,
    Toast,
    InlineStack,
    Frame,
    Autocomplete,
    Icon,
    Box,
    Select,
    BlockStack,
    Divider,
    Banner,
    Checkbox,
    Tooltip,
    ProgressBar,
    Spinner
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon, SearchIcon, InfoIcon } from "@shopify/polaris-icons";
import { AddDefinitionInstructionsModal } from "app/component/InstructionsModal";
import { loader } from 'app/routes/app.definition';
import { LANGUAGES } from "./Languages";



export default function AppDefinition() {
    const { definitions } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();
    const { subscription } = useOutletContext<{ subscription: any }>();
    console.log("Subscription status in AppDefinition:", subscription);

    const displayedDefinitions = (!subscription?.present && definitions?.length > 0)
        ? [definitions[0]]
        : (definitions || []);

    const [modalOpen, setModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [languageName, setLanguageName] = useState("");
    const [localeCode, setLocaleCode] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toastContent, setToastContent] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    // Sync Modal State
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [selectedSyncSource, setSelectedSyncSource] = useState("");
    const keysFetcher = useFetcher<any>();
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewKeys, setPreviewKeys] = useState<string[]>([]);
    const [autoTranslateChecked, setAutoTranslateChecked] = useState(false);
    const [successModalData, setSuccessModalData] = useState<{
        type: "create" | "delete";
        id?: string;
        language: string;
        locale: string;
        keys: string[];
        translations: Record<string, string>;
    } | null>(null);
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [submittingIntent, setSubmittingIntent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationProgress, setTranslationProgress] = useState<{ done: number, total: number } | null>(null);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const cancelRef = useRef(false);
    const isPausedRef = useRef(false);
    const resolvePauseRef = useRef<(() => void) | null>(null);

    const getOptions = useCallback((searchValue: string = "") => {
        const existingLocales = new Set(definitions.map(d => d.locale.jsonValue));
        const formatOption = (lang: typeof LANGUAGES[0]) => {
            const isAdded = existingLocales.has(lang.code);
            return {
                label: isAdded ? `${lang.label} (${lang.code}) - Already Added` : `${lang.label} (${lang.code})`,
                value: lang.code,
                disabled: isAdded
            };
        };

        if (searchValue === "") {
            return LANGUAGES.map(formatOption);
        }

        const filterRegex = new RegExp(searchValue, 'i');
        return LANGUAGES.filter(lang =>
            lang.label.match(filterRegex) || lang.code.match(filterRegex)
        ).map(formatOption);
    }, [definitions]);

    const [options, setOptions] = useState(() => getOptions(""));

    useEffect(() => {
        setOptions(getOptions(inputValue));
    }, [definitions, getOptions]);

    const updateText = useCallback((value: string) => {
        setInputValue(value);
        setOptions(getOptions(value));
    }, [getOptions]);

    const updateSelection = useCallback((selected: string[]) => {
        const selectedValue = selected[0];
        const matchedOption = LANGUAGES.find(lang => lang.code === selectedValue);

        if (matchedOption) {
            setInputValue(`${matchedOption.label} (${matchedOption.code})`);
            setLocaleCode(matchedOption.code);
            setLanguageName(matchedOption.label);
        } else {
            setInputValue(selectedValue || '');
            setLocaleCode(selectedValue || '');
            setLanguageName("");
        }
    }, []);

    // Monitor fetcher for success/error
    useEffect(() => {
        if (fetcher.state === "idle") {
            setSubmittingIntent(null);
            if (fetcher.data) {
                if (fetcher.data.success) {
                    const intent = fetcher.data.intent;
                    if (intent === "create") {
                        setSuccessModalData({
                            type: "create",
                            id: fetcher.data.id,
                            language: fetcher.data.language,
                            locale: fetcher.data.locale,
                            keys: fetcher.data.keys || [],
                            translations: fetcher.data.translations || {}
                        });
                    } else if (intent === "delete") {
                        setSuccessModalData({
                            type: "delete",
                            language: fetcher.data.deletedLanguageName,
                            locale: fetcher.data.deletedLocaleCode,
                            keys: [],
                            translations: {}
                        });
                    } else {
                        setToastContent(fetcher.data.message);
                    }
                    setIsError(false);
                    closeModal();
                    setDeleteId(null);
                    setSyncModalOpen(false);
                    setPreviewModalOpen(false);
                } else if (fetcher.data.error) {
                    setToastContent(fetcher.data.error);
                    setIsError(true);
                }
            }
        }
    }, [fetcher.state, fetcher.data]);

    // Monitor keysFetcher to load keys for preview
    useEffect(() => {
        if (keysFetcher.state === "idle" && keysFetcher.data) {
            if (keysFetcher.data.success && keysFetcher.data.keys) {
                setPreviewKeys(keysFetcher.data.keys);
                setSyncModalOpen(false);
                setPreviewModalOpen(true);
            } else if (keysFetcher.data.error) {
                setToastContent(keysFetcher.data.error);
                setIsError(true);
            }
        }
    }, [keysFetcher.state, keysFetcher.data]);

    const handleCreate = () => {
        const isSubscribed = subscription?.present || false;
        if (!isSubscribed && definitions.length >= 1) {
            setUpgradeModalOpen(true);
            return;
        }
        setLanguageName("");
        setLocaleCode("");
        setInputValue("");
        setOptions(getOptions(""));
        setModalOpen(true);
        setAutoTranslateChecked(false);
    };

    const closeModal = () => {
        setModalOpen(false);
        setLanguageName("");
        setLocaleCode("");
        setInputValue("");
        setAutoTranslateChecked(false);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const executeDelete = () => {
        if (deleteId) {
            fetcher.submit({ intent: "delete", id: deleteId }, { method: "post" });
        }
    };

    const handleSubmit = () => {
        const existingWithTranslations = definitions.filter(d => parseInt(d.total_translations?.value || "0", 10) > 0);

        if (existingWithTranslations.length > 0) {
            setSelectedSyncSource(existingWithTranslations[0].id);
            setSyncModalOpen(true);
            setModalOpen(false);
        } else {
            executeSubmit();
        }
    };

    const executeSubmit = async (syncSourceId?: string, autoTranslate?: boolean) => {
        const intent = "create";

        // Close background popups
        setModalOpen(false);
        setSyncModalOpen(false);
        setPreviewModalOpen(false);

        if (intent === "create" && autoTranslate && previewKeys.length > 0) {
            cancelRef.current = false;
            isPausedRef.current = false;
            resolvePauseRef.current = null;
            setSubmittingIntent("create");
            setIsTranslating(true);
            setTranslationProgress({ done: 0, total: previewKeys.length });

            const totalKeys = previewKeys.length;
            let keysDone = 0;
            const finalTranslation: Record<string, string> = {};
            const CHUNK_SIZE = 2;

            for (let i = 0; i < previewKeys.length; i += CHUNK_SIZE) {
                if (cancelRef.current) {
                    break;
                }

                if (isPausedRef.current) {
                    await new Promise<void>((resolve) => {
                        resolvePauseRef.current = resolve;
                    });
                }

                if (cancelRef.current) {
                    break;
                }

                const chunk = previewKeys.slice(i, i + CHUNK_SIZE).map(w => w.trim());
                try {
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ words: chunk, locale: localeCode })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (!data.error && data.translations) {
                            Object.assign(finalTranslation, data.translations);
                        }
                    }
                } catch (err) {
                    console.error("Client side translation chunk error:", err);
                }
                keysDone += chunk.length;
                setTranslationProgress({ done: Math.min(keysDone, totalKeys), total: totalKeys });
            }

            if (cancelRef.current) {
                setIsTranslating(false);
                setTranslationProgress(null);
                setSubmittingIntent(null);
                return;
            }

            // Fill in any missing keys with empty string
            for (const key of previewKeys) {
                if (finalTranslation[key] === undefined) {
                    finalTranslation[key] = "";
                }
            }

            setIsTranslating(false);
            setTranslationProgress(null);

            // Now submit final translations to the server action
            const formData = {
                intent,
                language: languageName,
                locale: localeCode,
                syncSourceId: syncSourceId || "",
                translations: JSON.stringify(finalTranslation)
            };
            fetcher.submit(formData, { method: "post" });
        } else {
            setSubmittingIntent(intent);
            const formData = {
                intent,
                language: languageName,
                locale: localeCode,
                ...(syncSourceId && { syncSourceId }),
                ...(autoTranslate !== undefined && { autoTranslate: String(autoTranslate) })
            };
            fetcher.submit(formData, { method: "post" });
        }
    };

    const textField = (
        <Autocomplete.TextField
            onChange={updateText}
            label="Language"
            value={inputValue}
            prefix={<Icon source={SearchIcon} tone="base" />}
            placeholder="Search for a language..."
            autoComplete="off"
        />
    );

    const syncOptions = definitions
        .filter(d => parseInt(d.total_translations?.value || "0", 10) > 0)
        .map(d => ({
            label: `${d.language.jsonValue} (${d.total_translations?.value} keys)`,
            value: d.id
        }));

    return (
        <Frame>
            <Page
                title="Manage Definitions"
                subtitle="Add supported languages for translations"
                backAction={{ content: "Home", onAction: () => navigate("/app") }}
                primaryAction={{
                    content: "Add Language",
                    icon: PlusIcon,
                    onAction: handleCreate,
                    disabled: !subscription?.present && definitions?.length >= 1
                }}
                secondaryActions={[
                    {
                        content: "Instructions",
                        onAction: () => setInstructionsOpen(true),
                    },
                ]}
            >
                <style>{`
                    .definition-row:hover {
                        background-color: var(--p-color-bg-surface-hover);
                    }
                `}</style>
                <Layout>
                    {!subscription?.present && definitions.length >= 1 && (
                        <Layout.Section>
                            <Banner
                                title="You have reached the Free Plan limit"
                                tone="warning"
                                action={{
                                    content: "Upgrade to Advance Plan",
                                    onAction: () => navigate("/app/billing/subscribe")
                                }}
                            >
                                <p>
                                    You can only add 1 language on the Free Plan. Upgrade to the Advance Plan ($5/month) to add unlimited languages.
                                </p>
                            </Banner>
                        </Layout.Section>
                    )}
                    <Layout.Section>
                        <Card padding="0">
                            {displayedDefinitions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Sticky Table Header */}
                                    <div style={{
                                        display: 'flex',
                                        padding: 'var(--p-space-300) var(--p-space-400)',
                                        borderBottom: '1px solid var(--p-color-border-subdued)',
                                        background: 'var(--p-color-bg-surface-secondary)',
                                    }}>
                                        <div style={{ flex: 2 }}>
                                            <Text as="span" variant="bodySm" fontWeight="bold" tone="subdued">Language</Text>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <Text as="span" variant="bodySm" fontWeight="bold" tone="subdued">Locale</Text>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: 'var(--p-space-200)' }}>
                                            <Text as="span" variant="bodySm" fontWeight="bold" tone="subdued">Remove</Text>
                                        </div>
                                    </div>
                                    {/* Scrollable Rows */}
                                    <div
                                        style={{
                                            maxHeight: displayedDefinitions.length > 10 ? "500px" : "auto",
                                            overflowY: displayedDefinitions.length > 10 ? "auto" : "initial"
                                        }}
                                    >
                                        {displayedDefinitions.map(({ id, language, locale }) => (
                                            <div
                                                key={id}
                                                className="definition-row"
                                                style={{
                                                    display: 'flex',
                                                    padding: 'var(--p-space-300) var(--p-space-400)',
                                                    borderBottom: '1px solid var(--p-color-border-subdued)',
                                                    alignItems: 'center',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <div style={{ flex: 2 }}>
                                                    <Text variant="bodyMd" fontWeight="bold" as="span">
                                                        {language.jsonValue}
                                                    </Text>
                                                </div>
                                                <div style={{ flex: 2 }}>
                                                    <Text variant="bodyMd" as="span">
                                                        {locale.jsonValue}
                                                    </Text>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        icon={DeleteIcon}
                                                        tone="critical"
                                                        onClick={() => handleDelete(id)}
                                                        variant="plain"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Box padding="800">
                                    <BlockStack gap="400" align="center" inlineAlign="center">
                                        <div style={{ maxWidth: '200px', margin: '0 auto' }}>
                                            <img src="/empty-state.png" alt="Empty State" style={{ width: '100%', display: 'block' }} />
                                        </div>
                                        <Text as="h2" variant="headingLg" alignment="center">Empty languages</Text>
                                        <Text as="p" tone="subdued" alignment="center">
                                            Please add supported languages for your application.
                                        </Text>
                                    </BlockStack>
                                </Box>
                            )}
                        </Card>
                    </Layout.Section>
                </Layout>

                <Modal
                    open={modalOpen}
                    onClose={closeModal}
                    title="Add Language"
                    primaryAction={{
                        content: "Save",
                        onAction: handleSubmit,
                        loading: fetcher.state === "submitting",
                        disabled: !localeCode
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: closeModal
                        }
                    ]}
                >
                    <Modal.Section>
                        <style>{`
                            .Polaris-Popover__Pane {
                                max-height: 220px !important;
                            }
                        `}</style>
                        <FormLayout>
                            <Autocomplete
                                options={options}
                                selected={[localeCode]}
                                onSelect={updateSelection}
                                textField={textField}
                                preferredPosition="below"
                            />
                        </FormLayout>
                    </Modal.Section>
                </Modal>

                <Modal
                    open={syncModalOpen}
                    onClose={() => {
                        setSyncModalOpen(false);
                        setModalOpen(true); // Re-open the main modal if they cancel sync
                    }}
                    title="Sync Translation Keys"
                    primaryAction={{
                        content: "Sync and Create",
                        onAction: () => {
                            if (selectedSyncSource) {
                                keysFetcher.submit(
                                    { intent: "get_keys", syncSourceId: selectedSyncSource },
                                    { method: "post" }
                                );
                            }
                        },
                        loading: keysFetcher.state === "submitting",
                        disabled: !selectedSyncSource
                    }}
                    secondaryActions={[
                        {
                            content: "Skip & Create Empty",
                            onAction: () => executeSubmit(),
                            disabled: fetcher.state === "submitting"
                        },
                        {
                            content: "Cancel",
                            onAction: () => {
                                setSyncModalOpen(false);
                                setModalOpen(true);
                            },
                            disabled: fetcher.state === "submitting"
                        }
                    ]}
                >
                    <Modal.Section>
                        <BlockStack gap="400">
                            <Text as="p">
                                Do you want to sync the translation keys from an existing language?
                                This will only copy the keys, not the translated values.
                            </Text>
                            <Select
                                label="Select language to sync from"
                                options={syncOptions}
                                value={selectedSyncSource}
                                onChange={setSelectedSyncSource}
                            />
                        </BlockStack>
                    </Modal.Section>
                </Modal>

                <Modal
                    open={previewModalOpen}
                    size="large"
                    onClose={() => {
                        setPreviewModalOpen(false);
                        setSyncModalOpen(true);
                    }}
                    title="Preview Synced Keys"
                    primaryAction={{
                        content: "Add Keys",
                        onAction: () => {
                            executeSubmit(selectedSyncSource, autoTranslateChecked);
                        },
                        loading: fetcher.state === "submitting"
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => {
                                setPreviewModalOpen(false);
                                setSyncModalOpen(true);
                            }
                        }
                    ]}
                >
                    <Modal.Section>
                        {(() => {
                            const sourceDef = definitions.find(d => d.id === selectedSyncSource);
                            const previewSourceLangName = sourceDef?.language?.jsonValue || "Source Language";
                            const isLimitExceeded = previewKeys.length > 200;
                            const checkboxLabel = (
                                <Tooltip
                                    content={
                                        isLimitExceeded ? (
                                            <BlockStack gap="100">
                                                <Text as="p" fontWeight="semibold">
                                                    Auto Translation Unavailable
                                                </Text>
                                                <Text as="p">
                                                    Auto translation is only available when syncing 200 or fewer keys. Currently syncing {previewKeys.length} keys.
                                                </Text>
                                            </BlockStack>
                                        ) : (
                                            <BlockStack gap="100">
                                                <Text as="p" fontWeight="semibold">
                                                    Auto Translation
                                                </Text>
                                                <Text as="p">
                                                    • Uses free translation services.
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
                                                <Text as="p">
                                                    • Always review translations before saving. You can also edit them later.
                                                </Text>
                                            </BlockStack>
                                        )
                                    }
                                >
                                    <InlineStack gap="100" blockAlign="center">
                                        <Text as="span" tone={isLimitExceeded ? "subdued" : undefined}>Auto translation in {languageName}</Text>
                                        <Icon source={InfoIcon} tone="subdued" />
                                    </InlineStack>
                                </Tooltip>
                            );

                            return (
                                <BlockStack gap="400">
                                    <Text as="p">
                                        The following <Text as="span" fontWeight="bold">{previewKeys.length}</Text> keys will be copied from <Text as="span" fontWeight="bold">{previewSourceLangName}</Text>:
                                    </Text>
                                    <div
                                        style={{
                                            maxHeight: "440px",
                                            overflowY: "auto",
                                            padding: "12px",
                                            backgroundColor: "var(--p-color-bg-surface-secondary)",
                                            borderRadius: "8px",
                                            border: "1px solid var(--p-color-border-subdued)"
                                        }}
                                    >
                                        <BlockStack gap="100">
                                            {previewKeys.length > 0 ? (
                                                previewKeys.map((key, index) => (
                                                    <Text as="p" key={index}>
                                                        {index + 1}. {key}
                                                    </Text>
                                                ))
                                            ) : (
                                                <Text as="p" tone="subdued">
                                                    No keys found in this language.
                                                </Text>
                                            )}
                                        </BlockStack>
                                    </div>
                                    <Box paddingBlockStart="200">
                                        <Checkbox
                                            label={checkboxLabel}
                                            checked={autoTranslateChecked && !isLimitExceeded}
                                            onChange={setAutoTranslateChecked}
                                            disabled={isLimitExceeded}
                                        />
                                    </Box>

                                </BlockStack>
                            );
                        })()}
                    </Modal.Section>
                </Modal>

                <Modal
                    open={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    title="Confirm Deletion"
                    primaryAction={{
                        content: 'Delete',
                        destructive: true,
                        onAction: executeDelete,
                        loading: fetcher.state === "submitting"
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: () => setDeleteId(null),
                        }
                    ]}
                >
                    <Modal.Section>
                        {(() => {
                            const def = definitions.find((d) => d.id === deleteId);
                            return (
                                <BlockStack gap="300">
                                    <Text as="p">
                                        Are you sure you want to delete{" "}
                                        <Text as="span" fontWeight="semibold">
                                            {def?.language?.jsonValue} ({def?.locale?.jsonValue})
                                        </Text>
                                        ?
                                    </Text>

                                    <Box
                                        background="bg-surface-warning"
                                        borderColor="border-warning"
                                        borderWidth="025"
                                        borderRadius="200"
                                        padding="300"
                                    >
                                        <BlockStack gap="100">
                                            {/* <Text as="p" fontWeight="semibold" tone="critical">
                                                Warning
                                            </Text> */}
                                            <Banner tone="critical">
                                                <Text as="p" fontWeight="semibold" tone="critical">
                                                    Warning
                                                </Text>
                                            </Banner>
                                            <Text as="p" tone="subdued">
                                                Deleting this language will permanently remove:
                                            </Text>

                                            <Box paddingInlineStart="300">
                                                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                                                    <li>All translation keys for this language</li>
                                                    <li>All translated values associated with those keys</li>
                                                </ul>
                                            </Box>
                                            <Divider />
                                            <Text as="p" tone="critical" fontWeight="medium">
                                                This action cannot be undone.
                                            </Text>
                                        </BlockStack>
                                    </Box>
                                </BlockStack>
                            );
                        })()}
                    </Modal.Section>
                </Modal>

                <Modal
                    open={submittingIntent === "create" && (isTranslating || fetcher.state !== "idle") && !showCancelConfirmModal}
                    onClose={() => { }}
                    title={isTranslating ? "Auto Translating Keys" : "Adding Language Definition"}
                    size="small"
                    secondaryActions={isTranslating ? [
                        {
                            content: "Cancel",
                            onAction: () => {
                                isPausedRef.current = true;
                                setShowCancelConfirmModal(true);
                            }
                        }
                    ] : []}
                >
                    <Modal.Section>
                        <BlockStack gap="400" align="center" inlineAlign="center">
                            <Spinner size="large" />
                            <Text as="h2" variant="headingMd" alignment="center">
                                {isTranslating && translationProgress
                                    ? `Translating ${translationProgress.done} of ${translationProgress.total} keys...`
                                    : "Creating language definition..."}
                            </Text>
                            {isTranslating && translationProgress && (
                                <div style={{ width: '100%' }}>
                                    {/* @ts-ignore */}
                                    <ProgressBar progress={Math.round((translationProgress.done / translationProgress.total) * 100)} />
                                </div>
                            )}
                        </BlockStack>
                    </Modal.Section>
                </Modal>

                <Modal
                    open={showCancelConfirmModal}
                    onClose={() => {
                        isPausedRef.current = false;
                        setShowCancelConfirmModal(false);
                        if (resolvePauseRef.current) {
                            resolvePauseRef.current();
                            resolvePauseRef.current = null;
                        }
                    }}
                    title="Confirm Cancellation"
                    primaryAction={{
                        content: "Yes, Cancel",
                        destructive: true,
                        onAction: () => {
                            cancelRef.current = true;
                            isPausedRef.current = false;
                            setShowCancelConfirmModal(false);
                            if (resolvePauseRef.current) {
                                resolvePauseRef.current();
                                resolvePauseRef.current = null;
                            }
                        }
                    }}
                    secondaryActions={[{
                        content: "No, Continue",
                        onAction: () => {
                            isPausedRef.current = false;
                            setShowCancelConfirmModal(false);
                            if (resolvePauseRef.current) {
                                resolvePauseRef.current();
                                resolvePauseRef.current = null;
                            }
                        }
                    }]}
                >
                    <Modal.Section>
                        <Text as="p">
                            Are you sure you want to cancel the auto-translation process?
                        </Text>
                    </Modal.Section>
                </Modal>

                <Modal
                    open={!!successModalData}
                    onClose={() => setSuccessModalData(null)}
                    title={successModalData?.type === "create" ? "Language Added Successfully" : "Language Deleted Successfully"}
                    primaryAction={
                        successModalData?.type === "create" ? {
                            content: "View & Translate",
                            onAction: () => navigate(`/app/lang`)
                        } : {
                            content: "Close",
                            onAction: () => setSuccessModalData(null)
                        }
                    }
                    secondaryActions={
                        successModalData?.type === "create" ? [
                            {
                                content: "Done",
                                onAction: () => setSuccessModalData(null)
                            }
                        ] : []
                    }
                >
                    <Modal.Section>
                        {successModalData && (
                            successModalData.type === "create" ? (
                                <BlockStack gap="300">
                                    <Text as="p">
                                        The language <Text as="span" fontWeight="bold">{successModalData.language} ({successModalData.locale})</Text> has been successfully added.
                                    </Text>
                                </BlockStack>
                            ) : (
                                <BlockStack gap="300">
                                    <Text as="p">
                                        The language <Text as="span" fontWeight="bold">{successModalData.language} ({successModalData.locale})</Text> has been successfully deleted.
                                    </Text>
                                </BlockStack>
                            )
                        )}
                    </Modal.Section>
                </Modal>

                {toastContent && (
                    <Toast
                        content={toastContent}
                        error={isError}
                        onDismiss={() => setToastContent(null)}
                    />
                )}

                <AddDefinitionInstructionsModal
                    open={instructionsOpen}
                    onClose={() => setInstructionsOpen(false)}
                />

                <Modal
                    open={upgradeModalOpen}
                    onClose={() => setUpgradeModalOpen(false)}
                    title="Upgrade to Advance Plan Required"
                    primaryAction={{
                        content: "Upgrade to Advance Plan",
                        onAction: () => {
                            setUpgradeModalOpen(false);
                            navigate("/app/billing/subscribe");
                        }
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => setUpgradeModalOpen(false)
                        }
                    ]}
                >
                    <Modal.Section>
                        <BlockStack gap="300">
                            <Text as="p">
                                To support multiple languages, you need to be on our <strong>Advance Plan</strong>.
                            </Text>
                            <Text as="p" tone="subdued">
                                Currently, you are on the Free Plan which allows only <strong>1 language definition</strong>. Upgrade today to add unlimited languages, translate them instantly, and reach customers worldwide.
                            </Text>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
            </Page>
        </Frame>
    );
}
