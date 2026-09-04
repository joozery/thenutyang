import { CheckCircle, AlertCircle, X } from 'lucide-react';

export function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-sm font-bold text-white transition-all transform animate-in slide-in-from-bottom-5 ${ok ? 'bg-slate-900' : 'bg-red-500'}`}>
      {ok ? <CheckCircle size={20} className="text-green-400" /> : <AlertCircle size={20} />}
      {msg}
      <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 bg-white/10 p-1 rounded-lg transition-colors"><X size={16} /></button>
    </div>
  );
}
