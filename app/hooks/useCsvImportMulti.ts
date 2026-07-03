import { useState, useRef, useCallback } from 'react';
import { parseCsv } from '../utils/csvSyncUtils';

export type CsvPreviewItem = {
    index: number;
    key: string;
    translation: string;
    status: 'New' | 'Duplicate';
};

export type ImportMode = 'keys_only' | 'keys_with_translation' | null;

interface UseCsvImportProps {
    currentTranslation: Record<string, string> | null;
    onImportConfirm: (updates: Record<string, string>) => void;
    maxEntries?: number;
}

export function useCsvImport({ currentTranslation, onImportConfirm, maxEntries }: UseCsvImportProps) {
    const [importModalActive, setImportModalActive] = useState(false);
    const [importMode, setImportMode] = useState<ImportMode>(null);
    const [previewModalActive, setPreviewModalActive] = useState(false);
    const [csvPreviewData, setCsvPreviewData] = useState<CsvPreviewItem[]>([]);
    const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([]);
    const [csvPreviewFilter, setCsvPreviewFilter] = useState<'valid' | 'duplicate'>('valid');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const openImportModal = useCallback(() => setImportModalActive(true), []);
    const closeImportModal = useCallback(() => setImportModalActive(false), []);
    const closePreviewModal = useCallback(() => setPreviewModalActive(false), []);

    const processCsvText = useCallback((text: string, mode: ImportMode) => {
        if (!mode) return;

        const rows = parseCsv(text);
        const errors: string[] = [];
        const preview: CsvPreviewItem[] = [];
        const seenKeys = new Set<string>();

        if (rows.length === 0) {
            errors.push('The CSV file is empty.');
            setCsvValidationErrors(errors);
            setPreviewModalActive(true);
            setImportModalActive(false);
            return;
        }

        const headerRow = rows[0].map(h => h.trim().toLowerCase());
        const keyIndex = headerRow.indexOf('key');
        const translationIndex = headerRow.indexOf('translation');

        if (keyIndex === -1) {
            errors.push('Missing required column: Key');
        }
        if (mode === 'keys_with_translation' && translationIndex === -1) {
            errors.push('Missing required column: Translation');
        }

        if (errors.length === 0) {
            let totalEntries = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
                    continue;
                }
                const key = row[keyIndex] ? row[keyIndex].trim() : '';
                if (key) {
                    totalEntries++;
                }
            }

            const limit = maxEntries !== undefined ? maxEntries : 200;
            if (totalEntries > limit) {
                errors.push(`The CSV file contains ${totalEntries} entries, which exceeds the maximum limit of ${limit} entries allowed.`);
            }
        }

        if (errors.length === 0) {
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
                    continue;
                }

                const key = row[keyIndex] ? row[keyIndex].trim() : '';
                const trans = (translationIndex !== -1 && row[translationIndex]) ? row[translationIndex].trim() : '';

                if (!key) continue;

                let isCsvDuplicate = seenKeys.has(key);
                if (mode === 'keys_only' && currentTranslation && currentTranslation[key] !== undefined) {
                    isCsvDuplicate = true;
                }

                seenKeys.add(key);

                preview.push({
                    index: i,
                    key,
                    translation: mode === 'keys_only' ? '' : trans,
                    status: isCsvDuplicate ? 'Duplicate' : 'New'
                });
            }
        }

        setCsvValidationErrors(errors);
        setCsvPreviewData(preview);
        const hasDup = preview.some(item => item.status === 'Duplicate');
        setCsvPreviewFilter(hasDup ? 'duplicate' : 'valid');
        setPreviewModalActive(true);
        setImportModalActive(false);
    }, [currentTranslation, maxEntries]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !importMode) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            processCsvText(text, importMode);
        };
        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [importMode, processCsvText]);

    const handleConfirmImport = useCallback(() => {
        const updates: Record<string, string> = {};
        csvPreviewData.forEach(item => {
            if (item.status === 'Duplicate') return;
            updates[item.key] = item.translation;
        });

        onImportConfirm(updates);
        setPreviewModalActive(false);
        setCsvPreviewData([]);
    }, [csvPreviewData, onImportConfirm]);

    const triggerFileInput = useCallback((mode: ImportMode) => {
        setImportMode(mode);
        setTimeout(() => fileInputRef.current?.click(), 0);
    }, []);

    return {
        importModalActive,
        importMode,
        previewModalActive,
        csvPreviewData,
        csvValidationErrors,
        csvPreviewFilter,
        fileInputRef,
        openImportModal,
        closeImportModal,
        closePreviewModal,
        setCsvPreviewFilter,
        handleFileSelect,
        handleConfirmImport,
        triggerFileInput
    };
}
