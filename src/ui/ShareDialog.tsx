import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { canvasToBlob, drawShareCard, type ShareData } from './shareCard';

type Props = { open: boolean; onClose: () => void; data: ShareData; names: string; hasNames: boolean };

export function ShareDialog({ open, onClose, data, names, hasNames }: Props) {
  const [withNames, setWithNames] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let made: string | null = null;
    const c = (canvas.current ??= document.createElement('canvas'));
    void drawShareCard(c, { ...data, names: withNames ? names : undefined })
      .then(() => canvasToBlob(c))
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [open, withNames, data.headline, data.sub, names]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="share-title">
      <div className="modal-body" style={{ maxWidth: 640 }}>
        <h2 id="share-title">Share card</h2>
        <p>An image with only your totals. It's made on your device and nothing is posted anywhere.</p>
        {url ? <img className="share-preview" src={url} alt={`Share card. ${data.headline} ${data.sub}`} width={1200} height={630} /> : <p className="hint">Making the image</p>}
        {hasNames && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={withNames} onChange={(e) => setWithNames(e.target.checked)} style={{ width: 20, height: 20 }} />
            Include the names of the services
          </label>
        )}
        <div className="row-end">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Close</button>
          {url && (
            <a className="btn btn-primary" href={url} download="dripcheck-share.png" data-testid="share-download">
              Download image
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
