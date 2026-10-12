import { CONFIDENCE_LABEL } from '../engine/labels';
import type { Recurring } from '../engine/types';
import { initial, monogramColor } from './monogram';

export function Monogram({ name }: { name: string }) {
  return (
    <span className="mono-badge" style={{ background: monogramColor(name) }} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

export function Confidence({ value }: { value: Recurring['confidence'] }) {
  return <span className={`conf conf-${value}`}>{CONFIDENCE_LABEL[value]}</span>;
}

export function Tags({ item }: { item: Recurring }) {
  return (
    <>
      {item.status === 'stopped' && <span className="tag tag-stopped">Stopped</span>}
      {item.forgotten && item.status === 'active' && <span className="tag tag-forgotten">Easy to forget</span>}
      {item.priceChanges.length > 0 && item.status === 'active' && <span className="tag tag-price">Price changed</span>}
    </>
  );
}
