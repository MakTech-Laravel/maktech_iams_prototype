/* Profile photo picker — ported from profilePhotoBlockHtml() + wireProfilePhotoInput() in
   public/prototype/js/ui.js, with the 3MB cap and both validation toasts kept verbatim.
   Demo-only: the chosen image is read as a data URL and held in memory.

   Shared by all three panels, since the prototype called the same ui.js helper from the admin
   My Profile modal and both portals' profile screens. `inputId` / `previewId` carry the prototype's
   own element ids so each caller keeps its original DOM.

   This lives in its own module rather than in lib/ui.jsx because it needs useUi() for the toasts,
   and UiProvider already imports from lib/ui.jsx — putting it there would close an import cycle. */

import { Avatar, Icon } from './ui';
import { useUi } from './UiProvider';

export default function ProfilePhotoBlock({
    name,
    photo,
    inputId = 'profilePhotoInput',
    previewId = 'profilePhotoPreview',
    onPhoto,
    onRemove,
}) {
    const { toast } = useUi();

    const handleFile = (event) => {
        const input = event.target;
        const file = input.files && input.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast('Please choose an image file', 'error');
            input.value = '';

            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            toast('Image is too large — 3MB max for this demo', 'error');
            input.value = '';

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            onPhoto(reader.result);
            input.value = '';
        };

        reader.readAsDataURL(file);
    };

    return (
        <>
            <Avatar name={name} size="lg" photo={photo} id={previewId} style={{ margin: '0 auto' }} />
            <div className="flex-gap" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <Icon name="upload" /> Change Photo
                    <input type="file" accept="image/*" id={inputId} style={{ display: 'none' }} onChange={handleFile} />
                </label>
                {photo ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>
                        <Icon name="close" /> Remove
                    </button>
                ) : null}
            </div>
        </>
    );
}
