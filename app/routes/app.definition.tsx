import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData } from "react-router";
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
import { RouteErrorBoundary } from "app/component/RouteErrorBoundary";
import AppDefinition from "app/component/AppDefinition";

type Definition = {
    id: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
    total_translations?: { value: string };
};


export async function loader({ request }: LoaderFunctionArgs) {
    try {
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
    } catch (error) {
        console.error("Error in app.definition loader:", error);
        throw error;
    }
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

export default function AppDefinitionPage() {
    const { hasDefinition } = useLoaderData<typeof loader>();
    if (!hasDefinition) {
        return <TranslationDefinitionMissing pagename="Manage Definitions" />;
    }
    return <AppDefinition />;
}

export function ErrorBoundary() {
    return <RouteErrorBoundary routeName="Translation Definition" />;
}
