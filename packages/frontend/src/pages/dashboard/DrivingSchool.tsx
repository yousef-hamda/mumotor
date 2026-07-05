import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  KeyRound,
  Users,
  CalendarDays,
  Mail,
  Settings as SettingsIcon,
  Copy,
  Check,
  Search,
  Trash2,
  PauseCircle,
  PlayCircle,
  GraduationCap,
  RefreshCw,
  Plus,
  X,
  Send,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import { apiError, drivingSchoolApi, websiteApi } from '../../lib/api';
import {
  Button,
  Card,
  CenteredSpinner,
  EmptyState,
  Field,
  Input,
  Modal,
  NumberInput,
  Select,
  StatusBadge,
  Textarea,
} from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import { WEEKDAYS, formatDate, formatDateLong, titleCase } from '../../lib/utils';
import type { BusinessHours, DrivingSettings, ScheduleDay, Student, Website } from '../../lib/types';

const TABS = [
  { key: 'code', label: 'Enrollment Code', icon: KeyRound },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'schedule', label: 'Schedule', icon: CalendarDays },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;
type TabKey = (typeof TABS)[number]['key'];

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = (text: string, key = text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };
  return { copied, copy };
}

// ===========================================================================
// Tab: Enrollment Code
// ===========================================================================
function CodeTab({ website }: { website: Website }) {
  const { copied, copy } = useCopy();
  const { data, isLoading } = useQuery({
    queryKey: ['daily-code', website.id],
    queryFn: () => drivingSchoolApi.getDailyCode(website.id),
  });
  const enrollUrl = `${window.location.origin}/p/${website.slug}/enroll`;

  if (isLoading) return <CenteredSpinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Daily code card */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Today's enrollment code
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          Share this code with a new student so they can enroll. It rotates every day.
        </p>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-sand-200 bg-sand-50 p-8">
          <span className="font-mono text-5xl font-bold tracking-[0.3em] tabular-nums text-sand-900">{data?.code}</span>
          <Button variant="secondary" onClick={() => copy(data?.code ?? '')}>
            {copied === data?.code ? (
              <Check className="h-4 w-4 text-sand-900" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === data?.code ? 'Copied' : 'Copy code'}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-sand-500">
          Valid for {formatDate(new Date().toISOString())}
        </p>
      </Card>

      {/* Enroll link card */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Public enroll link
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          Send this link — students enroll themselves with the code above.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
          <code className="flex-1 truncate text-sm text-sand-700">{enrollUrl}</code>
          <button
            onClick={() => copy(enrollUrl, 'link')}
            className="rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800"
            aria-label="Copy enroll link"
          >
            {copied === 'link' ? (
              <Check className="h-4 w-4 text-sand-900" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <a
          href={enrollUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-4 text-sm"
        >
          Open enroll page <ExternalLink className="h-4 w-4" />
        </a>
        <div className="mt-6 rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm text-sand-600">
          You can also set a permanent static code in{' '}
          <strong className="font-semibold text-sand-900">Settings</strong> if you prefer not to
          rotate codes daily.
        </div>
      </Card>
    </div>
  );
}

// ===========================================================================
// Tab: Students
// ===========================================================================
function StudentsTab({ website }: { website: Website }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const emptyAdd = { studentName: '', studentEmail: '', studentPhone: '', notes: '' };
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['students', website.id, { debounced, status, page }],
    queryFn: () =>
      drivingSchoolApi.listStudents(website.id, {
        search: debounced,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['students', website.id] });
    qc.invalidateQueries({ queryKey: ['websites'] });
  };

  const toggle = useMutation({
    mutationFn: (id: string) => drivingSchoolApi.toggleStudentStatus(website.id, id),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });
  const finish = useMutation({
    mutationFn: (id: string) => drivingSchoolApi.finishStudent(website.id, id),
    onSuccess: () => {
      toast.success('Marked as completed');
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => drivingSchoolApi.removeStudent(website.id, id),
    onSuccess: () => {
      toast.success('Student deleted');
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });
  const add = useMutation({
    mutationFn: () =>
      drivingSchoolApi.addStudent(website.id, {
        studentName: addForm.studentName.trim(),
        studentEmail: addForm.studentEmail.trim(),
        studentPhone: addForm.studentPhone.trim(),
        notes: addForm.notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Student added');
      setAddOpen(false);
      setAddForm(emptyAdd);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <Card className="p-0">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="ps-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMPLETED">Completed</option>
        </Select>
        <Button type="button" variant="primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add student
        </Button>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : !data || data.students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No students yet"
          description="Share your enrollment code to get your first student."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-start text-xs uppercase tracking-wide text-sand-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Classes</th>
                <th className="px-4 py-3 font-semibold">Enrolled</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-sand-200 transition-colors last:border-b-0 hover:bg-sand-50"
                >
                  <td className="px-4 py-3 font-semibold text-sand-900">{s.studentName}</td>
                  <td className="px-4 py-3 text-sand-600">{s.studentEmail}</td>
                  <td className="px-4 py-3 text-sand-600">{s.studentPhone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold tabular-nums text-sand-900">{s.classCount}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sand-600">{formatDate(s.enrolledAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {s.status !== 'COMPLETED' && (
                        <button
                          aria-label={s.status === 'ACTIVE' ? 'Pause student' : 'Activate student'}
                          title={s.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          onClick={() => toggle.mutate(s.id)}
                          className="rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
                        >
                          {s.status === 'ACTIVE' ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {s.status !== 'COMPLETED' && (
                        <button
                          aria-label="Mark student completed"
                          title="Mark completed"
                          onClick={() => finish.mutate(s.id)}
                          className="rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
                        >
                          <GraduationCap className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        aria-label="Delete student"
                        title="Delete"
                        onClick={() => setToDelete(s)}
                        className="rounded-lg p-2 text-ember-600 transition-colors hover:bg-ember-50 hover:text-ember-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-sand-200 p-4 text-sm">
          <span className="tabular-nums text-sand-600">
            Page {data.page} of {data.totalPages} · {data.total} students
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete student?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => toDelete && remove.mutate(toDelete.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-sand-600">
          This permanently removes <strong className="text-sand-900">{toDelete?.studentName}</strong> and
          their enrollment. This cannot be undone.
        </p>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a student"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={add.isPending}
              onClick={() => {
                if (addForm.studentName.trim().length < 2) return toast.error('Please enter a name');
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addForm.studentEmail.trim()))
                  return toast.error('Please enter a valid email');
                if (!/^[+\d][\d\s-]{6,18}$/.test(addForm.studentPhone.trim()))
                  return toast.error('Please enter a valid phone number');
                add.mutate();
              }}
            >
              Add student
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-sand-600">
          Add a student yourself — no code needed. They’ll get a welcome email and can book straight away.
        </p>
        <div className="space-y-4">
          <Field label="Full name">
            <Input
              value={addForm.studentName}
              onChange={(e) => setAddForm({ ...addForm, studentName: e.target.value })}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={addForm.studentEmail}
              onChange={(e) => setAddForm({ ...addForm, studentEmail: e.target.value })}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={addForm.studentPhone}
              onChange={(e) => setAddForm({ ...addForm, studentPhone: e.target.value })}
              placeholder="+972 50 123 4567"
              required
            />
          </Field>
          <Field label="Notes (optional)">
            <Textarea
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              placeholder="Anything useful about this student…"
              rows={2}
            />
          </Field>
        </div>
      </Modal>
    </Card>
  );
}

// ===========================================================================
// Tab: Schedule (Today / Tomorrow)
// ===========================================================================
function ScheduleTab({ website }: { website: Website }) {
  const qc = useQueryClient();
  const [day, setDay] = useState<ScheduleDay>('today');
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['daily-report', website.id, day],
    queryFn: () => drivingSchoolApi.getDailyReport(website.id, day),
  });
  const [cancelTarget, setCancelTarget] = useState<{ bookingId: string; time: string; studentName?: string } | null>(null);
  const [assignTime, setAssignTime] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const invalidateReport = () => qc.invalidateQueries({ queryKey: ['daily-report', website.id] });

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) => drivingSchoolApi.cancelBooking(website.id, bookingId),
    onSuccess: () => {
      toast.success('Lesson cancelled — the student was emailed and the slot is free again');
      setCancelTarget(null);
      invalidateReport();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const assign = useMutation({
    mutationFn: (enrollmentId: string) =>
      drivingSchoolApi.assignStudentToSlot(website.id, { enrollmentId, day, time: assignTime! }),
    onSuccess: () => {
      toast.success('Student booked into the slot');
      setAssignTime(null);
      setStudentSearch('');
      invalidateReport();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const emailMe = useMutation({
    mutationFn: () => drivingSchoolApi.emailMeSchedule(website.id, { day }),
    onSuccess: () => toast.success(`The ${day}'s schedule was emailed to you`),
    onError: (e) => toast.error(apiError(e).message),
  });

  // Active students for the "add student to this slot" picker — only fetched while the modal is open.
  const { data: pickerStudents, isLoading: pickerLoading } = useQuery({
    queryKey: ['students', website.id, 'schedule-picker', studentSearch],
    queryFn: () =>
      drivingSchoolApi.listStudents(website.id, { status: 'ACTIVE', search: studentSearch, limit: 50 }),
    enabled: assignTime !== null,
  });

  if (isLoading) return <CenteredSpinner />;

  return (
    <Card>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-sand-900">
            {data ? formatDateLong(data.date) : titleCase(day)}
          </h3>
          {data?.isOpen ? (
            <p className="mt-0.5 text-sm text-sand-600">
              Open {data.open}–{data.close} ·{' '}
              <span className="font-semibold tabular-nums text-sand-900">{data.totals.booked}</span> booked ·{' '}
              <span className="font-semibold tabular-nums text-sand-900">{data.totals.empty}</span> free
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-sand-600">Closed {day}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Today / Tomorrow segmented control */}
          <div className="flex gap-1 rounded-lg border border-sand-200 bg-sand-100 p-1">
            {(['today', 'tomorrow'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-current={day === d ? 'page' : undefined}
                className={
                  day === d
                    ? 'rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-sand-900 shadow-sm transition-colors'
                    : 'rounded-md px-4 py-1.5 text-sm font-medium text-sand-600 transition-colors hover:text-sand-900'
                }
              >
                {titleCase(d)}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => emailMe.mutate()} loading={emailMe.isPending}>
            <Mail className="h-4 w-4" /> Email me the schedule
          </Button>
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {!data || data.slots.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={data?.isOpen ? `No slots ${day}` : `Closed ${day}`}
          description="Adjust your working hours in Settings."
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.slots.map((slot) => (
            <div
              key={slot.time}
              className={
                slot.booked
                  ? 'rounded-xl border border-sand-200 bg-sand-50 p-4'
                  : 'rounded-xl border border-dashed border-sand-300 bg-white p-4'
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold tabular-nums text-sand-900">{slot.time}</span>
                {slot.booked ? (
                  <span className="chip bg-sand-900 text-white">Booked</span>
                ) : (
                  <span className="chip bg-sand-200 text-sand-600">Free</span>
                )}
              </div>
              {slot.booked ? (
                <div className="mt-2">
                  <p className="font-semibold text-sand-900">{slot.studentName}</p>
                  {slot.studentPhone && (
                    <p className="text-sm text-sand-500">{slot.studentPhone}</p>
                  )}
                  {typeof slot.classCount === 'number' && (
                    <p className="mt-1 text-xs text-sand-500">Lesson #{slot.classCount}</p>
                  )}
                  {slot.bookingId && (
                    <button
                      onClick={() => setCancelTarget({ bookingId: slot.bookingId!, time: slot.time, studentName: slot.studentName })}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ember-600 hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel lesson
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAssignTime(slot.time)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sun-600 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add student
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancel this lesson?">
        <p className="text-sm text-sand-600">
          {cancelTarget?.studentName ? `${cancelTarget.studentName}'s` : 'The'} lesson at{' '}
          <strong className="text-sand-900">{cancelTarget?.time}</strong> will be cancelled. The student
          gets an email and the slot opens up for other students.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep lesson</Button>
          <Button
            variant="danger"
            loading={cancelBooking.isPending}
            onClick={() => cancelTarget && cancelBooking.mutate(cancelTarget.bookingId)}
          >
            Cancel lesson
          </Button>
        </div>
      </Modal>

      <Modal
        open={assignTime !== null}
        onClose={() => {
          setAssignTime(null);
          setStudentSearch('');
        }}
        title={`Book a student at ${assignTime ?? ''}`}
      >
        <div className="space-y-3">
          <Input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search active students by name or email…"
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto rounded-lg border border-sand-200">
            {pickerLoading ? (
              <CenteredSpinner />
            ) : !pickerStudents || pickerStudents.students.length === 0 ? (
              <p className="p-4 text-sm text-sand-500">No active students found.</p>
            ) : (
              pickerStudents.students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={assign.isPending}
                  onClick={() => assign.mutate(s.id)}
                  className="flex w-full items-center justify-between border-b border-sand-100 px-4 py-3 text-start last:border-b-0 hover:bg-sand-50 disabled:opacity-50"
                >
                  <span>
                    <span className="block font-medium text-sand-900">{s.studentName}</span>
                    <span className="block text-xs text-sand-500">{s.studentEmail}</span>
                  </span>
                  {assign.isPending && assign.variables === s.id && (
                    <span className="text-xs text-sand-400">Booking…</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </Card>
  );
}

// ===========================================================================
// Tab: Email
// ===========================================================================
function EmailTab({ website }: { website: Website }) {
  const [mode, setMode] = useState<'group' | 'specific'>('group');
  const [targetGroup, setTargetGroup] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const { data: pickerStudents, isLoading: pickerLoading } = useQuery({
    queryKey: ['students', website.id, 'email-picker'],
    queryFn: () => drivingSchoolApi.listStudents(website.id, { status: 'ACTIVE', limit: 100 }),
    enabled: mode === 'specific',
  });

  const send = useMutation({
    mutationFn: () =>
      drivingSchoolApi.sendBulkEmail(
        website.id,
        mode === 'specific'
          ? { subject, body, enrollmentIds: selectedIds }
          : { subject, body, targetGroup }
      ),
    onSuccess: (res) => {
      toast.success(
        `Sent to ${res.sentCount} student(s)${res.failedCount ? `, ${res.failedCount} failed` : ''}`
      );
      setSubject('');
      setBody('');
      setSelectedIds([]);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const toggleStudent = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Card className="mx-auto max-w-2xl">
      <h3 className="text-xl font-semibold tracking-tight text-sand-900">
        Email your students
      </h3>
      <p className="mt-1 text-sm text-sand-600">Send an announcement to a group, or pick specific students.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !body.trim()) return toast.error('Subject and message are required');
          if (mode === 'specific' && selectedIds.length === 0) {
            return toast.error('Select at least one student');
          }
          send.mutate();
        }}
        className="mt-6 space-y-4"
      >
        <Field label="Send to">
          <div className="flex gap-1 rounded-lg border border-sand-200 bg-sand-100 p-1">
            {(['group', 'specific'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-current={mode === m ? 'page' : undefined}
                className={
                  mode === m
                    ? 'flex-1 rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-sand-900 shadow-sm transition-colors'
                    : 'flex-1 rounded-md px-4 py-1.5 text-sm font-medium text-sand-600 transition-colors hover:text-sand-900'
                }
              >
                {m === 'group' ? 'A group' : 'Specific students'}
              </button>
            ))}
          </div>
        </Field>

        {mode === 'group' ? (
          <Field label="Group">
            <Select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value as typeof targetGroup)}
            >
              <option value="all">All students</option>
              <option value="active">Active students</option>
              <option value="inactive">Inactive students</option>
            </Select>
          </Field>
        ) : (
          <Field label={`Students (${selectedIds.length} selected)`}>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-sand-200">
              {pickerLoading ? (
                <CenteredSpinner />
              ) : !pickerStudents || pickerStudents.students.length === 0 ? (
                <p className="p-4 text-sm text-sand-500">No active students found.</p>
              ) : (
                pickerStudents.students.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-sand-100 px-4 py-2.5 last:border-b-0 hover:bg-sand-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="h-4 w-4 rounded border-sand-300 text-sun-600 focus:ring-sun-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-sand-900">{s.studentName}</span>
                      <span className="block text-xs text-sand-500">{s.studentEmail}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </Field>
        )}

        <Field label="Subject">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Holiday schedule update"
            maxLength={200}
          />
        </Field>
        <Field label="Message">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Hi everyone, …"
            maxLength={5000}
          />
        </Field>
        <Button type="submit" loading={send.isPending}>
          <Send className="h-4 w-4" /> Send email
        </Button>
      </form>
    </Card>
  );
}

// ===========================================================================
// Tab: Settings
// ===========================================================================
const DURATIONS = [30, 45, 60, 90, 120];

function SettingsTab({ website }: { website: Website }) {
  const qc = useQueryClient();
  const { copied, copy } = useCopy();
  const { data, isLoading } = useQuery({
    queryKey: ['settings', website.id],
    queryFn: () => drivingSchoolApi.getSettings(website.id),
  });

  const [form, setForm] = useState<DrivingSettings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: Partial<DrivingSettings>) =>
      drivingSchoolApi.updateSettings(website.id, payload),
    onSuccess: (res) => {
      toast.success('Settings saved');
      setForm(res);
      qc.invalidateQueries({ queryKey: ['settings', website.id] });
      qc.invalidateQueries({ queryKey: ['daily-report', website.id] });
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  if (isLoading || !form) return <CenteredSpinner />;

  const hours: BusinessHours = form.workingHours ?? {};
  const enrollUrl = `${window.location.origin}/p/${website.slug}/enroll`;

  const setDay = (
    day: string,
    patch: Partial<{ isOpen: boolean; open: string; close: string }>
  ) => {
    const current = hours[day] ?? { isOpen: true, open: '08:00', close: '18:00' };
    setForm({ ...form, workingHours: { ...hours, [day]: { ...current, ...patch } } });
  };

  const randomCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, enrollmentCode: c });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({
      enrollmentCode: form.enrollmentCode,
      classDuration: form.classDuration,
      advanceBookingDays: form.advanceBookingDays,
      bookingCutoffHour: form.bookingCutoffHour,
      bookingWindowStart: form.bookingWindowStart,
      bookingWindowEnd: form.bookingWindowEnd,
      reportTime: form.reportTime,
      dailyCodeEnabled: form.dailyCodeEnabled,
      breakTimes: form.breakTimes,
      restMinutes: form.restMinutes,
      workingHours: form.workingHours,
      teacherName: form.teacherName,
      pricePerClass: form.pricePerClass ?? undefined,
      experienceYears: form.experienceYears ?? undefined,
      passRate: form.passRate ?? undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Enrollment code */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Enrollment code
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          Optional permanent code. Leave blank to rely only on the rotating daily code.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Static enrollment code" hint="At least 4 characters">
            <div className="flex gap-2">
              <Input
                value={form.enrollmentCode}
                onChange={(e) =>
                  setForm({ ...form, enrollmentCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g. DRIVE2026"
              />
              <Button type="button" variant="secondary" onClick={randomCode} title="Generate">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <Field label="Public enroll link">
            <div className="flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2.5">
              <code className="flex-1 truncate text-sm text-sand-600">{enrollUrl}</code>
              <button
                type="button"
                onClick={() => copy(enrollUrl, 'enroll')}
                className="rounded-md p-1.5 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800"
                aria-label="Copy enroll link"
              >
                {copied === 'enroll' ? (
                  <Check className="h-4 w-4 text-sand-900" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.dailyCodeEnabled}
            onChange={(e) => setForm({ ...form, dailyCodeEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-sand-300 text-sun-600 focus:ring-sun-500"
          />
          <span className="text-sm text-sand-700">Enable rotating daily code</span>
        </label>
      </Card>

      {/* Lesson settings */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Lesson settings
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Lesson duration">
            <Select
              value={form.classDuration}
              onChange={(e) => setForm({ ...form, classDuration: Number(e.target.value) })}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Advance booking (days)">
            <NumberInput
              min={1}
              max={90}
              value={form.advanceBookingDays}
              onValueChange={(n) => setForm({ ...form, advanceBookingDays: n })}
            />
          </Field>
          <Field label="Same-day cutoff hour" hint="0–23 (UTC)">
            <NumberInput
              min={0}
              max={23}
              value={form.bookingCutoffHour}
              onValueChange={(n) => setForm({ ...form, bookingCutoffHour: n })}
            />
          </Field>
          <Field label="Rest between (min)">
            <NumberInput
              min={0}
              max={120}
              value={form.restMinutes}
              onValueChange={(n) => setForm({ ...form, restMinutes: n })}
            />
          </Field>
        </div>
      </Card>

      {/* Booking window */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Booking window
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          Each day, enrolled students get a “booking is open” email at the open time and can book their
          next lesson until it closes. You’re emailed tomorrow’s full schedule at the report time. Times
          are in Israel time.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Booking opens" hint="Students notified + can book">
            <Input
              type="time"
              value={form.bookingWindowStart}
              onChange={(e) => setForm({ ...form, bookingWindowStart: e.target.value })}
            />
          </Field>
          <Field label="Booking closes">
            <Input
              type="time"
              value={form.bookingWindowEnd}
              onChange={(e) => setForm({ ...form, bookingWindowEnd: e.target.value })}
            />
          </Field>
          <Field label="Daily report time" hint="Tomorrow’s schedule emailed to you">
            <Input
              type="time"
              value={form.reportTime}
              onChange={(e) => setForm({ ...form, reportTime: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Working hours */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Working hours
        </h3>
        <div className="mt-4 space-y-2">
          {WEEKDAYS.map((day) => {
            const d = hours[day] ?? { isOpen: false, open: '08:00', close: '18:00' };
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 bg-sand-50 p-3 transition-colors hover:border-sand-300"
              >
                <label className="flex w-32 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={d.isOpen}
                    onChange={(e) => setDay(day, { isOpen: e.target.checked })}
                    className="h-4 w-4 rounded border-sand-300 text-sun-600 focus:ring-sun-500"
                  />
                  <span className="font-medium text-sand-800">{titleCase(day)}</span>
                </label>
                {d.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) => setDay(day, { open: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-sand-500">to</span>
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) => setDay(day, { close: e.target.value })}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-sand-500">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Break times */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-sand-900">
              Break times
            </h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setForm({
                ...form,
                breakTimes: [...(form.breakTimes ?? []), { start: '12:00', end: '13:00' }],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add break
          </Button>
        </div>
        {form.breakTimes && form.breakTimes.length > 0 ? (
          <div className="mt-4 space-y-2">
            {form.breakTimes.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 p-3"
              >
                <Input
                  type="time"
                  value={b.start}
                  onChange={(e) => {
                    const next = [...form.breakTimes];
                    next[i] = { ...next[i], start: e.target.value };
                    setForm({ ...form, breakTimes: next });
                  }}
                  className="w-32"
                />
                <span className="text-sand-500">to</span>
                <Input
                  type="time"
                  value={b.end}
                  onChange={(e) => {
                    const next = [...form.breakTimes];
                    next[i] = { ...next[i], end: e.target.value };
                    setForm({ ...form, breakTimes: next });
                  }}
                  className="w-32"
                />
                <button
                  type="button"
                  aria-label="Remove break"
                  onClick={() =>
                    setForm({ ...form, breakTimes: form.breakTimes.filter((_, j) => j !== i) })
                  }
                  className="ms-auto rounded-lg p-2 text-ember-600 transition-colors hover:bg-ember-50 hover:text-ember-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-sand-500">No breaks configured.</p>
        )}
      </Card>

      {/* Public profile */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          Public profile
        </h3>
        <p className="mt-1 text-sm text-sand-600">Shown on your public booking site.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Teacher name">
            <Input
              value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
            />
          </Field>
          <Field label="Price per lesson">
            <Input
              type="number"
              min={0}
              value={form.pricePerClass ?? ''}
              onChange={(e) =>
                setForm({ ...form, pricePerClass: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>
          <Field label="Years of experience" hint='e.g. "10+"'>
            <Input
              value={form.experienceYears ?? ''}
              onChange={(e) =>
                setForm({ ...form, experienceYears: e.target.value || null })
              }
            />
          </Field>
          <Field label="Pass rate (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.passRate ?? ''}
              onChange={(e) =>
                setForm({ ...form, passRate: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>
        </div>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" loading={save.isPending} className="shadow-elevated">
          Save settings
        </Button>
      </div>
    </form>
  );
}

// ===========================================================================
// Main
// ===========================================================================
export default function DrivingSchool() {
  const [tab, setTab] = useState<TabKey>('code');
  const [websiteId, setWebsiteId] = useState<string>('');

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites'],
    queryFn: websiteApi.list,
  });

  useEffect(() => {
    if (websites && websites.length > 0 && !websiteId) setWebsiteId(websites[0].id);
  }, [websites, websiteId]);

  const website = useMemo(
    () => websites?.find((w) => w.id === websiteId),
    [websites, websiteId]
  );

  if (isLoading) return <CenteredSpinner label="Loading…" />;

  if (!websites || websites.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-12 w-12" />}
        title="No driving school yet"
        description="Create one from the Overview page to get started."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
              Manage your school
            </h1>
            <p className="mt-1 text-sand-600">Students, schedule, codes, and settings — all in one place.</p>
          </div>
          {websites.length > 1 && (
            <Select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="w-auto"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </FadeUp>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-sand-200 bg-sand-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'flex shrink-0 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-sand-900 shadow-sm transition-colors'
                  : 'flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-sand-600 transition-colors hover:text-sand-900'
              }
            >
              <Icon strokeWidth={1.75} className={`h-4 w-4 ${active ? 'text-sand-900' : 'text-sand-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {website && (
        <Stagger className="animate-fade-in">
          <Stagger.Item>
            {tab === 'code' && <CodeTab website={website} />}
            {tab === 'students' && <StudentsTab website={website} />}
            {tab === 'schedule' && <ScheduleTab website={website} />}
            {tab === 'email' && <EmailTab website={website} />}
            {tab === 'settings' && <SettingsTab website={website} />}
          </Stagger.Item>
        </Stagger>
      )}
    </div>
  );
}
