export const AUTHORS_QUERY = `#graphql
  query Authors {
    metaobjects(type: "_text_pilot_app", first: 250, reverse:true) {
      nodes {
        id
        locale: field(key: "locale") {
          jsonValue
        }
        language: field(key: "language") {
          jsonValue
        }
        total_translations: field(key: "total_translations") {
          value
        }
      }
    }
  }
`;

export const METAOBJECT_BY_ID_QUERY = `#graphql
  query MetaobjectById($id: ID!) {
    metaobject(id: $id) {
      handle
      translation: field(key: "Translation") {
        jsonValue
      }
    }
  }
`;

export const METAOBJECT_UPDATE_MUTATION = `
        mutation UpdateMetaobjectTranslation($id: ID!, $value: String!, $total: String!) {
          metaobjectUpdate(
            id: $id
            metaobject: {
              fields: [
                { key: "Translation", value: $value },
                { key: "total_translations", value: $total }
              ]
            }
          ) {
            metaobject {
              id
              translation: field(key: "Translation") { jsonValue }
            }
            userErrors {
              field
              message
              code
            }
          }
        }
`;

export const METAOBJECT_CREATE_MUTATION = `#graphql
  mutation CreateMetaobject($locale: String!, $language: String!) {
    metaobjectCreate(metaobject: {
      type: "_text_pilot_app",
      fields: [
        { key: "locale", value: $locale },
        { key: "language", value: $language },
        { key: "Translation", value: "{}" },
        { key: "total_translations", value: "0" }
      ]
    }) {
      metaobject {
        id
        handle
        locale: field(key: "locale") { jsonValue }
        language: field(key: "language") { jsonValue }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const METAOBJECT_DELETE_MUTATION = `#graphql
  mutation DeleteMetaobject($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const METAOBJECT_UPDATE_FIELDS_MUTATION = `#graphql
  mutation UpdateMetaobjectFields($id: ID!, $locale: String!, $language: String!) {
    metaobjectUpdate(id: $id, metaobject: {
      fields: [
        { key: "locale", value: $locale },
        { key: "language", value: $language }
      ]
    }) {
      metaobject {
        id
        locale: field(key: "locale") { jsonValue }
        language: field(key: "language") { jsonValue }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const METAOBJECT_DEFINITION_QUERY = `#graphql
  query MetaobjectDefinitionByType($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
    }
  }
`;

export const METAOBJECT_DEFINITION_CREATE_MUTATION = `#graphql
  mutation CreateMetaobjectDefinition {
    metaobjectDefinitionCreate(
      definition: {
        name: "Text Pilot App"
        type: "_text_pilot_app"
        displayNameKey: "locale"
        fieldDefinitions: [
          { key: "locale", name: "Locale", type: "single_line_text_field" },
          { key: "language", name: "Language", type: "single_line_text_field" },
          { key: "Translation", name: "Translation", type: "json" },
          { key: "total_translations", name: "Total Translations", type: "number_integer" }
        ]
      }
    ) {
      metaobjectDefinition {
        id
        type
        displayNameKey
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;