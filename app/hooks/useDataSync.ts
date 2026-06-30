import { useState, useCallback } from 'react';

export type SyncPreviewItem = {
    index: number;
    key: string;
    status: 'New' | 'Duplicate';
};

export type LanguageNode = {
    id: string;
    handle: string;
    locale: { jsonValue: string };
    language: { jsonValue: string };
    total_translations?: { value: string } | null;
};

interface UseDataSyncProps {
    currentTranslation: Record<string, string> | null;
    onSyncComplete: (updates: Record<string, string>) => void;
}

export function useDataSync({ currentTranslation, onSyncComplete }: UseDataSyncProps) {
    const [syncModalActive, setSyncModalActive] = useState(false);
    const [syncSourceLanguage, setSyncSourceLanguage] = useState<LanguageNode | null>(null);
    const [syncPreviewModalActive, setSyncPreviewModalActive] = useState(false);
    const [syncPreviewData, setSyncPreviewData] = useState<SyncPreviewItem[]>([]);
    const [syncPreviewFilter, setSyncPreviewFilter] = useState<'valid' | 'duplicate'>('valid');

    const openSyncModal = useCallback(() => setSyncModalActive(true), []);
    const closeSyncModal = useCallback(() => setSyncModalActive(false), []);
    const closeSyncPreviewModal = useCallback(() => setSyncPreviewModalActive(false), []);

    const selectSyncSource = useCallback((node: LanguageNode) => {
        setSyncSourceLanguage(node);
        // We don't close the modal yet, the parent will fetch and then call processSyncKeys
    }, []);

    const processSyncKeys = useCallback((sourceTranslation: Record<string, string>) => {
        if (!currentTranslation) return;

        const sourceKeys = Object.keys(sourceTranslation);
        const preview: SyncPreviewItem[] = [];
        const seenKeys = new Set<string>();

        for (let i = 0; i < sourceKeys.length; i++) {
            const key = sourceKeys[i];
            
            const isSystemDuplicate = currentTranslation[key] !== undefined;
            const isSourceDuplicate = seenKeys.has(key);
            
            seenKeys.add(key);

            preview.push({
                index: i,
                key,
                status: (isSystemDuplicate || isSourceDuplicate) ? 'Duplicate' : 'New'
            });
        }

        setSyncPreviewData(preview);
        setSyncPreviewFilter('valid');
        setSyncModalActive(false);
        setSyncPreviewModalActive(true);
    }, [currentTranslation]);

    const handleConfirmSync = useCallback(() => {
        const updates: Record<string, string> = {};
        syncPreviewData.forEach(item => {
            if (item.status === 'Duplicate') return;
            updates[item.key] = ''; // Only adding keys, no translation
        });

        onSyncComplete(updates);
        setSyncPreviewModalActive(false);
        setSyncPreviewData([]);
        setSyncSourceLanguage(null);
    }, [syncPreviewData, onSyncComplete]);

    return {
        syncModalActive,
        syncSourceLanguage,
        syncPreviewModalActive,
        syncPreviewData,
        syncPreviewFilter,
        openSyncModal,
        closeSyncModal,
        closeSyncPreviewModal,
        setSyncPreviewFilter,
        selectSyncSource,
        processSyncKeys,
        handleConfirmSync
    };
}
