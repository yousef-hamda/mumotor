import { useEffect, useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
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
import { WEEKDAYS, formatDate, formatDateLong } from '../../lib/utils';
import type { BusinessHours, DrivingSettings, ScheduleDay, Student, Website } from '../../lib/types';

const TABS = [
  { key: 'code', labelKey: 'dashboard.school.tabs.code', icon: KeyRound },
  { key: 'students', labelKey: 'dashboard.school.tabs.students', icon: Users },
  { key: 'schedule', labelKey: 'dashboard.school.tabs.schedule', icon: CalendarDays },
  { key: 'email', labelKey: 'dashboard.school.tabs.email', icon: Mail },
  { key: 'settings', labelKey: 'dashboard.school.tabs.settings', icon: SettingsIcon },
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
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const { data, isLoading } = useQuery({
    queryKey: ['daily-code', website.id],
    queryFn: () => drivingSchoolApi.getDailyCode(website.id),
  });
  const enrollUrl = `${window.location.origin}/p/${website.slug}/enroll`;

  if (isLoading) return <CenteredSpinner />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Daily code card */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          {t('dashboard.school.code.todayTitle')}
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          {t('dashboard.school.code.todayDesc')}
        </p>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-sand-200 bg-sand-50 p-6 sm:p-8">
          <span className="max-w-full break-all text-center font-mono text-3xl font-bold tracking-[0.2em] tabular-nums text-sand-900 sm:text-5xl sm:tracking-[0.3em]">{data?.code}</span>
          <Button variant="secondary" onClick={() => copy(data?.code ?? '')}>
            {copied === data?.code ? (
              <Check className="h-4 w-4 text-sand-900" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === data?.code ? t('dashboard.school.code.copied') : t('dashboard.school.code.copyCode')}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-sand-500">
          {t('dashboard.school.code.validFor', { date: formatDate(new Date().toISOString()) })}
        </p>
      </Card>

      {/* Enroll link card */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          {t('dashboard.school.code.linkTitle')}
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          {t('dashboard.school.code.linkDesc')}
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate text-sm text-sand-700">{enrollUrl}</code>
          <button
            onClick={() => copy(enrollUrl, 'link')}
            className="flex shrink-0 items-center justify-center rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
            aria-label={t('dashboard.school.code.copyEnrollLink')}
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
          {t('dashboard.school.code.openEnrollPage')} <ExternalLink className="h-4 w-4" />
        </a>
        <div className="mt-6 rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm text-sand-600">
          <Trans i18nKey="dashboard.school.code.staticHint" components={{ s: <strong className="font-semibold text-sand-900" /> }} />
        </div>
      </Card>
    </div>
  );
}

// ===========================================================================
// Tab: Students
// ===========================================================================
function StudentsTab({ website }: { website: Website }) {
  const { t } = useTranslation();
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
      toast.success(t('dashboard.school.students.statusUpdated'));
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });
  const finish = useMutation({
    mutationFn: (id: string) => drivingSchoolApi.finishStudent(website.id, id),
    onSuccess: () => {
      toast.success(t('dashboard.school.students.markedCompleted'));
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => drivingSchoolApi.removeStudent(website.id, id),
    onSuccess: () => {
      toast.success(t('dashboard.school.students.studentDeleted'));
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
      toast.success(t('dashboard.school.students.studentAdded'));
      setAddOpen(false);
      setAddForm(emptyAdd);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  // Shared row actions (used by both the desktop table and the mobile card list).
  // Icon buttons grow to 44px on touch devices via the `coarse:` variant.
  const actions = (s: Student) => (
    <div className="flex items-center justify-end gap-1">
      {s.status !== 'COMPLETED' && (
        <button
          aria-label={s.status === 'ACTIVE' ? t('dashboard.school.students.pauseStudent') : t('dashboard.school.students.activateStudent')}
          title={s.status === 'ACTIVE' ? t('dashboard.school.students.pause') : t('dashboard.school.students.activate')}
          onClick={() => toggle.mutate(s.id)}
          className="flex items-center justify-center rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
        >
          {s.status === 'ACTIVE' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        </button>
      )}
      {s.status !== 'COMPLETED' && (
        <button
          aria-label={t('dashboard.school.students.markCompleted')}
          title={t('dashboard.school.students.markCompletedShort')}
          onClick={() => finish.mutate(s.id)}
          className="flex items-center justify-center rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
        >
          <GraduationCap className="h-4 w-4" />
        </button>
      )}
      <button
        aria-label={t('dashboard.school.students.deleteStudent')}
        title={t('dashboard.school.students.deleteShort')}
        onClick={() => setToDelete(s)}
        className="flex items-center justify-center rounded-lg p-2 text-ember-600 transition-colors hover:bg-ember-50 hover:text-ember-700 coarse:min-h-11 coarse:min-w-11"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <Card className="p-0">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.school.students.searchPlaceholder')}
            className="ps-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">{t('dashboard.school.students.allStatuses')}</option>
          <option value="ACTIVE">{t('dashboard.school.students.active')}</option>
          <option value="INACTIVE">{t('dashboard.school.students.inactive')}</option>
          <option value="COMPLETED">{t('dashboard.school.students.completed')}</option>
        </Select>
        <Button type="button" variant="primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t('dashboard.school.students.addStudent')}
        </Button>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : !data || data.students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={t('dashboard.school.students.emptyTitle')}
          description={t('dashboard.school.students.emptyDesc')}
        />
      ) : (
        <>
          {/* Desktop / tablet-landscape: full table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50 text-start text-xs uppercase tracking-wide text-sand-500">
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colName')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colEmail')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colPhone')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colClasses')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colEnrolled')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.school.students.colStatus')}</th>
                  <th className="px-4 py-3 text-end font-semibold">{t('dashboard.school.students.colActions')}</th>
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
                    <td className="px-4 py-3">{actions(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone / tablet-portrait: stacked cards (no horizontal scroll) */}
          <ul className="divide-y divide-sand-200 md:hidden">
            {data.students.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sand-900">{s.studentName}</p>
                    <p className="truncate text-sm text-sand-600">{s.studentEmail}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs text-sand-500">{t('dashboard.school.students.colPhone')}</dt>
                    <dd className="truncate text-sand-700">{s.studentPhone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-sand-500">{t('dashboard.school.students.colClasses')}</dt>
                    <dd className="font-semibold tabular-nums text-sand-900">{s.classCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-sand-500">{t('dashboard.school.students.colEnrolled')}</dt>
                    <dd className="tabular-nums text-sand-700">{formatDate(s.enrolledAt)}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-sand-100 pt-2">{actions(s)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-sand-200 p-4 text-sm">
          <span className="tabular-nums text-sand-600">
            {t('dashboard.school.students.pagination', { page: data.page, totalPages: data.totalPages, total: data.total })}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('dashboard.school.students.previous')}
            </Button>
            <Button
              variant="secondary"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('dashboard.school.students.next')}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('dashboard.school.students.deleteTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              {t('dashboard.common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => toDelete && remove.mutate(toDelete.id)}
            >
              {t('dashboard.common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-sand-600">
          <Trans
            i18nKey="dashboard.school.students.deleteBody"
            values={{ name: toDelete?.studentName }}
            components={{ s: <strong className="text-sand-900" /> }}
          />
        </p>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('dashboard.school.students.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t('dashboard.common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={add.isPending}
              onClick={() => {
                if (addForm.studentName.trim().length < 2) return toast.error(t('dashboard.school.students.errName'));
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addForm.studentEmail.trim()))
                  return toast.error(t('dashboard.school.students.errEmail'));
                if (!/^[+\d][\d\s-]{6,18}$/.test(addForm.studentPhone.trim()))
                  return toast.error(t('dashboard.school.students.errPhone'));
                add.mutate();
              }}
            >
              {t('dashboard.school.students.addStudent')}
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-sand-600">
          {t('dashboard.school.students.addDesc')}
        </p>
        <div className="space-y-4">
          <Field label={t('dashboard.school.students.fullName')}>
            <Input
              value={addForm.studentName}
              onChange={(e) => setAddForm({ ...addForm, studentName: e.target.value })}
              placeholder={t('dashboard.school.students.fullNamePlaceholder')}
            />
          </Field>
          <Field label={t('dashboard.school.students.email')}>
            <Input
              type="email"
              value={addForm.studentEmail}
              onChange={(e) => setAddForm({ ...addForm, studentEmail: e.target.value })}
              placeholder={t('dashboard.school.students.emailPlaceholder')}
            />
          </Field>
          <Field label={t('dashboard.school.students.phone')}>
            <Input
              type="tel"
              value={addForm.studentPhone}
              onChange={(e) => setAddForm({ ...addForm, studentPhone: e.target.value })}
              placeholder={t('dashboard.school.students.phonePlaceholder')}
              required
            />
          </Field>
          <Field label={t('dashboard.school.students.notes')}>
            <Textarea
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              placeholder={t('dashboard.school.students.notesPlaceholder')}
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
  const { t } = useTranslation();
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
  const dayWord = (d: ScheduleDay) => t(d === 'today' ? 'dashboard.school.schedule.dayToday' : 'dashboard.school.schedule.dayTomorrow');
  const dayTitle = (d: ScheduleDay) => t(d === 'today' ? 'dashboard.school.schedule.today' : 'dashboard.school.schedule.tomorrow');

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) => drivingSchoolApi.cancelBooking(website.id, bookingId),
    onSuccess: () => {
      toast.success(t('dashboard.school.schedule.lessonCancelledToast'));
      setCancelTarget(null);
      invalidateReport();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const assign = useMutation({
    mutationFn: (enrollmentId: string) =>
      drivingSchoolApi.assignStudentToSlot(website.id, { enrollmentId, day, time: assignTime! }),
    onSuccess: () => {
      toast.success(t('dashboard.school.schedule.studentBookedToast'));
      setAssignTime(null);
      setStudentSearch('');
      invalidateReport();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const emailMe = useMutation({
    mutationFn: () => drivingSchoolApi.emailMeSchedule(website.id, { day }),
    onSuccess: () => toast.success(t('dashboard.school.schedule.emailedToast', { day: dayWord(day) })),
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
            {data ? formatDateLong(data.date) : dayTitle(day)}
          </h3>
          {data?.isOpen ? (
            <p className="mt-0.5 text-sm text-sand-600">
              {t('dashboard.school.schedule.openLabel')} {data.open}–{data.close} ·{' '}
              <span className="font-semibold tabular-nums text-sand-900">{data.totals.booked}</span> {t('dashboard.school.schedule.booked')} ·{' '}
              <span className="font-semibold tabular-nums text-sand-900">{data.totals.empty}</span> {t('dashboard.school.schedule.free')}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-sand-600">{t('dashboard.school.schedule.closedDay', { day: dayWord(day) })}</p>
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
                {dayTitle(d)}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => emailMe.mutate()} loading={emailMe.isPending}>
            <Mail className="h-4 w-4" /> {t('dashboard.school.schedule.emailMe')}
          </Button>
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" /> {t('dashboard.school.schedule.refresh')}
          </Button>
        </div>
      </div>

      {!data || data.slots.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={data?.isOpen ? t('dashboard.school.schedule.noSlotsDay', { day: dayWord(day) }) : t('dashboard.school.schedule.closedDay', { day: dayWord(day) })}
          description={t('dashboard.school.schedule.adjustHours')}
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
                  <span className="chip bg-sand-900 text-white">{t('dashboard.school.schedule.bookedChip')}</span>
                ) : (
                  <span className="chip bg-sand-200 text-sand-600">{t('dashboard.school.schedule.freeChip')}</span>
                )}
              </div>
              {slot.booked ? (
                <div className="mt-2">
                  <p className="font-semibold text-sand-900">{slot.studentName}</p>
                  {slot.studentPhone && (
                    <p className="text-sm text-sand-500">{slot.studentPhone}</p>
                  )}
                  {typeof slot.classCount === 'number' && (
                    <p className="mt-1 text-xs text-sand-500">{t('dashboard.school.schedule.lessonNum', { n: slot.classCount })}</p>
                  )}
                  {slot.bookingId && (
                    <button
                      onClick={() => setCancelTarget({ bookingId: slot.bookingId!, time: slot.time, studentName: slot.studentName })}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ember-600 hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> {t('dashboard.school.schedule.cancelLesson')}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAssignTime(slot.time)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sun-600 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" /> {t('dashboard.school.schedule.addStudent')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title={t('dashboard.school.schedule.cancelTitle')}>
        <p className="text-sm text-sand-600">
          <Trans
            i18nKey={cancelTarget?.studentName ? 'dashboard.school.schedule.cancelBodyNamed' : 'dashboard.school.schedule.cancelBodyUnnamed'}
            values={{ name: cancelTarget?.studentName, time: cancelTarget?.time }}
            components={{ s: <strong className="text-sand-900" /> }}
          />
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCancelTarget(null)}>{t('dashboard.school.schedule.keepLesson')}</Button>
          <Button
            variant="danger"
            loading={cancelBooking.isPending}
            onClick={() => cancelTarget && cancelBooking.mutate(cancelTarget.bookingId)}
          >
            {t('dashboard.school.schedule.cancelLesson')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={assignTime !== null}
        onClose={() => {
          setAssignTime(null);
          setStudentSearch('');
        }}
        title={t('dashboard.school.schedule.bookAt', { time: assignTime ?? '' })}
      >
        <div className="space-y-3">
          <Input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder={t('dashboard.school.schedule.searchActive')}
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto rounded-lg border border-sand-200">
            {pickerLoading ? (
              <CenteredSpinner />
            ) : !pickerStudents || pickerStudents.students.length === 0 ? (
              <p className="p-4 text-sm text-sand-500">{t('dashboard.school.schedule.noActive')}</p>
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
                    <span className="text-xs text-sand-400">{t('dashboard.school.schedule.booking')}</span>
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
  const { t } = useTranslation();
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
        t('dashboard.school.email.sentToast', { n: res.sentCount }) +
          (res.failedCount ? t('dashboard.school.email.failedSuffix', { failed: res.failedCount }) : '')
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
        {t('dashboard.school.email.title')}
      </h3>
      <p className="mt-1 text-sm text-sand-600">{t('dashboard.school.email.subtitle')}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !body.trim()) return toast.error(t('dashboard.school.email.errRequired'));
          if (mode === 'specific' && selectedIds.length === 0) {
            return toast.error(t('dashboard.school.email.errSelect'));
          }
          send.mutate();
        }}
        className="mt-6 space-y-4"
      >
        <Field label={t('dashboard.school.email.sendTo')}>
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
                {m === 'group' ? t('dashboard.school.email.aGroup') : t('dashboard.school.email.specific')}
              </button>
            ))}
          </div>
        </Field>

        {mode === 'group' ? (
          <Field label={t('dashboard.school.email.group')}>
            <Select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value as typeof targetGroup)}
            >
              <option value="all">{t('dashboard.school.email.allStudents')}</option>
              <option value="active">{t('dashboard.school.email.activeStudents')}</option>
              <option value="inactive">{t('dashboard.school.email.inactiveStudents')}</option>
            </Select>
          </Field>
        ) : (
          <Field label={t('dashboard.school.email.studentsSelected', { n: selectedIds.length })}>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-sand-200">
              {pickerLoading ? (
                <CenteredSpinner />
              ) : !pickerStudents || pickerStudents.students.length === 0 ? (
                <p className="p-4 text-sm text-sand-500">{t('dashboard.school.email.noActive')}</p>
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

        <Field label={t('dashboard.school.email.subject')}>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('dashboard.school.email.subjectPlaceholder')}
            maxLength={200}
          />
        </Field>
        <Field label={t('dashboard.school.email.message')}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder={t('dashboard.school.email.messagePlaceholder')}
            maxLength={5000}
          />
        </Field>
        <Button type="submit" loading={send.isPending}>
          <Send className="h-4 w-4" /> {t('dashboard.school.email.sendEmail')}
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
  const { t } = useTranslation();
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
      toast.success(t('dashboard.school.settings.savedToast'));
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
          {t('dashboard.school.settings.codeTitle')}
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          {t('dashboard.school.settings.codeDesc')}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('dashboard.school.settings.staticCode')} hint={t('dashboard.school.settings.staticCodeHint')}>
            <div className="flex gap-2">
              <Input
                value={form.enrollmentCode}
                onChange={(e) =>
                  setForm({ ...form, enrollmentCode: e.target.value.toUpperCase() })
                }
                placeholder={t('dashboard.school.settings.staticCodePlaceholder')}
              />
              <Button type="button" variant="secondary" onClick={randomCode} title={t('dashboard.school.settings.generate')}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <Field label={t('dashboard.school.settings.publicEnrollLink')}>
            <div className="flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2.5">
              <code className="min-w-0 flex-1 truncate text-sm text-sand-600">{enrollUrl}</code>
              <button
                type="button"
                onClick={() => copy(enrollUrl, 'enroll')}
                className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
                aria-label={t('dashboard.school.settings.copyEnrollLink')}
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
          <span className="text-sm text-sand-700">{t('dashboard.school.settings.enableDailyCode')}</span>
        </label>
      </Card>

      {/* Lesson settings */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          {t('dashboard.school.settings.lessonTitle')}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('dashboard.school.settings.lessonDuration')}>
            <Select
              value={form.classDuration}
              onChange={(e) => setForm({ ...form, classDuration: Number(e.target.value) })}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {t('dashboard.school.settings.minutes', { n: d })}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('dashboard.school.settings.advanceBooking')}>
            <NumberInput
              min={1}
              max={90}
              value={form.advanceBookingDays}
              onValueChange={(n) => setForm({ ...form, advanceBookingDays: n })}
            />
          </Field>
          <Field label={t('dashboard.school.settings.sameDayCutoff')} hint={t('dashboard.school.settings.sameDayCutoffHint')}>
            <NumberInput
              min={0}
              max={23}
              value={form.bookingCutoffHour}
              onValueChange={(n) => setForm({ ...form, bookingCutoffHour: n })}
            />
          </Field>
          <Field label={t('dashboard.school.settings.restBetween')}>
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
          {t('dashboard.school.settings.bookingWindowTitle')}
        </h3>
        <p className="mt-1 text-sm text-sand-600">
          {t('dashboard.school.settings.bookingWindowDesc')}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label={t('dashboard.school.settings.bookingOpens')} hint={t('dashboard.school.settings.bookingOpensHint')}>
            <Input
              type="time"
              value={form.bookingWindowStart}
              onChange={(e) => setForm({ ...form, bookingWindowStart: e.target.value })}
            />
          </Field>
          <Field label={t('dashboard.school.settings.bookingCloses')}>
            <Input
              type="time"
              value={form.bookingWindowEnd}
              onChange={(e) => setForm({ ...form, bookingWindowEnd: e.target.value })}
            />
          </Field>
          <Field label={t('dashboard.school.settings.dailyReportTime')} hint={t('dashboard.school.settings.dailyReportTimeHint')}>
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
          {t('dashboard.school.settings.workingHoursTitle')}
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
                  <span className="font-medium text-sand-800">{t(`dashboard.weekdays.${day}`)}</span>
                </label>
                {d.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) => setDay(day, { open: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-sand-500">{t('dashboard.common.to')}</span>
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) => setDay(day, { close: e.target.value })}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-sand-500">{t('dashboard.common.closed')}</span>
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
              {t('dashboard.school.settings.breakTimesTitle')}
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
            <Plus className="h-4 w-4" /> {t('dashboard.school.settings.addBreak')}
          </Button>
        </div>
        {form.breakTimes && form.breakTimes.length > 0 ? (
          <div className="mt-4 space-y-2">
            {form.breakTimes.map((b, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 p-3"
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
                <span className="text-sand-500">{t('dashboard.common.to')}</span>
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
                  aria-label={t('dashboard.school.settings.removeBreak')}
                  onClick={() =>
                    setForm({ ...form, breakTimes: form.breakTimes.filter((_, j) => j !== i) })
                  }
                  className="ms-auto flex items-center justify-center rounded-lg p-2 text-ember-600 transition-colors hover:bg-ember-50 hover:text-ember-700 coarse:min-h-11 coarse:min-w-11"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-sand-500">{t('dashboard.school.settings.noBreaks')}</p>
        )}
      </Card>

      {/* Public profile */}
      <Card>
        <h3 className="text-xl font-semibold tracking-tight text-sand-900">
          {t('dashboard.school.settings.publicProfileTitle')}
        </h3>
        <p className="mt-1 text-sm text-sand-600">{t('dashboard.school.settings.publicProfileDesc')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('dashboard.school.settings.teacherName')}>
            <Input
              value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
            />
          </Field>
          <Field label={t('dashboard.school.settings.pricePerLesson')}>
            <Input
              type="number"
              min={0}
              value={form.pricePerClass ?? ''}
              onChange={(e) =>
                setForm({ ...form, pricePerClass: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>
          <Field label={t('dashboard.school.settings.yearsExperience')} hint={t('dashboard.school.settings.yearsExperienceHint')}>
            <Input
              value={form.experienceYears ?? ''}
              onChange={(e) =>
                setForm({ ...form, experienceYears: e.target.value || null })
              }
            />
          </Field>
          <Field label={t('dashboard.school.settings.passRate')}>
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
          {t('dashboard.school.settings.saveSettings')}
        </Button>
      </div>
    </form>
  );
}

// ===========================================================================
// Main
// ===========================================================================
export default function DrivingSchool() {
  const { t } = useTranslation();
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

  if (isLoading) return <CenteredSpinner label={t('dashboard.common.loading')} />;

  if (!websites || websites.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-12 w-12" />}
        title={t('dashboard.school.emptyTitle')}
        description={t('dashboard.school.emptyDesc')}
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
              {t('dashboard.school.title')}
            </h1>
            <p className="mt-1 text-sand-600">{t('dashboard.school.subtitle')}</p>
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
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'flex shrink-0 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-sand-900 shadow-sm transition-colors'
                  : 'flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-sand-600 transition-colors hover:text-sand-900'
              }
            >
              <Icon strokeWidth={1.75} className={`h-4 w-4 ${active ? 'text-sand-900' : 'text-sand-400'}`} />
              {t(tb.labelKey)}
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
