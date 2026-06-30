import { authenticate } from "./app/shopify.server";

export async function check(request: Request) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query {
      metaobjects(type: "translation_apply", first: 1) {
        nodes {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  `);
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
}
