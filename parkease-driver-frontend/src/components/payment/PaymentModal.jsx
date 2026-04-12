import { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, Banknote, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPayment } from '../../api/paymentApi';
import { formatCurrency } from '../../utils/formatCurrency';

// ── Payment modes ─────────────────────────────────────────────────────────────
const PAYMENT_MODES = [
  {
    mode: 'UPI',
    label: 'UPI',
    desc: 'GPay, PhonePe, Paytm',
    icon: Smartphone,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    activeColor: 'border-purple-500 bg-purple-50',
  },
  {
    mode: 'CARD',
    label: 'Card',
    desc: 'Credit / Debit',
    icon: CreditCard,
    color: 'text-[#3D52A0] bg-[#EDE8F5] border-[#ADBBDA]',
    activeColor: 'border-[#3D52A0] bg-[#EDE8F5]',
  },
  {
    mode: 'WALLET',
    label: 'Wallet',
    desc: 'Paytm, Amazon Pay',
    icon: Wallet,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    activeColor: 'border-amber-500 bg-amber-50',
  },
  {
    mode: 'CASH',
    label: 'Cash',
    desc: 'Pay at counter',
    icon: Banknote,
    color: 'text-green-600 bg-green-50 border-green-200',
    activeColor: 'border-green-500 bg-green-50',
  },
];

export default function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  totalAmount,
  lotName,
  onSuccess,
}) {
  const [selectedMode, setSelectedMode] = useState('UPI');
  const [loading,      setLoading]      = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await createPayment({
        bookingId,
        amount:      totalAmount,
        mode:        selectedMode,
        description: `Parking fee for ${lotName ?? 'parking lot'}`,
      });
      toast.success('Payment successful! 🎉');
      onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg ?? 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
                 p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md 
                   animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="bg-hero-gradient p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black">Complete Payment</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/70 hover:text-white 
                         hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 
                          border border-white/20">
            <p className="text-white/70 text-xs font-medium mb-1">
              Total Amount Due
            </p>
            <p className="text-4xl font-black text-white">
              {formatCurrency(totalAmount)}
            </p>
            {lotName && (
              <p className="text-white/60 text-xs mt-2 truncate">
                {lotName}
              </p>
            )}
          </div>
        </div>

        {/* ── Payment modes ─────────────────────────────────────────────── */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-bold text-[#3D52A0]">
            Select Payment Method
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_MODES.map(
              ({ mode, label, desc, icon: Icon, color, activeColor }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={`flex items-center gap-3 p-4 rounded-2xl 
                              border-2 text-left transition-all duration-200
                              ${selectedMode === mode
                                ? `${activeColor} border-2 shadow-sm`
                                : 'border-[#ADBBDA] hover:border-[#7091E6] bg-white'
                              }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center 
                                  justify-center flex-shrink-0 border ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate
                                  ${selectedMode === mode
                                    ? 'text-[#3D52A0]' : 'text-gray-700'
                                  }`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-[#8697C4] truncate">
                      {desc}
                    </p>
                  </div>
                  {selectedMode === mode && (
                    <CheckCircle2 className="w-4 h-4 text-[#3D52A0] 
                                            ml-auto flex-shrink-0" />
                  )}
                </button>
              )
            )}
          </div>

          {/* Mock notice */}
          <div className="bg-[#EDE8F5] rounded-xl px-4 py-3 
                          flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <p className="text-xs text-[#8697C4] leading-relaxed">
              This is a <strong className="text-[#3D52A0]">mock payment</strong>.
              No real transaction occurs. Select any mode and confirm.
            </p>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="btn-primary w-full flex items-center 
                       justify-center gap-2 py-3.5 text-base"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Pay {formatCurrency(totalAmount)} via {selectedMode}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}