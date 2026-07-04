import { useState, useEffect, useCallback, useRef } from "react";
import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useFetcher, useNavigate } from "react-router";
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
import { authenticate } from "../shopify.server";
import { AUTHORS_QUERY } from "../query/translationQuery";
import {
    createMetaobject,
    deleteMetaobject,
    hasMetaobjectDefinition,
    createMetaobjectDefinition,
    fetchMetaobjectById,
    updateMetaobjectTranslation
} from "../utils/transaltionUpdate";
import { flattenObject } from "../utils/csvSyncUtils";
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";
import { batchTranslateText } from "../utils/googleTranslate";
import { AddDefinitionInstructionsModal } from "app/component/InstructionsModal";
import { RouteErrorBoundary } from "app/component/RouteErrorBoundary";

type Definition = {
    id: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
    total_translations?: { value: string };
};

export const LANGUAGES = [
    { label: "Afrikaans", code: "af" },
    { label: "Albanian", code: "sq" },
    { label: "Amharic", code: "am" },
    { label: "Arabic", code: "ar" },
    { label: "Armenian", code: "hy" },
    { label: "Assamese", code: "as" },
    { label: "Azerbaijani", code: "az" },
    { label: "Basque", code: "eu" },
    { label: "Bengali", code: "bn" },
    { label: "Bulgarian", code: "bg" },
    { label: "Burmese", code: "my" },
    { label: "Catalan", code: "ca" },
    { label: "Cherokee", code: "chr" },
    { label: "Chinese (Hong Kong)", code: "zh-HK" },
    { label: "Chinese (Simplified)", code: "zh-CN" },
    { label: "Chinese (Traditional)", code: "zh-TW" },
    { label: "Croatian", code: "hr" },
    { label: "Czech", code: "cs" },
    { label: "Danish", code: "da" },
    { label: "Dutch", code: "nl" },
    { label: "English (UK)", code: "en-GB" },
    { label: "English (US)", code: "en" },
    { label: "Estonian", code: "et" },
    { label: "Filipino", code: "fil" },
    { label: "Finnish", code: "fi" },
    { label: "French", code: "fr" },
    { label: "French (Canada)", code: "fr-CA" },
    { label: "Galician", code: "gl" },
    { label: "Georgian", code: "ka" },
    { label: "German", code: "de" },
    { label: "Greek", code: "el" },
    { label: "Gujarati", code: "gu" },
    { label: "Hebrew", code: "iw" },
    { label: "Hindi", code: "hi" },
    { label: "Hungarian", code: "hu" },
    { label: "Icelandic", code: "is" },
    { label: "Indonesian", code: "id" },
    { label: "Irish", code: "ga" },
    { label: "Italian", code: "it" },
    { label: "Japanese", code: "ja" },
    { label: "Kannada", code: "kn" },
    { label: "Kazakh", code: "kk" },
    { label: "Khmer", code: "km" },
    { label: "Korean", code: "ko" },
    { label: "Lao", code: "lo" },
    { label: "Latvian", code: "lv" },
    { label: "Lithuanian", code: "lt" },
    { label: "Macedonian", code: "mk" },
    { label: "Malay", code: "ms" },
    { label: "Malayalam", code: "ml" },
    { label: "Marathi", code: "mr" },
    { label: "Mongolian", code: "mn" },
    { label: "Nepali", code: "ne" },
    { label: "Norwegian", code: "no" },
    { label: "Odia", code: "or" },
    { label: "Persian", code: "fa" },
    { label: "Polish", code: "pl" },
    { label: "Portuguese (Brazil)", code: "pt-BR" },
    { label: "Portuguese (Portugal)", code: "pt-PT" },
    { label: "Punjabi", code: "pa" },
    { label: "Romanian", code: "ro" },
    { label: "Russian", code: "ru" },
    { label: "Serbian", code: "sr" },
    { label: "Sinhala", code: "si" },
    { label: "Slovak", code: "sk" },
    { label: "Slovenian", code: "sl" },
    { label: "Spanish", code: "es" },
    { label: "Spanish (Latin America)", code: "es-419" },
    { label: "Swahili", code: "sw" },
    { label: "Swedish", code: "sv" },
    { label: "Tamil", code: "ta" },
    { label: "Telugu", code: "te" },
    { label: "Thai", code: "th" },
    { label: "Turkish", code: "tr" },
    { label: "Ukrainian", code: "uk" },
    { label: "Urdu", code: "ur" },
    { label: "Uzbek", code: "uz" },
    { label: "Vietnamese", code: "vi" },
    { label: "Welsh", code: "cy" },
    { label: "Zulu", code: "zu" }
];

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin } = await authenticate.admin(request);

    const hasDef = await hasMetaobjectDefinition(admin);
    if (!hasDef) {
        return { definitions: [], hasDefinition: false };
    }

    const response = await admin.graphql(AUTHORS_QUERY);
    const json = await response.json();

    return {
        definitions: (json.data?.metaobjects?.nodes || []) as Definition[],
        hasDefinition: true,
    };
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "create_definition") {
            await createMetaobjectDefinition(admin);
            return { success: true, message: "Definition created successfully" };
        }

        if (intent === "get_keys") {
            const syncSourceId = formData.get("syncSourceId") as string;
            const sourceMetaobject = await fetchMetaobjectById(admin, syncSourceId);
            const flatSource = flattenObject(sourceMetaobject.translation?.jsonValue ?? {});
            const keys = Object.keys(flatSource);
            return { success: true, keys };
        }

        if (intent === "create") {
            const locale = formData.get("locale") as string;
            const language = formData.get("language") as string;
            const syncSourceId = formData.get("syncSourceId") as string | null;
            const autoTranslate = formData.get("autoTranslate") === "true";

            let createdKeys: string[] = [];
            let finalTranslation: Record<string, string> = {};
            const translationsStr = formData.get("translations") as string | null;

            if (syncSourceId) {
                const sourceMetaobject = await fetchMetaobjectById(admin, syncSourceId);
                const flatSource = flattenObject(sourceMetaobject.translation?.jsonValue ?? {});
                createdKeys = Object.keys(flatSource);

                if (translationsStr) {
                    try {
                        finalTranslation = JSON.parse(translationsStr);
                    } catch (e) {
                        console.error("Failed to parse translations string", e);
                        for (const key of createdKeys) {
                            finalTranslation[key] = "";
                        }
                    }
                } else if (autoTranslate && createdKeys.length > 0) {
                    try {
                        const translations = await batchTranslateText(createdKeys, locale);
                        for (const key of createdKeys) {
                            finalTranslation[key] = translations[key] || "";
                        }
                    } catch (e) {
                        console.error("Auto translate during sync failed", e);
                        for (const key of createdKeys) {
                            finalTranslation[key] = "";
                        }
                    }
                } else {
                    for (const key of createdKeys) {
                        finalTranslation[key] = "";
                    }
                }

                const metaobject = await createMetaobject(admin, { locale, language });
                await updateMetaobjectTranslation(admin, metaobject.id, finalTranslation);
                return {
                    success: true,
                    message: "Language definition created",
                    intent: "create",
                    id: metaobject.id,
                    keys: createdKeys,
                    translations: finalTranslation,
                    language,
                    locale
                };
            } else {
                const metaobject = await createMetaobject(admin, { locale, language });
                return {
                    success: true,
                    message: "Language definition created",
                    intent: "create",
                    id: metaobject.id,
                    keys: [],
                    translations: {},
                    language,
                    locale
                };
            }
        }

        if (intent === "delete") {
            const id = formData.get("id") as string;
            const res = await admin.graphql(AUTHORS_QUERY);
            const json = await res.json();
            const nodes = (json.data?.metaobjects?.nodes || []) as Definition[];
            const def = nodes.find((d) => d.id === id);
            const deletedLangName = def?.language?.jsonValue || "Language";
            const deletedLocaleCode = def?.locale?.jsonValue || "";

            await deleteMetaobject(admin, id);
            return {
                success: true,
                message: "Language definition deleted",
                intent: "delete",
                deletedLanguageName: deletedLangName,
                deletedLocaleCode: deletedLocaleCode
            };
        }
    } catch (error: any) {
        return { error: error.message };
    }
    return { error: "Unknown intent" };
}

export default function AppDefinition() {
    const { definitions, hasDefinition } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
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



    if (!hasDefinition) {
        return <TranslationDefinitionMissing />;
    }

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
                    content: "Add Definition",
                    icon: PlusIcon,
                    onAction: handleCreate
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
                    <Layout.Section>
                        <Card padding="0">
                            {definitions.length > 0 ? (
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
                                            maxHeight: definitions.length > 10 ? "500px" : "auto",
                                            overflowY: definitions.length > 10 ? "auto" : "initial"
                                        }}
                                    >
                                        {definitions.map(({ id, language, locale }) => (
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
                                        <Text as="h2" variant="headingLg" alignment="center">No languages defined</Text>
                                        <Text as="p" tone="subdued" alignment="center">
                                            Define supported languages and locales for your application.
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

                            const checkboxLabel = (
                                <Tooltip
                                    content={
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
                                    }
                                >
                                    <InlineStack gap="100" blockAlign="center">
                                        <Text as="span">Auto translation in {languageName}</Text>
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
                                                previewKeys.map(key => (
                                                    <Text as="p" key={key}>• {key}</Text>
                                                ))
                                            ) : (
                                                <Text as="p" tone="subdued">No keys found in this language.</Text>
                                            )}
                                        </BlockStack>
                                    </div>
                                    <Box paddingBlockStart="200">
                                        <Checkbox
                                            label={checkboxLabel}
                                            checked={autoTranslateChecked}
                                            onChange={setAutoTranslateChecked}
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
                                        background="bg-surface-warning-subdued"
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
                    small
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
            </Page>
        </Frame>
    );
}


export function ErrorBoundary() {
    return <RouteErrorBoundary routeName="Translation Definition" />;
}
