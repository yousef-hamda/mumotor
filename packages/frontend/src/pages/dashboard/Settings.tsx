import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiError, authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Input, Select } from '../../components/ui';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { i18n } = useTranslation();

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
      toast.success('Profile saved');
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const changePw = useMutation({
    mutationFn: () => authApi.changePassword(pw),
    onSuccess: () => { toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }); },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500">Your profile, language, and password.</p>
      </div>

      <Card>
        <h3 className="text-lg font-bold">Profile</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
          className="mt-4 space-y-4"
        >
          <Field label="Full name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
          <Field label="Email"><Input value={user?.email ?? ''} disabled className="opacity-60" /></Field>
          <Field label="Phone"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
          <Field label="Preferred language">
            <Select value={profile.preferredLanguage} onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value as 'HE' | 'AR' | 'EN' })}>
              <option value="EN">English</option>
              <option value="HE">עברית (Hebrew)</option>
              <option value="AR">العربية (Arabic)</option>
            </Select>
          </Field>
          <Button type="submit" loading={saveProfile.isPending}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-bold">Change password</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); if (pw.newPassword.length < 8) return toast.error('New password must be at least 8 characters'); changePw.mutate(); }}
          className="mt-4 space-y-4"
        >
          <Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password" hint="At least 8 characters"><Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
          <Button type="submit" loading={changePw.isPending}>Change password</Button>
        </form>
      </Card>
    </div>
  );
}
