import { Modal, Text, BlockStack, List } from "@shopify/polaris";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddDefinitionInstructionsModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How to Add Language Definitions"
      primaryAction={{
        content: "Got it",
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="300">
          <Text as="p" variant="bodyMd">
            Follow these steps to create and manage language definitions:
          </Text>

          <List type="number">
            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Add Language
                </Text>{" "}
                to create a new language definition.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Select the{" "}
                <Text as="span" fontWeight="semibold">
                  language
                </Text>{" "}
                you want to create.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Choose one of the available options:
                <List type="bullet">
                  <List.Item>
                    <Text as="span">
                      <Text as="span" fontWeight="semibold">
                        Skip &amp; Create
                      </Text>{" "}
                      creates an empty language definition without adding any
                      translation keys.
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text as="span">
                      <Text as="span" fontWeight="semibold">
                        Sync &amp; Create
                      </Text>{" "}
                      copies only the existing translation keys from another
                      language into the selected language.
                    </Text>
                  </List.Item>
                </List>
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                If you choose{" "}
                <Text as="span" fontWeight="semibold">
                  Sync &amp; Create
                </Text>
                , a{" "}
                <Text as="span" fontWeight="semibold">
                  preview popup
                </Text>{" "}
                will appear, allowing you to review the synced keys before saving.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                After the language is created, you can click the {" "}
                <Text as="span" fontWeight="semibold">
                  preview
                </Text>{" "}
                button to view the language.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                To delete a language definition, click the{" "}
                <Text as="span" fontWeight="semibold">
                  Remove
                </Text>{" "}and confirm.
              </Text>
            </List.Item>
          </List>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export function SingleLanguageInstructionsModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How to Remove Tags"
      primaryAction={{
        content: "Got it",
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="300">
          <Text as="p" variant="bodyMd">
            Follow these steps to manage your language translations:
          </Text>

          <List type="number">
            <List.Item>
              <Text as="span">
                Select the{" "}
                <Text as="span" fontWeight="semibold">
                  language
                </Text>{" "}
                whose translations you want to manage.
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                Add a{" "}
                <Text as="span" fontWeight="semibold">
                  translation key
                </Text>{" "}
                and click{" "}
                <Text as="span" fontWeight="semibold">
                  +Add Key
                </Text>{" "}
                then manage their translation.
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                You can add up to{" "}
                <Text as="span" fontWeight="semibold">
                  200 new keys
                </Text>{" "}
                at a time.
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                Use the{" "}
                <Text as="span" fontWeight="semibold">
                  Search bar
                </Text>{" "}
                to quickly find translation and key.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Edit existing translations or remove translation keys as needed.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Export
                </Text>{" "}
                to download all translations for the current language in{" "}
                <Text as="span" fontWeight="semibold">
                  CSV format
                </Text>.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Use{" "}
                <Text as="span" fontWeight="semibold">
                  Sync Translation Keys
                </Text>{" "}
                to sync missing keys from another language.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Import
                </Text>{" "}
                and choose one of the available options:
                <List type="bullet">
                  <List.Item>
                    <Text as="span">
                      <Text as="span" fontWeight="semibold">
                        Add Keys Only
                      </Text>{" "}
                      imports only the translation keys.
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text as="span">
                      <Text as="span" fontWeight="semibold">
                        Add Keys with Translations
                      </Text>{" "}
                      imports both the translation keys and their translations.
                    </Text>
                  </List.Item>
                </List>
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                Use the{" "}
                <Text as="span" fontWeight="semibold">
                  Translated
                </Text>{" "}
                and{" "}
                <Text as="span" fontWeight="semibold">
                  Not Translated
                </Text>{" "}
                filters to find entries quickly.
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Auto Translation
                </Text>{" "}
                to automatically generate translations for unsaved keys that have blank or missing translations.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Save
                </Text>{" "}
                to save your changes, or click{" "}
                <Text as="span" fontWeight="semibold">
                  Discard
                </Text>{" "}
                to cancel all unsaved changes.
              </Text>
            </List.Item>
          </List>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export function MultiLanguageInstructionsModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How to Manage Multiple Languages"
      primaryAction={{
        content: "Got it",
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="300">
          <Text as="p" variant="bodyMd">
            Follow these steps to manage translations across multiple languages:
          </Text>

          <List type="number">
            <List.Item>
              <Text as="span">
                Select the{" "}
                <Text as="span" fontWeight="semibold">
                  languages
                </Text>{" "}
                in which you want to add translation keys.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Enter a{" "}
                <Text as="span" fontWeight="semibold">
                  key name
                </Text>{" "}
                and click{" "}
                <Text as="span" fontWeight="semibold">
                  Add Key
                </Text>{" "}
                for the selected languages.
              </Text>
            </List.Item>
            <List.Item>
              <Text as="span">
                You can add up to{" "}
                <Text as="span" fontWeight="semibold">
                  200 keys
                </Text>{" "}
                at a time. If multiple languages are selected, this limit is divided equally among all selected languages.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                You can also import translation keys using the{" "}
                <Text as="span" fontWeight="semibold">
                  Import
                </Text>{" "}
                button with a{" "}
                <Text as="span" fontWeight="semibold">
                  CSV file
                </Text>.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Click{" "}
                <Text as="span" fontWeight="semibold">
                  Auto Translation
                </Text>{" "}
                to automatically generate translations for all keys in the selected languages.
              </Text>
            </List.Item>

            <List.Item>
              <Text as="span">
                Once everything is complete, click{" "}
                <Text as="span" fontWeight="semibold">
                  Preview
                </Text>{" "}
                to review the changes.
              </Text>
            </List.Item>
          </List>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}