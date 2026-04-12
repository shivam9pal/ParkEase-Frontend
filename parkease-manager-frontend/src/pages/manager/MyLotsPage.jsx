import { useEffect, useState, useCallback } from 'react';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getMyLots } from '../../api/lotApi';
import LotCard from '../../components/lots/LotCard';
import LotFormModal from '../../components/lots/LotFormModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

export default function MyLotsPage() {
  const user = useAuthStore((s) => s.user);

  // ── State ────────────────────────────────────────────────────────
  const [lots, setLots]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('ALL');  // ALL | APPROVED | PENDING
  const [viewMode, setViewMode]   = useState('grid'); // grid | list
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState(null);

  // ── Fetch Lots ───────────────────────────────────────────────────
  const fetchLots = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyLots(user.userId);
      setLots(res.data ?? []);
    } catch {
      setError('Failed to load your lots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { fetchLots(); }, [fetchLots]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleLotCreated = (newLot) => {
    setLots((prev) => [newLot, ...prev]);
    setShowModal(false);
  };

  const handleLotUpdated = (updatedLot) => {
    setLots((prev) =>
      prev.map((l) => (l.lotId === updatedLot.lotId ? updatedLot : l))
    );
    setEditingLot(null);
  };

  const handleLotDeleted = (lotId) => {
    setLots((prev) => prev.filter((l) => l.lotId !== lotId));
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
  };

  // ── Filtered + Searched Lots ──────────────────────────────────────
  const filteredLots = lots
    .filter((l) => {
      if (filter === 'APPROVED') return l.isApproved;
      if (filter === 'PENDING')  return !l.isApproved;
      return true;
    })
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    });

  const approvedCount = lots.filter((l) => l.isApproved).length;
  const pendingCount  = lots.filter((l) => !l.isApproved).length;

  if (loading) return <LoadingSpinner fullPage text="Loading your lots..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchLots} fullPage />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="My Parking Lots"
        subtitle={`${lots.length} total — ${approvedCount} approved, ${pendingCount} pending`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Lot
          </button>
        }
      />

      {/* ── Filter + Search + View Toggle Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-3">

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-accent/40
                        rounded-lg p-1">
          {[
            { key: 'ALL',      label: `All (${lots.length})` },
            { key: 'APPROVED', label: `✅ Approved (${approvedCount})` },
            { key: 'PENDING',  label: `⏳ Pending (${pendingCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md
                          transition-colors whitespace-nowrap
                          ${filter === key
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted hover:text-primary hover:bg-background'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lots..."
              className="input-field pl-8 py-1.5 text-sm"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-accent/40 rounded-lg
                          overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors
                          ${viewMode === 'grid'
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-primary hover:bg-background'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors
                          ${viewMode === 'list'
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-primary hover:bg-background'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Lots Grid / List ── */}
      {filteredLots.length === 0 ? (
        <EmptyState
          title={search ? 'No lots match your search' : 'No lots found'}
          description={
            search
              ? 'Try a different search term.'
              : filter !== 'ALL'
              ? `No ${filter.toLowerCase()} lots yet.`
              : 'Start by adding your first parking lot!'
          }
          action={
            !search && filter === 'ALL' ? (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={14} />
                Add Your First Lot
              </button>
            ) : null
          }
        />
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLots.map((lot) => (
            <LotCard
              key={lot.lotId}
              lot={lot}
              onEdit={handleEdit}
              onDeleted={handleLotDeleted}
              onUpdated={handleLotUpdated}
            />
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/60 border-b border-accent/20">
                  {['Lot Name & Address', 'City', 'Status', 'Spots',
                    'Hours', 'Open', 'Actions'].map((h) => (
                    <th key={h}
                        className="text-left px-5 py-3 text-xs font-semibold
                                   text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/10">
                {filteredLots.map((lot) => (
                  <tr key={lot.lotId}
                      className="hover:bg-background/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{lot.name}</p>
                      <p className="text-xs text-muted">{lot.address}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{lot.city}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={lot.isApproved ? 'APPROVED' : 'PENDING'} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">
                        {lot.availableSpots}
                      </span>
                      <span className="text-muted"> / {lot.totalSpots}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                      {lot.openTime?.slice(0,5)} – {lot.closeTime?.slice(0,5)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={lot.isOpen ? 'OPEN' : 'CLOSED'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(lot)}
                          className="text-xs text-secondary font-semibold
                                     hover:text-primary transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-accent">|</span>
                        <button
                          onClick={() => window.location.href =
                            `/manager/lots/${lot.lotId}`}
                          className="text-xs text-primary font-semibold
                                     hover:text-primary-hover transition-colors"
                        >
                          View →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Lot Modal ── */}
      {showModal && (
        <LotFormModal
          mode="create"
          onClose={() => setShowModal(false)}
          onSuccess={handleLotCreated}
        />
      )}

      {/* ── Edit Lot Modal ── */}
      {editingLot && (
        <LotFormModal
          mode="edit"
          lot={editingLot}
          onClose={() => setEditingLot(null)}
          onSuccess={handleLotUpdated}
        />
      )}
    </div>
  );
}