import { Radio, WifiOff } from 'lucide-react';
export default function LiveBadge({ status }: { status: string }) {
  const on = status === 'SUBSCRIBED';
  return (
    <span className={`nb-tag ${on ? '!bg-lime-300' : '!bg-red-300'}`} title={on ? 'Terhubung ke realtime' : `Realtime: ${status}`}>
      {on ? <Radio size={14} strokeWidth={3} className="animate-pulse" /> : <WifiOff size={14} strokeWidth={3} />}
      {on ? 'Live' : 'Offline'}
    </span>
  );
}
