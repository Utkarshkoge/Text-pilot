import { useState } from 'react';
import { Modal, Text, Button } from '@shopify/polaris';
import { ExportIcon } from '@shopify/polaris-icons';
import { encodeCsvCell } from '../../utils/csvSyncUtils';

interface CsvExportButtonProps {
    translation: Record<string, string> | null;
    filename?: string;
}

export function CsvExportButton({ translation, filename = 'translations' }: CsvExportButtonProps) {
    const [downloadModalActive, setDownloadModalActive] = useState(false);

    const handleDownloadCSV = () => {
        if (!translation) return;
        let csv = "Key,Translation\n";
        for (const [key, value] of Object.entries(translation)) {
            csv += `${encodeCsvCell(key)},${encodeCsvCell(value)}\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_translation.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadModalActive(false);
    };

    if (!translation) return null;

    return (
        <>
            <Button icon={ExportIcon} onClick={() => setDownloadModalActive(true)}>
                Export
            </Button>

            <Modal
                open={downloadModalActive}
                onClose={() => setDownloadModalActive(false)}
                title="Export Translations"
                primaryAction={{
                    content: 'Download CSV',
                    onAction: handleDownloadCSV,
                }}
                secondaryActions={[{ content: 'Cancel', onAction: () => setDownloadModalActive(false) }]}
            >
                <Modal.Section>
                    <Text as="p">
                        Do you want to download the translations in a CSV file?
                    </Text>
                </Modal.Section>
            </Modal>
        </>
    );
}
