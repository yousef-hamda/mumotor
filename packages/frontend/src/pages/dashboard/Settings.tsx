import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, SlidersHorizontal, User } from 'lucide-react';
import { apiError, authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Input, Select } from '../../components/ui';
import { FadeUp } from '../../components/motion';

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
    <div className="mx-auto max-w-2xl space-y-7">
      <FadeUp>
        <div>
          <p className="section-eyebrow">
            <SlidersHorizontal className="h-3.5 w-3.5 text-sun-500" /> Settings
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tightest text-sand-950">
            Your account
          </h1>
          <p className="mt-1 text-sand-500">Profile, language, and security settings.</p>
        </div>
      </FadeUp>

      {/* Profile card */}
      <FadeUp delay={0.06}>
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full sun-glow opacity-20 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sun-200 bg-sun-50 text-sun-600">
                <User className="h-4.5 w-4.5" />
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight text-sand-950">Profile</h3>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
              className="space-y-4"
            >
              <Field label="Full name">
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input value={user?.email ?? ''} disabled className="opacity-60" />
              </Field>
              <Field label="Phone">
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </Field>
              <Field label="Preferred language">
                <Select
                  value={profile.preferredLanguage}
                  onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value as 'HE' | 'AR' | 'EN' })}
                >
                  <option value="EN">English</option>
                  <option value="HE">עברית (Hebrew)</option>
                  <option value="AR">العربية (Arabic)</option>
                </Select>
              </Field>
              <Button type="submit" loading={saveProfile.isPending}>
                Save profile
              </Button>
            </form>
          </div>
        </Card>
      </FadeUp>

      {/* Password card */}
      <FadeUp delay={0.12}>
        <Card className="relative overflow-hidden">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ember-200/70 bg-ember-50 text-ember-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-semibold tracking-tight text-sand-950">Change password</h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
              changePw.mutate();
            }}
            className="space-y-4"
          >
            <Field label="Current password">
              <Input
                type="password"
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <Input
                type="password"
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" loading={changePw.isPending}>
              Change password
            </Button>
          </form>
        </Card>
      </FadeUp>
    </div>
  );
}
