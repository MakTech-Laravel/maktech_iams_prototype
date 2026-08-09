/* The finance screens use a bare empty-state block (icon + paragraph) rather than the
   titled <EmptyState> in lib/ui.jsx — ported from dueTableHtml / cashHandoverTableHtml /
   collectResultsHtml in public/prototype/js/render-finance.js. */

import { Icon } from '../../../lib/ui';

export default function FinanceEmpty({ icon = 'checkCircle', message, style }) {
    return (
        <div className="empty-state" style={style}>
            <Icon name={icon} />
            <p>{message}</p>
        </div>
    );
}
