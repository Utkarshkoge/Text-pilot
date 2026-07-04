import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { useLoaderData } from 'react-router';
import { AUTHORS_QUERY } from '../query/translationQuery';
import { fetchMetaobjectById, updateMetaobjectTranslation, hasMetaobjectDefinition } from '../utils/transaltionUpdate';
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";
import { RouteErrorBoundary } from 'app/component/RouteErrorBoundary';
import MultiLanguageUpdate from 'app/component/MultiLanguageUpdate';

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
    try {
        const { admin } = await authenticate.admin(request);
        const hasDef = await hasMetaobjectDefinition(admin);
        if (!hasDef) {
            return { nodes: [], hasDefinition: false };
        }
        const res = await admin.graphql(AUTHORS_QUERY);
        const json = await res.json();
        const nodes = json.data?.metaobjects?.nodes || [];
        return { nodes, hasDefinition: true };
    } catch (error) {
        console.error("Error in app.multi_lang loader:", error);
        throw error;
    }
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
            if (!metaobjectId) return { error: 'Missing metaobject ID', metaobjectId };
            // updates is already flat and translated by the client!
            const updates: Record<string, string> = updatesRaw ? JSON.parse(updatesRaw) : {};
            const metaobject = await fetchMetaobjectById(admin, metaobjectId);
            const currentTranslation = flattenObject(metaobject.translation?.jsonValue ?? {});
            delete currentTranslation["__keys_order__"];

            const finalTranslation = { ...currentTranslation, ...updates };

            const finalResult = await updateMetaobjectTranslation(admin, metaobjectId, finalTranslation);
            return { success: true, metaobjectId, finalTranslation: finalResult.translation?.jsonValue };
        }
        return { error: 'Unknown operation', metaobjectId };
    } catch (error: any) {
        console.error('Action error:', error);
        return { error: error.message, metaobjectId };
    }
}

export default function MultiLanguageUpdatePage() {
    const { hasDefinition } = useLoaderData<typeof loader>();
    if (!hasDefinition) {
        return <TranslationDefinitionMissing pagename="Multiple languages" />;
    }
    return <MultiLanguageUpdate />;
}

export function ErrorBoundary() {
    return <RouteErrorBoundary routeName="Translation Multi Language" />;
}
