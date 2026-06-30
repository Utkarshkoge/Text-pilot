import { METAOBJECT_BY_ID_QUERY, METAOBJECT_UPDATE_MUTATION, METAOBJECT_CREATE_MUTATION, METAOBJECT_DELETE_MUTATION, METAOBJECT_UPDATE_FIELDS_MUTATION, METAOBJECT_DEFINITION_QUERY, METAOBJECT_DEFINITION_CREATE_MUTATION } from "../query/translationQuery";

export async function fetchMetaobjectById(
    admin: any,
    metaobjectId: string
) {
    if (!metaobjectId) {
        throw new Response('Missing metaobject id', { status: 400 });
    }

    const res = await admin.graphql(METAOBJECT_BY_ID_QUERY, {
        variables: { id: metaobjectId },
    });

    const json = await res.json();
    const metaobject = json.data?.metaobject;

    if (!metaobject) {
        throw new Response('Metaobject not found', { status: 404 });
    }

    return metaobject;
}

export async function updateMetaobjectTranslation(
    admin: any,
    metaobjectId: string,
    translation: Record<string, any>
) {
    if (!metaobjectId) {
        throw new Error('Missing metaobjectId');
    }

    const res = await admin.graphql(
        METAOBJECT_UPDATE_MUTATION,
        {
            variables: {
                id: metaobjectId,
                value: JSON.stringify(translation),
                total: String(Object.keys(translation).length),
            },
        }
    );

    const json = await res.json();
    const result = json.data?.metaobjectUpdate;

    if (!result) {
        throw new Error('Metaobject update failed');
    }

    if (result.userErrors?.length) {
        throw new Error(
            result.userErrors.map((e: any) => e.message).join(', ')
        );
    }

    return result.metaobject;
}

export async function createMetaobject(
    admin: any,
    { locale, language }: { locale: string; language: string }
) {
    const res = await admin.graphql(METAOBJECT_CREATE_MUTATION, {
        variables: { locale, language },
    });

    const json = await res.json();
    const result = json.data?.metaobjectCreate;

    if (!result) {
        throw new Error('Metaobject creation failed');
    }

    if (result.userErrors?.length) {
        throw new Error(
            result.userErrors.map((e: any) => e.message).join(', ')
        );
    }

    return result.metaobject;
}

export async function deleteMetaobject(admin: any, id: string) {
    if (!id) throw new Error('Missing ID');

    const res = await admin.graphql(METAOBJECT_DELETE_MUTATION, {
        variables: { id },
    });

    const json = await res.json();
    const result = json.data?.metaobjectDelete;

    if (!result) {
        throw new Error('Metaobject deletion failed');
    }

    if (result.userErrors?.length) {
        throw new Error(
            result.userErrors.map((e: any) => e.message).join(', ')
        );
    }

    return result.deletedId;
}

export async function updateMetaobjectFields(
    admin: any,
    id: string,
    { locale, language }: { locale: string; language: string }
) {
    if (!id) throw new Error('Missing ID');

    const res = await admin.graphql(METAOBJECT_UPDATE_FIELDS_MUTATION, {
        variables: { id, locale, language },
    });

    const json = await res.json();
    const result = json.data?.metaobjectUpdate;

    if (!result) {
        throw new Error('Metaobject update failed');
    }

    if (result.userErrors?.length) {
        throw new Error(
            result.userErrors.map((e: any) => e.message).join(', ')
        );
    }

    return result.metaobject;
}

export async function hasMetaobjectDefinition(admin: any) {
    const res = await admin.graphql(METAOBJECT_DEFINITION_QUERY, {
        variables: { type: "_text_pilot_app" },
    });
    const json = await res.json();
    return !!json.data?.metaobjectDefinitionByType;
}

export async function createMetaobjectDefinition(admin: any) {
    const res = await admin.graphql(METAOBJECT_DEFINITION_CREATE_MUTATION);
    const json = await res.json();
    const result = json.data?.metaobjectDefinitionCreate;

    if (!result) {
        throw new Error('Definition creation failed');
    }

    if (result.userErrors?.length) {
        throw new Error(
            result.userErrors.map((e: any) => e.message).join(', ')
        );
    }

    return result.metaobjectDefinition;
}
