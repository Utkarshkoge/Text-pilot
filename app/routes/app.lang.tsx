import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { useLoaderData } from 'react-router';
import { AUTHORS_QUERY } from '../query/translationQuery';
import { fetchMetaobjectById, updateMetaobjectTranslation, hasMetaobjectDefinition } from '../utils/transaltionUpdate';
import { TranslationDefinitionMissing } from "../component/TranslationDefinitionMissing";
import { flattenObject } from '../utils/csvSyncUtils';
import { RouteErrorBoundary } from 'app/component/RouteErrorBoundary';
import { SingleLanguageUpdate } from 'app/component/SingleLanguageUpdate';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
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
    } catch (error) {
        console.error("Error in app.lang loader:", error);
        throw error;
    }
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
        return { error: error.message || "An unexpected error occurred." };
    }
}

export default function SingleLanguageUpdatePage() {
    const { hasDefinition } = useLoaderData<typeof loader>();

    if (!hasDefinition) {
        return <TranslationDefinitionMissing pagename="Single language" />;
    }

    return <SingleLanguageUpdate />;
}

export function ErrorBoundary() {
    return <RouteErrorBoundary routeName="Single Language Page" />;
}
