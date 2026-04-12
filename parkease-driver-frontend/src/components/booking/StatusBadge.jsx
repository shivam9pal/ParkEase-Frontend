const STATUS_MAP = {
  RESERVED:  { label: 'Reserved',  classes: 'badge-reserved'  },
  ACTIVE:    { label: 'Active',    classes: 'badge-active'    },
  COMPLETED: { label: 'Completed', classes: 'badge-completed' },
  CANCELLED: { label: 'Cancelled', classes: 'badge-cancelled' },
  OPEN:      { label: 'Open',      classes: 'badge-open'      },
  CLOSED:    { label: 'Closed',    classes: 'badge-closed'    },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`badge ${config.classes}`}>
      {config.label}
    </span>
  );
}