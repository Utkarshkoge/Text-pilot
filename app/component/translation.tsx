import { memo, useEffect, useState } from "react";
import { Button, TextField, Text, BlockStack, InlineStack, Card, Box } from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";


export const TranslationRow = memo(({
    label,
    value,
    onChange,
    onBlur,
    onDelete,
    isMultiline
}: {
    label: string,
    value: string,
    onChange: (v: string) => void,
    onBlur: () => void,
    onDelete: () => void,
    isMultiline: boolean
}) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync from parent (e.g. on undo or load)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
        onBlur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleBlur();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '40% 1fr', gap: '16px', alignItems: 'start', padding: '8px 0', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingTop: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                    <Text variant="bodyMd" fontWeight="bold" as="span">{label}</Text>
                </div>
                <div style={{ paddingTop: '4px' }}>
                    <Button
                        variant="plain"
                        tone="critical"
                        icon={DeleteIcon}
                        onClick={onDelete}
                    />
                </div>
            </div>
            <div onKeyDown={handleKeyDown} style={{ width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <TextField
                    label="Translation"
                    labelHidden
                    value={localValue}
                    onChange={setLocalValue}
                    onBlur={handleBlur}
                    autoComplete="off"
                    multiline={true}
                />
            </div>
        </div>
    );
});
TranslationRow.displayName = 'TranslationRow';

export const AddRootContent = memo(({ onAddKey }: { onAddKey: (k: string) => void }) => {
    const [key, setKey] = useState('');

    return (
        <Card background="bg-surface-secondary">
            <BlockStack gap="100">
                <Text variant="headingSm" as="h3">Add New Key</Text>
                <div onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && key.trim()) {
                        onAddKey(key.trim());
                        setKey('');
                    }
                }}>
                    <TextField
                        label=""
                        placeholder="e.g. welcome_message"
                        value={key}
                        onChange={setKey}
                        autoComplete="off"
                        connectedRight={
                            <Button icon={PlusIcon} onClick={() => {
                                if (key.trim()) {
                                    onAddKey(key.trim());
                                    setKey('');
                                }
                            }}>Add Key</Button>
                        }
                    />
                </div>
            </BlockStack>
        </Card>
    );
});
AddRootContent.displayName = 'AddRootContent';
