/* Receipt preview modal — ported from receiptPreviewModal() in the prototype's ui.js.
   The sheet itself and the print window come from lib/Receipt.jsx. */

import { PaymentReceipt, printPaymentReceipt } from '../../../lib/Receipt';
import { Icon } from '../../../lib/ui';
import { useUi } from '../../../lib/UiProvider';

export function useReceiptPreview() {
    const { openModal, closeModal, toast } = useUi();

    return (paymentId) =>
        openModal({
            size: 'lg',
            title: 'Payment Receipt',
            sub: 'Review, then print or hand a physical copy to the student',
            body: <PaymentReceipt paymentId={paymentId} />,
            foot: (
                <>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => printPaymentReceipt(paymentId, toast)}>
                        <Icon name="printer" /> Print Receipt
                    </button>
                </>
            ),
        });
}
