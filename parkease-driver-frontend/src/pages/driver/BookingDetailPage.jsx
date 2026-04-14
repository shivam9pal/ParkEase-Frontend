import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ChevronLeft, MapPin, Car, Clock, CreditCard,
  LogIn, LogOut, XCircle, CalendarClock,
  CheckCircle2, AlertTriangle, Download,
  Wallet, Hash, Info, FileText,
} from 'lucide-react';
import {
  getBookingById, checkIn, checkOut,
  cancelBooking, extendBooking,
} from '../../api/bookingApi';
import { getLotById }       from '../../api/lotApi';
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  initiateCashPayment,
  getMyPayments, 
  downloadReceipt 
} from '../../api/paymentApi';
import { formatDateTime, toBackendDateTime } from '../../utils/formatDateTime';
import { formatCurrency }   from '../../utils/formatCurrency';
import StatusBadge          from '../../components/booking/StatusBadge';
import FareTimer            from '../../components/booking/FareTimer';
import LoadingSpinner       from '../../components/common/LoadingSpinner';
import ErrorMessage         from '../../components/common/ErrorMessage';

// ── Extend schema ─────────────────────────────────────────────────────────────
const extendSchema = z.object({
  newEndTime: z.string().min(1, 'New end time is required'),
}).refine(
  (d) => new Date(d.newEndTime) > new Date(),
  { message: 'New end time must be in the future', path: ['newEndTime'] }
);

const VEHICLE_TYPE_LABEL = {
  TWO_WHEELER: '2-Wheeler', FOUR_WHEELER: '4-Wheeler', HEAVY: 'Heavy',
};

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [booking,       setBooking]       = useState(null);
  const [lot,           setLot]           = useState(null);
  const [payment,       setPayment]       = useState(null);
  const [paymentDone,   setPaymentDone]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [extendOpen,  setExtendOpen]  = useState(false);

  const [receiptLoading, setReceiptLoading] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors }, reset,
  } = useForm({ resolver: zodResolver(extendSchema) });

  const newEndTimeValue = watch('newEndTime');

  // ── Fetch booking + lot + payment ─────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const bookRes = await getBookingById(bookingId);
        const bk      = bookRes.data;
        setBooking(bk);

        // Fetch lot in background
        if (bk.lotId) {
          getLotById(bk.lotId)
            .then((r) => setLot(r.data))
            .catch(() => {});
        }

        // Fetch payment — find payment linked to this booking
        getMyPayments()
          .then((r) => {
            const linked = r.data.find((p) => p.bookingId === bookingId);
            if (linked) setPayment(linked);
          })
          .catch(() => {});

      } catch (err) {
        const status = err.response?.status;
        if (status === 404) setError('Booking not found.');
        else if (status === 403) setError('You do not have access to this booking.');
        else setError('Failed to load booking. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [bookingId]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAction = async (type) => {
    if (type === 'cancel') {
      if (!window.confirm('Are you sure you want to cancel this booking?'))
        return;
    }
    setActionLoading(type);
    try {
      let res;
      if (type === 'checkin')  res = await checkIn(bookingId);
      if (type === 'checkout') res = await checkOut(bookingId);
      if (type === 'cancel')   res = await cancelBooking(bookingId);
      setBooking(res.data);
      if (type === 'checkin')  toast.success('Checked in successfully! 🅿️');
      if (type === 'checkout') toast.success('Checked out! Please complete payment.');
      if (type === 'cancel')   toast.success('Booking cancelled.');
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Extend booking ────────────────────────────────────────────────────────
  const onExtendSubmit = async (data) => {
    setActionLoading('extend');
    try {
      const res = await extendBooking(
        bookingId,
        toBackendDateTime(data.newEndTime)
      );
      setBooking(res.data);
      toast.success('Booking extended successfully! 🕐');
      setExtendOpen(false);
      reset();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg ?? 'Extension failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Payment success callback ──────────────────────────────────────────────
  const handlePaymentSuccess = (paymentData) => {
    setPayment(paymentData);
    setPaymentDone(true);
  };

  // ── Download receipt ──────────────────────────────────────────────────────
  const handleDownloadReceipt = async () => {
    if (!payment?.paymentId) return;
    setReceiptLoading(true);
    try {
      const res  = await downloadReceipt(payment.paymentId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `receipt-${payment.paymentId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch {
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      setReceiptLoading(false);
    }
  };

  // ── Min new end time (must be > current endTime) ──────────────────────────
  const getMinExtendTime = () => {
    if (!booking?.endTime) return '';
    const d = new Date(booking.endTime);
    d.setMinutes(d.getMinutes() + 30);
    return d.toISOString().slice(0, 16);
  };

  // ── Extension duration estimate ───────────────────────────────────────────
  const getExtensionInfo = () => {
    if (!newEndTimeValue || !booking?.endTime) return null;
    const extraMs    = new Date(newEndTimeValue) - new Date(booking.endTime);
    if (extraMs <= 0) return null;
    const extraHours = extraMs / 3600000;
    const extraCost  = extraHours * (booking.pricePerHour ?? 0);
    return {
      hours: extraHours.toFixed(1),
      cost:  formatCurrency(extraCost),
    };
  };
  const extInfo = getExtensionInfo();

  if (loading) return <LoadingSpinner text="Loading booking details..." />;
  if (error)   return <ErrorMessage message={error} />;
  if (!booking) return <ErrorMessage message="Booking not found." />;

  const isCompleted = booking.status === 'COMPLETED';
  const isActive    = booking.status === 'ACTIVE';
  const isReserved  = booking.status === 'RESERVED';
  const isCancelled = booking.status === 'CANCELLED';
  const canExtend   = isReserved || isActive;
  const needsPayment = isCompleted && !payment;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Back ───────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold 
                   text-[#7091E6] hover:text-[#3D52A0] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Bookings
      </button>

      {/* ── Status Banner ─────────────────────────────────────────────── */}
      {needsPayment && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl 
                        p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">
              Payment Required
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your parking session has ended. 
              Please complete the payment to get your receipt.
            </p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="btn-primary text-sm py-2 px-4 flex-shrink-0"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* ── Header Card ───────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start 
                        sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-xl font-black text-[#3D52A0]">
                {lot?.name ?? 'Parking Lot'}
              </h1>
              <StatusBadge status={booking.status} />
              <span className="text-xs bg-[#EDE8F5] text-[#8697C4] 
                               font-semibold px-2.5 py-0.5 rounded-full">
                {booking.bookingType === 'WALK_IN' ? 'Walk-In' : 'Pre-Booked'}
              </span>
            </div>
            {lot && (
              <p className="text-sm text-[#8697C4] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {lot.address}, {lot.city}
              </p>
            )}
          </div>

          {/* Booking ID */}
          <div className="bg-[#EDE8F5] rounded-xl px-4 py-2.5 text-right 
                          flex-shrink-0">
            <p className="text-[10px] text-[#8697C4] font-medium uppercase 
                          tracking-wider">
              Booking ID
            </p>
            <p className="text-sm font-black text-[#3D52A0] font-mono">
              #{booking.bookingId.slice(-10).toUpperCase()}
            </p>
          </div>
        </div>

        {/* ── Info grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <DetailCell icon={Car}     label="Vehicle Plate"
            value={booking.vehiclePlate ?? '—'} />
          <DetailCell icon={Hash}    label="Vehicle Type"
            value={VEHICLE_TYPE_LABEL[booking.vehicleType] ?? '—'} />
          <DetailCell icon={CreditCard} label="Rate"
            value={`${formatCurrency(booking.pricePerHour)}/hr`} />
          <DetailCell icon={Clock}   label="Start Time"
            value={formatDateTime(booking.startTime)} />
          <DetailCell icon={Clock}   label="End Time"
            value={formatDateTime(booking.endTime)} />
          <DetailCell icon={Wallet}  label="Total Amount"
            value={
              booking.totalAmount != null
                ? formatCurrency(booking.totalAmount)
                : 'At checkout'
            }
            highlight={!!booking.totalAmount}
          />
          {booking.checkInTime && (
            <DetailCell icon={LogIn}  label="Check-In"
              value={formatDateTime(booking.checkInTime)} />
          )}
          {booking.checkOutTime && (
            <DetailCell icon={LogOut} label="Check-Out"
              value={formatDateTime(booking.checkOutTime)} />
          )}
          <DetailCell icon={Info}    label="Created"
            value={formatDateTime(booking.createdAt)} />
        </div>
      </div>

      {/* ── Live Fare Timer (ACTIVE) ───────────────────────────────────── */}
      {isActive && (
        <FareTimer
          bookingId={bookingId}
          checkInTime={booking.checkInTime}
        />
      )}
      {/* ── Payment Section (shows buttons for CASH or RAZORPAY) ────── */}
      {booking.status === 'COMPLETED' && !paymentDone && (
        <PaymentSection
          booking={booking}
          lotName={lot?.name || 'Parking Lot'}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {/* ── Payment Card ──────────────────────────────────────────────── */}
      {payment && (
        <div className={`card border-l-4 ${
          payment.status === 'PAID' 
            ? 'border-l-green-500' 
            : 'border-l-amber-500'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl 
                              flex items-center justify-center
                              ${
                                payment.status === 'PAID'
                                  ? 'bg-green-100'
                                  : 'bg-amber-100'
                              }`}>
                <CheckCircle2 className={`w-4 h-4 ${
                  payment.status === 'PAID'
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${
                  payment.status === 'PAID'
                    ? 'text-green-700'
                    : 'text-amber-700'
                }`}>
                  {payment.status === 'PAID' ? 'Payment Completed' : 'Payment Pending'}
                </p>
                <p className="text-xs text-[#8697C4]">
                  {payment.status === 'PAID' 
                    ? formatDateTime(payment.paidAt)
                    : 'Awaiting payment'}
                </p>
              </div>
            </div>
            <p className="text-xl font-black text-[#3D52A0]">
              {formatCurrency(payment.amount)}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <DetailCell icon={Hash}       label="Transaction ID"
              value={`#${payment.transactionId?.slice(-8) ?? '—'}`} />
            <DetailCell icon={CreditCard} label="Mode"
              value={payment.mode ?? '—'} />
            <DetailCell icon={Wallet}     label="Status"
              value={payment.status} />
            <DetailCell icon={FileText}   label="Currency"
              value={payment.currency ?? 'INR'} />
          </div>

          {payment.status === 'PAID' ? (
            <button
              onClick={handleDownloadReceipt}
              disabled={receiptLoading}
              className="btn-outline flex items-center gap-2 text-sm py-2"
            >
              {receiptLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-[#3D52A0]/30 border-t-[#3D52A0]" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Receipt (PDF)
            </button>
          ) : (
            <button
              onClick={() => setPaymentOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm py-2 w-full 
                         sm:w-auto justify-center"
            >
              <CreditCard className="w-4 h-4" />
              Pay Now
            </button>
          )}
        </div>
      )}

      {/* ── Lot Details Snapshot ──────────────────────────────────────── */}
      {lot && (
        <div className="card">
          <h2 className="text-base font-bold text-[#3D52A0] mb-3 
                         flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7091E6]" />
            Lot Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <DetailCell icon={MapPin} label="Address"
              value={`${lot.address}, ${lot.city}`} />
            <DetailCell icon={Clock}  label="Operating Hours"
              value={`${lot.openTime?.slice(0,5)} – ${lot.closeTime?.slice(0,5)}`} />
            <DetailCell icon={Car}    label="Total Spots"
              value={`${lot.availableSpots} free / ${lot.totalSpots}`} />
          </div>
        </div>
      )}

      {/* ── Action Buttons ────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="text-base font-bold text-[#3D52A0] mb-4">Actions</h2>

        {isCancelled && (
          <div className="flex items-center gap-3 bg-red-50 border 
                          border-red-200 rounded-xl p-4">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 font-medium">
              This booking has been cancelled.
            </p>
          </div>
        )}

        {isCompleted && !needsPayment && (
          <div className="flex items-center gap-3 bg-green-50 border 
                          border-green-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Parking session completed and paid. 
              Thank you for using ParkEase!
            </p>
          </div>
        )}

        {needsPayment && (
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="btn-primary flex items-center gap-2 py-3 w-full 
                       sm:w-auto justify-center text-base"
          >
            <CreditCard className="w-5 h-5" />
            Complete Payment — {formatCurrency(booking.totalAmount)}
          </button>
        )}

        <div className="flex flex-wrap gap-3 mt-3">
          {isReserved && (
            <>
              <ActionBtn
                icon={LogIn}
                label="Check In"
                loading={actionLoading === 'checkin'}
                onClick={() => handleAction('checkin')}
                variant="primary"
              />
              <ActionBtn
                icon={CalendarClock}
                label="Extend Booking"
                loading={false}
                onClick={() => { setExtendOpen(true); reset(); }}
                variant="outline"
              />
              <ActionBtn
                icon={XCircle}
                label="Cancel Booking"
                loading={actionLoading === 'cancel'}
                onClick={() => handleAction('cancel')}
                variant="danger"
              />
            </>
          )}

          {isActive && (
            <>
              <ActionBtn
                icon={LogOut}
                label="Check Out"
                loading={actionLoading === 'checkout'}
                onClick={() => handleAction('checkout')}
                variant="primary"
              />
              <ActionBtn
                icon={CalendarClock}
                label="Extend Booking"
                loading={false}
                onClick={() => { setExtendOpen(true); reset(); }}
                variant="outline"
              />
              <ActionBtn
                icon={XCircle}
                label="Cancel"
                loading={actionLoading === 'cancel'}
                onClick={() => handleAction('cancel')}
                variant="danger"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Extend Modal ──────────────────────────────────────────────── */}
      {extendOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center 
                     p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setExtendOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md 
                       animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 
                            border-b border-[#EDE8F5]">
              <div>
                <h3 className="text-lg font-black text-[#3D52A0]">
                  Extend Booking
                </h3>
                <p className="text-xs text-[#8697C4] mt-0.5">
                  Current end: {formatDateTime(booking.endTime)}
                </p>
              </div>
              <button
                onClick={() => setExtendOpen(false)}
                className="p-2 rounded-xl text-[#8697C4] 
                           hover:text-[#3D52A0] hover:bg-[#EDE8F5] 
                           transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onExtendSubmit)}
              className="p-6 space-y-5"
            >
              {/* New end time */}
              <div>
                <label className="form-label">New End Time</label>
                <input
                  type="datetime-local"
                  min={getMinExtendTime()}
                  {...register('newEndTime')}
                  className={`form-input ${
                    errors.newEndTime
                      ? 'border-red-400 focus:ring-red-300' : ''
                  }`}
                />
                {errors.newEndTime && (
                  <p className="form-error">{errors.newEndTime.message}</p>
                )}
              </div>

              {/* Extension cost estimate */}
              {extInfo && (
                <div className="bg-[#3D52A0] rounded-xl p-4 
                                flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
                      Additional Duration
                    </p>
                    <p className="text-lg font-black text-white">
                      {extInfo.hours}h
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
                      Extra Cost (est.)
                    </p>
                    <p className="text-lg font-black text-white">
                      {extInfo.cost}
                    </p>
                  </div>
                </div>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 bg-[#EDE8F5] 
                              rounded-xl p-3">
                <Info className="w-4 h-4 text-[#7091E6] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#8697C4] leading-relaxed">
                  New end time must be at least 30 minutes after your 
                  current end time. Actual fare is calculated at checkout.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setExtendOpen(false)}
                  className="btn-outline flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'extend'}
                  className="btn-primary flex-1 flex items-center 
                             justify-center gap-2 py-3"
                >
                  {actionLoading === 'extend' ? (
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                  ) : (
                    <CalendarClock className="w-4 h-4" />
                  )}
                  Extend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payment Section Component ──────────────────────────────────────────────────
function PaymentSection({ booking, lotName, onPaymentSuccess }) {
  const [selectedMode, setSelectedMode] = useState('Razorpay');
  const [paying, setPaying] = useState(false);

  const modes = [
    { value: 'Cash',      label: 'Cash' },
    { value: 'Razorpay',  label: 'Razorpay' },
  ];

  const handlePayNow = async () => {
    setPaying(true);
    try {
      if (selectedMode === 'Cash') {
        // ─── CASH: direct backend call, no Razorpay ────────────────────
        const res = await initiateCashPayment(booking.bookingId);
        toast.success('Cash payment recorded!');
        onPaymentSuccess(res.data);

      } else {
        // ─── Step 1: Create Razorpay order on backend ──────────────────
        const orderRes = await createRazorpayOrder(booking.bookingId);
        const { razorpayOrderId, razorpayKeyId, amountInPaise, currency, paymentId } = orderRes.data;

        // ─── Step 2: Open Razorpay Checkout UI ────────────────────────
        const options = {
          key: razorpayKeyId,
          amount: amountInPaise,
          currency: currency,
          name: 'ParkEase',
          description: `Parking fee — ${lotName}`,
          order_id: razorpayOrderId,

          // ─── Step 3: On payment success, verify with backend ────────
          handler: async function (response) {
            try {
              const verifyRes = await verifyRazorpayPayment({
                paymentId: paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                mode: selectedMode,
              });
              toast.success('Payment successful! 🎉');
              onPaymentSuccess(verifyRes.data);
            } catch (err) {
              const msg = err.response?.data?.message || 'Payment verification failed.';
              toast.error(msg);
            }
          },

          prefill: {
            name: '',
            email: '',
          },

          theme: { color: '#1a73e8' },

          modal: {
            ondismiss: () => {
              toast('Payment cancelled.', { icon: 'ℹ️' });
              setPaying(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', function (response) {
          toast.error(`Payment failed: ${response.error.description}`);
          setPaying(false);
        });

        rzp.open();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setPaying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4 card">
      <h3 className="text-lg font-semibold text-[#3D52A0] mb-1">Complete Payment</h3>
      <p className="text-2xl font-bold text-[#7091E6] mb-4">
        ₹{booking.totalAmount?.toFixed(2)}
      </p>

      {/* Payment Mode Selection */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {modes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedMode(value)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
              ${selectedMode === value
                ? 'bg-[#3D52A0] text-white border-[#3D52A0]'
                : 'bg-white text-[#8697C4] border-[#EDE8F5] hover:border-[#7091E6]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Info note for Razorpay */}
      {selectedMode === 'Razorpay' && (
        <p className="text-xs text-[#8697C4] mb-4 bg-[#EDE8F5] rounded-lg p-3">
          You'll be redirected to Razorpay's secure checkout.
        </p>
      )}

      <button
        onClick={handlePayNow}
        disabled={paying}
        className="w-full bg-[#3D52A0] hover:bg-[#7091E6] disabled:opacity-50
                   text-white font-semibold py-3 rounded-lg transition"
      >
        {paying ? 'Processing...' : `Pay ₹${booking.totalAmount?.toFixed(2)} via ${selectedMode}`}
      </button>
    </div>
  );
}

// ── Detail cell ───────────────────────────────────────────────────────────────
function DetailCell({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 
                    ${highlight ? 'bg-[#3D52A0]' : 'bg-[#EDE8F5]'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 
                         ${highlight ? 'text-[#ADBBDA]' : 'text-[#8697C4]'}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wide
                         ${highlight ? 'text-[#ADBBDA]' : 'text-[#8697C4]'}`}>
          {label}
        </span>
      </div>
      <p className={`text-sm font-bold truncate
                    ${highlight ? 'text-white' : 'text-[#3D52A0]'}`}>
        {value}
      </p>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, loading, onClick, variant }) {
  const styles = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    danger:  `border-2 border-red-200 text-red-500 font-semibold 
              px-5 py-2.5 rounded-xl hover:bg-red-50 
              hover:border-red-400 transition-all duration-200`,
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 text-sm
                  ${styles[variant]}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full 
                        border-2 border-current/30 border-t-current" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}

// ── Missing X import fix ──────────────────────────────────────────────────────
function X({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}