import { useState, useEffect, useCallback } from "react";
import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useFetcher, useNavigate } from "react-router";
import {
    Page,
    Layout,
    Card,
    Button,
    IndexTable,
    Modal,
    Text,
    FormLayout,
    Toast,
    InlineStack,
    EmptyState,
    Frame,
    Autocomplete,
    Icon,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon, SearchIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { AUTHORS_QUERY } from "../query/translationQuery";
import {
    createMetaobject,
    deleteMetaobject,
    hasMetaobjectDefinition,
    createMetaobjectDefinition,
} from "../utils/transaltionUpdate";
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";

type Definition = {
    id: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
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

        if (intent === "create") {
            const locale = formData.get("locale") as string;
            const language = formData.get("language") as string;
            await createMetaobject(admin, { locale, language });
            return { success: true, message: "Language definition created" };
        }

        // if (intent === "update") {
        //     const id = formData.get("id") as string;
        //     const locale = formData.get("locale") as string;
        //     const language = formData.get("language") as string;
        //     await updateMetaobjectFields(admin, id, { locale, language });
        //     return { success: true, message: "Language definition updated" };
        // }

        if (intent === "delete") {
            const id = formData.get("id") as string;
            await deleteMetaobject(admin, id);
            return { success: true, message: "Language definition deleted" };
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
    const [isEdit, setIsEdit] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [languageName, setLanguageName] = useState("");
    const [localeCode, setLocaleCode] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toastContent, setToastContent] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
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
        if (fetcher.state === "idle" && fetcher.data) {
            if (fetcher.data.success) {
                setToastContent(fetcher.data.message);
                setIsError(false);
                closeModal();
                setDeleteId(null);
            } else if (fetcher.data.error) {
                setToastContent(fetcher.data.error);
                setIsError(true);
            }
        }
    }, [fetcher.state, fetcher.data]);

    const handleEdit = (def: Definition) => {
        setIsEdit(true);
        setActiveId(def.id);
        setLanguageName(def.language.jsonValue);
        setLocaleCode(def.locale.jsonValue);
        const match = LANGUAGES.find(l => l.code === def.locale.jsonValue);
        setInputValue(match ? `${match.label} (${match.code})` : def.locale.jsonValue);
        setOptions(getOptions(""));
        setModalOpen(true);
    };

    const handleCreate = () => {
        setIsEdit(false);
        setActiveId(null);
        setLanguageName("");
        setLocaleCode("");
        setInputValue("");
        setOptions(getOptions(""));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setIsEdit(false);
        setActiveId(null);
        setLanguageName("");
        setLocaleCode("");
        setInputValue("");
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
        const formData = {
            intent: isEdit ? "update" : "create",
            language: languageName,
            locale: localeCode,
            ...(isEdit && { id: activeId })
        };
        fetcher.submit(formData, { method: "post" });
    };

    const resourceName = {
        singular: 'language',
        plural: 'languages',
    };

    const rowMarkup = definitions.map(
        ({ id, language, locale }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {language.jsonValue}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{locale.jsonValue}</IndexTable.Cell>
                <IndexTable.Cell>
                    <InlineStack gap="200">
                        {/* <Button icon={EditIcon} onClick={() => handleEdit({ id, language, locale })} variant="plain" /> */}
                        <Button icon={DeleteIcon} tone="critical" onClick={() => handleDelete(id)} variant="plain" />
                    </InlineStack>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

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
            >
                <Layout>
                    <Layout.Section>
                        <Card padding="0">
                            {definitions.length > 0 ? (
                                <IndexTable
                                    resourceName={resourceName}
                                    itemCount={definitions.length}
                                    headings={[
                                        { title: 'Language' },
                                        { title: 'Locale' },
                                        { title: 'Remove' },
                                    ]}
                                    selectable={false}
                                >
                                    {rowMarkup}
                                </IndexTable>
                            ) : (
                                <EmptyState
                                    heading="No languages defined"
                                    // action={{ content: 'Add Definition', onAction: handleCreate }}
                                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                                >
                                    <p>Define supported languages and locales for your application.</p>
                                </EmptyState>
                            )}
                        </Card>
                    </Layout.Section>
                </Layout>


                <Modal
                    open={modalOpen}
                    onClose={closeModal}
                    title={isEdit ? "Edit Language" : "Add Language"}
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
                                <Text as="p">
                                    Are you sure you want to delete the language{" "}
                                    <Text as="span" fontWeight="bold">
                                        {def?.language?.jsonValue} ({def?.locale?.jsonValue})
                                    </Text>
                                    ?
                                </Text>
                            );
                        })()}
                    </Modal.Section>
                </Modal>

                {toastContent && (
                    <Toast
                        content={toastContent}
                        error={isError}
                        onDismiss={() => setToastContent(null)}
                    />
                )}
            </Page>
        </Frame>
    );
}
