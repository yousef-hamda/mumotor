import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, Trash2, User } from 'lucide-react';
import { apiError, authApi, websiteApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Input, Modal, Select } from '../../components/ui';
import { FadeUp } from '../../components/motion';
import type { Website } from '../../lib/types';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { i18n, t } = useTranslation();

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    preferredLanguage: (user?.preferredLanguage ?? 'EN') as 'HE' | 'AR' | 'EN',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = useMutation({
    mutationFn: () => authApi.updateMe(profile),
    onSuccess: (u) => {
      updateUser(u);
      i18n.changeLanguage(profile.preferredLanguage.toLowerCase());
      toast.success(t('dashboard.account.profileSavedToast'));
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const changePw = useMutation({
    mutationFn: () => authApi.changePassword(pw),
    onSuccess: () => { toast.success(t('dashboard.account.passwordChangedToast')); setPw({ currentPassword: '', newPassword: '' }); },
    onError: (e) => toast.error(apiError(e).message),
  });

  const qc = useQueryClient();
  const { data: sites = [] } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  const [toDelete, setToDelete] = useState<Website | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const del = useMutation({
    mutationFn: () => websiteApi.remove(toDelete!.id, confirmText),
    onSuccess: () => {
      toast.success(t('dashboard.account.websiteDeletedToast'));
      qc.invalidateQueries({ queryKey: ['websites'] });
      setToDelete(null);
      setConfirmText('');
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <FadeUp>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
            {t('dashboard.account.title')}
          </h1>
          <p className="mt-1 text-sand-600">{t('dashboard.account.subtitle')}</p>
        </div>
      </FadeUp>

      {/* Profile card */}
      <FadeUp delay={0.06}>
        <Card>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand-100 text-sand-700">
              <User strokeWidth={1.75} className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-sand-900">{t('dashboard.account.profile')}</h3>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
            className="space-y-4"
          >
            <Field label={t('dashboard.account.fullName')}>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </Field>
            <Field label={t('dashboard.account.email')}>
              <Input value={user?.email ?? ''} disabled className="opacity-60" />
            </Field>
            <Field label={t('dashboard.account.phone')}>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </Field>
            <Field label={t('dashboard.account.preferredLanguage')}>
              <Select
                value={profile.preferredLanguage}
                onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value as 'HE' | 'AR' | 'EN' })}
              >
                <option value="EN">{t('dashboard.account.langEn')}</option>
                <option value="HE">{t('dashboard.account.langHe')}</option>
                <option value="AR">{t('dashboard.account.langAr')}</option>
              </Select>
            </Field>
            <Button type="submit" loading={saveProfile.isPending}>
              {t('dashboard.account.saveProfile')}
            </Button>
          </form>
        </Card>
      </FadeUp>

      {/* Password card */}
      <FadeUp delay={0.12}>
        <Card>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand-100 text-sand-700">
              <KeyRound strokeWidth={1.75} className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-sand-900">{t('dashboard.account.changePassword')}</h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.newPassword.length < 8) return toast.error(t('dashboard.account.errPasswordLength'));
              changePw.mutate();
            }}
            className="space-y-4"
          >
            <Field label={t('dashboard.account.currentPassword')}>
              <Input
                type="password"
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </Field>
            <Field label={t('dashboard.account.newPassword')} hint={t('dashboard.account.newPasswordHint')}>
              <Input
                type="password"
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" loading={changePw.isPending}>
              {t('dashboard.account.changePassword')}
            </Button>
          </form>
        </Card>
      </FadeUp>

      {/* Danger zone — delete websites */}
      <FadeUp delay={0.18}>
        <Card className="border-ember-200">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-50 text-ember-600">
              <Trash2 strokeWidth={1.75} className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-sand-900">{t('dashboard.account.deleteWebsite')}</h3>
              <p className="text-sm text-sand-500">{t('dashboard.account.deleteWebsiteDesc')}</p>
            </div>
          </div>
          {sites.length === 0 ? (
            <p className="text-sm text-sand-500">{t('dashboard.account.noWebsites')}</p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {sites.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sand-900">{s.name}</p>
                    <p className="truncate text-xs text-sand-500">/{s.slug} · {s.status}</p>
                  </div>
                  <Button variant="danger" onClick={() => { setToDelete(s); setConfirmText(''); }} className="shrink-0">
                    <Trash2 className="h-4 w-4" /> {t('dashboard.account.delete')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </FadeUp>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('dashboard.account.deleteModalTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>{t('dashboard.account.cancel')}</Button>
            <Button variant="danger" disabled={confirmText.trim().toUpperCase() !== 'DELETE'} loading={del.isPending} onClick={() => del.mutate()}>
              {t('dashboard.account.deletePermanently')}
            </Button>
          </>
        }
      >
        <p className="text-sand-600">
          <Trans
            i18nKey="dashboard.account.deleteModalBody"
            values={{ name: toDelete?.name }}
            components={{ s: <strong className="text-sand-900" />, b: <strong /> }}
          />
        </p>
        <div className="mt-4">
          <Field label={t('dashboard.account.typeDeleteConfirm')}>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoFocus />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
