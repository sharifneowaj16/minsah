'use client';

// ─────────────────────────────────────────────────────────────────────────────
// GiftRequestButton — product page-এ "আমাকে গিফট করো" button
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Gift, Share2, X, Check } from 'lucide-react';

interface GiftRequestButtonProps {
  productId: string;
  productName: string;
  variantId?: string | null;
}

export function GiftRequestButton({ productId, productName, variantId }: GiftRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ giftUrl: string; waUrl: string; fbUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!senderName.trim() || !recipientName.trim()) {
      alert('তোমার নাম ও বন্ধুর নাম দাও');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/gift/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, senderName, recipientName, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Gift link তৈরি হয়নি');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNativeShare = async () => {
    if (!result) return;
    if (navigator.share) {
      await navigator.share({
        title: `${recipientName}-এর জন্য গিফট`,
        text: `${senderName} তোমাকে "${productName}" গিফট করতে চায়!`,
        url: result.giftUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.giftUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-[#D4B896] text-[#3D1F0E] text-sm font-medium hover:bg-[#F5E9DC] transition active:scale-95"
      >
        <Gift size={15} />
        আমাকে এটা গিফট করো
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-[#FDF8F3] rounded-t-3xl w-full max-w-md p-5 pb-8 animate-slide-up">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1A0D06] flex items-center gap-2">
                <Gift size={16} className="text-[#3D1F0E]" />
                গিফট লিংক তৈরি করো
              </h3>
              <button onClick={() => setOpen(false)} className="text-[#8B5E3C]">
                <X size={18} />
              </button>
            </div>

            {!result ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#6B4226] font-medium mb-1">তোমার নাম *</label>
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="তোমার নাম লেখো"
                    className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6B4226] font-medium mb-1">যাকে গিফট করবে *</label>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="বন্ধু / পরিবারের নাম"
                    className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6B4226] font-medium mb-1">বিশেষ বার্তা (optional)</label>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="যেমন: তোমার জন্মদিনে শুভেচ্ছা!"
                    className="w-full px-3 py-2.5 border border-[#D4B896] rounded-xl text-sm focus:outline-none focus:border-[#3D1F0E] bg-white"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-3 bg-[#3D1F0E] text-[#F5E6D3] rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Gift size={14} /> লিংক তৈরি করো</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-green-700">লিংক তৈরি হয়েছে!</p>
                  <p className="text-xs text-green-600 mt-0.5 break-all">{result.giftUrl}</p>
                </div>

                {/* Share options */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={result.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-semibold"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a
                    href={result.fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#1877F2] text-white rounded-xl text-xs font-semibold"
                  >
                    Facebook
                  </a>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleNativeShare}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#D4B896] rounded-xl text-xs font-medium text-[#3D1F0E]"
                  >
                    <Share2 size={13} /> শেয়ার করো
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#D4B896] rounded-xl text-xs font-medium text-[#3D1F0E]"
                  >
                    {copied ? <><Check size={13} /> কপি হয়েছে!</> : 'লিংক কপি'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShareButton — Web Share API দিয়ে product share করো
// ─────────────────────────────────────────────────────────────────────────────

interface ShareButtonProps {
  productName: string;
  productUrl: string;
  image?: string;
}

export function ShareButton({ productName, productUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: productName, url: productUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs text-[#8B5E3C] hover:text-[#3D1F0E] transition py-1"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Share2 size={13} />}
      {copied ? 'কপি হয়েছে!' : 'শেয়ার'}
    </button>
  );
}
