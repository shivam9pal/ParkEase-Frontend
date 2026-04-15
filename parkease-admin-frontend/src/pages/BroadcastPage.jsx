import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Megaphone, Users, Car, UserCog,
  Info, CheckCircle2, Send,
} from "lucide-react";
import { sendBroadcast } from "../api/notificationApi";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "../store/notificationStore";

const broadcastSchema = z.object({
  targetRole: z.enum(["DRIVER", "MANAGER", "ALL"], {
    errorMap: () => ({ message: "Please select a target audience" }),
  }),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message cannot exceed 1000 characters"),
});

// Role option card
function RoleCard({ value, label, description, icon: Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 rounded-xl border-2 text-left
        transition-all w-full
        ${selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-muted/50 bg-white hover:border-primary/40 hover:bg-surface"
        }
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          ${selected ? "bg-primary text-white" : "bg-surface text-secondary"}
        `}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-primary" : "text-gray-700"}`}>
          {label}
        </p>
        <p className="text-xs text-secondary mt-0.5">{description}</p>
      </div>
      {selected && (
        <CheckCircle2 size={16} className="text-primary ml-auto shrink-0 mt-0.5" />
      )}
    </button>
  );
}

const ROLE_OPTIONS = [
  {
    value: "DRIVER",
    label: "Drivers Only",
    description: "Send to all registered drivers",
    icon: Car,
  },
  {
    value: "MANAGER",
    label: "Managers Only",
    description: "Send to all parking lot managers",
    icon: UserCog,
  },
  {
    value: "ALL",
    label: "Everyone",
    description: "Send to all drivers and managers",
    icon: Users,
  },
];

export default function BroadcastPage() {
  const [loading, setLoading]   = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { targetRole: "", title: "", message: "" },
  });

  const watchedTitle   = watch("title",   "");
  const watchedMessage = watch("message", "");
  const watchedRole    = watch("targetRole");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await sendBroadcast(data);
      // Backend returns 202 Accepted
      if (res.status === 202 || res.status === 200) {
        toast.success("Broadcast sent successfully!");
        setLastSent({
          role: data.targetRole,
          title: data.title,
          sentAt: new Date().toLocaleTimeString(),
        });
        reset({ targetRole: "", title: "", message: "" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send broadcast";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Broadcast Notification"
        subtitle="Send a platform-wide message to drivers, managers, or everyone"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Form — 2/3 width */}
        <div className="xl:col-span-2 space-y-5">

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3.5">
            <Info size={16} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                About Broadcasts
              </p>
              <p className="text-xs text-secondary mt-0.5">
                Broadcasts are sent via{" "}
                <span className="font-medium text-gray-700">
                  App, Email, and SMS
                </span>{" "}
                to all users of the selected role. The delivery is asynchronous
                — you'll get a confirmation immediately, but delivery may take
                a few seconds.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Step 1 — Target audience */}
            <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Step 1 — Select Target Audience
              </p>
              <p className="text-xs text-secondary mb-4">
                Who should receive this broadcast?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((opt) => (
                  <RoleCard
                    key={opt.value}
                    {...opt}
                    selected={watchedRole === opt.value}
                    onClick={() => setValue("targetRole", opt.value, { shouldValidate: true })}
                  />
                ))}
              </div>
              {errors.targetRole && (
                <p className="text-xs text-red-600 mt-2">
                  {errors.targetRole.message}
                </p>
              )}
            </div>

            {/* Step 2 — Message content */}
            <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Step 2 — Write Your Message
                </p>
                <p className="text-xs text-secondary">
                  Keep your title short and your message clear and helpful.
                </p>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Notification Title
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      watchedTitle.length > 180
                        ? "text-red-600"
                        : watchedTitle.length > 150
                        ? "text-yellow-600"
                        : "text-secondary"
                    }`}
                  >
                    {watchedTitle.length} / 200
                  </span>
                </div>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="e.g. System Maintenance Notice"
                  className={`
                    w-full px-4 py-2.5 text-sm border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                    transition-colors bg-white
                    ${errors.title
                      ? "border-red-400 bg-red-50"
                      : "border-muted hover:border-secondary"
                    }
                  `}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Message Body
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      watchedMessage.length > 900
                        ? "text-red-600"
                        : watchedMessage.length > 750
                        ? "text-yellow-600"
                        : "text-secondary"
                    }`}
                  >
                    {watchedMessage.length} / 1000
                  </span>
                </div>
                <textarea
                  {...register("message")}
                  rows={6}
                  placeholder="Write your broadcast message here..."
                  className={`
                    w-full px-4 py-2.5 text-sm border rounded-lg resize-none
                    focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                    transition-colors bg-white
                    ${errors.message
                      ? "border-red-400 bg-red-50"
                      : "border-muted hover:border-secondary"
                    }
                  `}
                />
                {errors.message && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full flex items-center justify-center gap-2
                  bg-primary hover:bg-primary-hover text-white
                  py-3 rounded-xl text-sm font-semibold
                  transition-all shadow-sm
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Broadcast...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right sidebar — 1/3 width */}
        <div className="space-y-4">

          {/* Live preview */}
          <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Megaphone size={15} className="text-accent" />
              Preview
            </p>
            {/* Mock notification card */}
            <div className="bg-surface rounded-xl border border-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <Megaphone size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {watchedTitle || "Your notification title"}
                  </p>
                  <p className="text-xs text-secondary mt-1 line-clamp-3 break-words">
                    {watchedMessage || "Your message will appear here..."}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {watchedRole && (
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        → {watchedRole === "ALL" ? "Everyone" : watchedRole}
                      </span>
                    )}
                    <span className="text-[10px] text-secondary">
                      Just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-secondary text-center mt-3">
              Sent via App • Email • SMS
            </p>
          </div>

          {/* Last broadcast sent */}
          {lastSent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-green-600" />
                <p className="text-sm font-semibold text-green-800">
                  Last Broadcast Sent
                </p>
              </div>
              <p className="text-xs text-green-700">
                <span className="font-medium">Title:</span> {lastSent.title}
              </p>
              <p className="text-xs text-green-700 mt-1">
                <span className="font-medium">To:</span>{" "}
                {lastSent.role === "ALL" ? "Everyone" : lastSent.role}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Sent at {lastSent.sentAt}
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-xl border border-muted/40 shadow-card p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              💡 Tips
            </p>
            {[
              "Keep titles under 60 characters for best display",
              "Avoid sending more than 3 broadcasts per day",
              "Use PROMO type for offers and announcements",
              "Broadcast delivery is async — results in seconds",
            ].map((tip, i) => (
              <p key={i} className="text-xs text-secondary flex items-start gap-1.5">
                <span className="text-accent font-bold mt-0.5">•</span>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}