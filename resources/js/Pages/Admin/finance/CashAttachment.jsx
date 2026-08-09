/* Proof photo / scan attachments for cash deposits & handovers — ported from
   attachmentUploadFieldHtml(), attachmentPreviewHtml(), renderCashAttachmentPreview() and
   wireAttachmentInput() in public/prototype/js/render-finance.js.

   The prototype parked the chosen file in a module-level `pendingCashAttachment` until the form
   was actually saved; here the same value lives in the handover modal's React state and is mirrored
   onto the shared draft object the footer's save button reads. */

import { useRef } from 'react';
import { Icon } from '../../../lib/ui';

export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function AttachmentPreview({ attachment, removable, onRemove }) {
    if (!attachment) {
        return null;
    }

    const isImg = (attachment.mime || '').startsWith('image/');

    return (
        <div className="attach-preview">
            {isImg ? (
                <img src={attachment.dataUrl} alt="attachment preview" />
            ) : (
                <div className="attach-file-ic">
                    <Icon name="file" />
                </div>
            )}
            <div className="attach-meta">
                <b>{attachment.name}</b>
                <span>{isImg ? 'Image' : 'Document'} attached</span>
            </div>
            {removable ? (
                <button type="button" className="icon-btn sm danger" title="Remove attachment" onClick={onRemove}>
                    <Icon name="close" />
                </button>
            ) : null}
        </div>
    );
}

export function AttachmentUploadField({ inputId, attachment, onChange, onError }) {
    const inputRef = useRef(null);

    const pick = (event) => {
        const file = event.target.files && event.target.files[0];

        if (!file) {
            return;
        }

        if (file.size > MAX_ATTACHMENT_BYTES) {
            onError('File is too large — 4MB max for this demo', 'error');
            event.target.value = '';

            return;
        }

        const reader = new FileReader();
        reader.onload = () => onChange({ name: file.name, mime: file.type || 'application/octet-stream', dataUrl: reader.result });
        reader.readAsDataURL(file);
    };

    const remove = () => {
        onChange(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="field span-2">
            <label>Attachment — deposit slip, receipt photo or screenshot (optional)</label>
            <div>
                <AttachmentPreview attachment={attachment} removable onRemove={remove} />
            </div>
            <label className="upload-dropzone" htmlFor={inputId}>
                <Icon name="upload" />
                <span>Click to upload a photo, screenshot or PDF (max 4MB)</span>
            </label>
            <input ref={inputRef} type="file" id={inputId} accept="image/*,.pdf" style={{ display: 'none' }} onChange={pick} />
        </div>
    );
}

/* viewCashAttachmentModal() — body of the "Attached Document" modal. */
export function CashAttachmentBody({ attachment }) {
    const isImg = (attachment.mime || '').startsWith('image/');

    if (isImg) {
        return (
            <div style={{ textAlign: 'center' }}>
                <img src={attachment.dataUrl} alt={attachment.name} style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--gray-200)' }} />
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Icon name="file" />
            <p className="muted" style={{ marginTop: 10 }}>
                {attachment.name}
            </p>
            <a className="btn btn-outline btn-sm" href={attachment.dataUrl} download={attachment.name} style={{ marginTop: 6 }}>
                <Icon name="download" /> Download / Open PDF
            </a>
        </div>
    );
}
