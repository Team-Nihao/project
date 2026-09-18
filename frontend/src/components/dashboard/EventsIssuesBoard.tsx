import React, { useState } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Send, 
  X, 
  Layers, 
  Wrench,
  Shield,
  Wifi,
  Droplets,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { IssueReport, CampusEvent, IssueStatus, IssueCategory, IssuePriority } from '../../types/campus';

export const EventsIssuesBoard: React.FC = () => {
  const { campusState, reportIssue, updateIssueStatus, selectBuilding } = useCampus();

  const [activeTab, setActiveTab] = useState<'issues' | 'events'>('issues');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('bldg-block-34');
  const [category, setCategory] = useState<IssueCategory>('maintenance');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [reportedBy, setReportedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campusState) return null;

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const locationObj = 
      campusState.buildings.find((b) => b.id === locationId) || 
      campusState.parking_lots.find((p) => p.id === locationId);

    const success = await reportIssue({
      title,
      description,
      location_id: locationId,
      location_name: locationObj ? locationObj.name : locationId,
      reported_by: reportedBy.trim() || 'Campus Student',
      category,
      priority
    });

    setIsSubmitting(false);
    if (success) {
      setTitle('');
      setDescription('');
      setReportedBy('');
      setIsReportModalOpen(false);
    }
  };

  const openIssues = campusState.issues.filter((i) => i.status === 'open');
  const inProgressIssues = campusState.issues.filter((i) => i.status === 'in-progress');
  const resolvedIssues = campusState.issues.filter((i) => i.status === 'resolved');

  return (
    <div className="fade-in-up space-y-5">
      {/* Top Header & Tab Selector */}
      <div className="bg-[#131B2E] p-5 rounded-2xl border border-[#232E4A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('issues')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'issues'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-102'
                : 'text-slate-400 hover:text-white bg-[#0B0F19]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Campus Incident Board ({campusState.issues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'events'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-102'
                : 'text-slate-400 hover:text-white bg-[#0B0F19]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events Calendar ({campusState.events.length})</span>
          </button>
        </div>

        {activeTab === 'issues' && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Report Incident / Issue</span>
          </button>
        )}
      </div>

      {/* ISSUES KANBAN BOARD */}
      {activeTab === 'issues' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column: OPEN */}
          <div className="bg-[#101726] p-4 rounded-2xl border border-[#232E4A] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                <h3 className="font-bold text-white text-sm">Open / Reported</h3>
              </div>
              <span className="text-xs bg-[#1E293B] text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {openIssues.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {openIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No open issues</div>
              ) : (
                openIssues.map((iss) => (
                  <IssueCard
                    key={iss.id}
                    issue={iss}
                    onMoveStatus={(nextStatus) => updateIssueStatus(iss.id, nextStatus)}
                    onSelectBuilding={() => selectBuilding(iss.location_id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column: IN PROGRESS */}
          <div className="bg-[#101726] p-4 rounded-2xl border border-[#232E4A] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 animate-pulse"></span>
                <h3 className="font-bold text-white text-sm">In Progress / Dispatch</h3>
              </div>
              <span className="text-xs bg-[#1E293B] text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {inProgressIssues.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {inProgressIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No issues in progress</div>
              ) : (
                inProgressIssues.map((iss) => (
                  <IssueCard
                    key={iss.id}
                    issue={iss}
                    onMoveStatus={(nextStatus) => updateIssueStatus(iss.id, nextStatus)}
                    onSelectBuilding={() => selectBuilding(iss.location_id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column: RESOLVED */}
          <div className="bg-[#101726] p-4 rounded-2xl border border-[#232E4A] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                <h3 className="font-bold text-white text-sm">Resolved</h3>
              </div>
              <span className="text-xs bg-[#1E293B] text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {resolvedIssues.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {resolvedIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No resolved issues yet</div>
              ) : (
                resolvedIssues.map((iss) => (
                  <IssueCard
                    key={iss.id}
                    issue={iss}
                    onMoveStatus={(nextStatus) => updateIssueStatus(iss.id, nextStatus)}
                    onSelectBuilding={() => selectBuilding(iss.location_id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EVENTS CALENDAR & TIMELINE */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campusState.events.map((evt) => (
            <div
              key={evt.id}
              className="card-interactive p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                    {evt.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">
                    ~{evt.expected_attendees} Expected
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-2.5 leading-snug">{evt.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{evt.description}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-200 font-semibold">{evt.location_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{new Date(evt.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                <span className="text-slate-400">Host: <strong className="text-white">{evt.organizer}</strong></span>
                <button
                  onClick={() => selectBuilding(evt.location_id)}
                  className="btn-tactile text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                >
                  <span>Locate on Map</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT ISSUE MODAL WITH SMOOTH ENTRANCE */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div 
            className="modal-pop bg-[#11192C] border border-[#2A3756] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#232E4A] flex items-center justify-between bg-[#151F36]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Report Campus Issue / Hazard</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="btn-tactile p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WiFi down on 3rd floor library, broken light fixture..."
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 capitalize shadow-sm"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="safety">Safety / Security</option>
                    <option value="it">IT & WiFi Network</option>
                    <option value="water">Plumbing / Water</option>
                    <option value="electrical">Electrical & Lighting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 uppercase shadow-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Immediate Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location Picker</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <optgroup label="Buildings & Halls">
                    {campusState.buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Parking Facilities">
                    {campusState.parking_lots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Details</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details of the problem and exact location..."
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reported By (Name/Role)</label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="e.g. Gurpreet Singh (CSE Student) / Simran Kaur (Faculty)"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-[#232E4A] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="pt-3 border-t border-[#232E4A] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="btn-tactile px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-tactile px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Kanban Issue Card
interface IssueCardProps {
  issue: IssueReport;
  onMoveStatus: (next: 'open' | 'in-progress' | 'resolved') => void;
  onSelectBuilding: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onMoveStatus, onSelectBuilding }) => {
  let prioColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let isCrit = false;

  if (issue.priority === 'critical') {
    prioColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    isCrit = true;
  } else if (issue.priority === 'high') {
    prioColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  }

  return (
    <div className={`card-interactive p-4 rounded-xl bg-[#131B2E] border ${isCrit ? 'border-rose-500/40 shadow-rose-500/10 shadow-md' : 'border-[#232E4A]'}`}>
      <div className="flex items-start justify-between gap-1">
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${prioColor} ${isCrit ? 'badge-pulse' : ''}`}>
          {issue.priority}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <h4 className="font-bold text-white text-sm mt-1.5 leading-snug">{issue.title}</h4>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{issue.description}</p>

      <button
        onClick={onSelectBuilding}
        className="btn-tactile mt-2.5 text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
      >
        <MapPin className="w-3 h-3 text-slate-500" />
        <span className="truncate">{issue.location_name}</span>
      </button>

      {/* Action status buttons */}
      <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
          {issue.reported_by}
        </span>

        <div className="flex gap-1.5">
          {issue.status === 'open' && (
            <button
              onClick={() => onMoveStatus('in-progress')}
              className="btn-tactile px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30"
            >
              Start Work
            </button>
          )}

          {issue.status !== 'resolved' && (
            <button
              onClick={() => onMoveStatus('resolved')}
              className="btn-tactile px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30"
            >
              Resolve
            </button>
          )}

          {issue.status === 'resolved' && (
            <button
              onClick={() => onMoveStatus('open')}
              className="btn-tactile px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
