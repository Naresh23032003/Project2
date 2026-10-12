import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

type Props = { onFiles: (files: File[]) => void; onSample: () => void; compact?: boolean };

const ACCEPT = '.csv,.xls,.xlsx,.pdf,.txt,.tsv';

export function DropZone({ onFiles, onSample, compact }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    if (list && list.length > 0) onFiles(Array.from(list));
  };

  return (
    <div
      className="dropzone"
      data-over={over}
      data-testid="dropzone"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        input.current?.click();
      }}
    >
      <FileUp className="icon-lg" aria-hidden="true" />
      <div>
        <p className="dropzone-title">{compact ? 'Add more statements' : 'Drop statements here'}</p>
        <p className="hint">CSV, Excel and PDF files work. Several at once is fine.</p>
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        multiple
        accept={ACCEPT}
        aria-label="Choose statement files"
        data-testid="file-input"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="dropzone-actions">
        <button type="button" className="btn btn-secondary" onClick={() => input.current?.click()}>
          Choose files
        </button>
        {!compact && (
          <button type="button" className="btn btn-primary" onClick={onSample} data-testid="sample-button">
            Try with sample data
          </button>
        )}
      </div>
    </div>
  );
}
