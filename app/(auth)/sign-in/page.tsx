'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const githubEnabled = process.env.NEXT_PUBLIC_GITHUB_ENABLED === 'true';
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const { error } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      toast.error(error.message ?? 'Sign in failed');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function onOAuth(provider: 'github' | 'google') {
    await authClient.signIn.social({ provider, callbackURL: callbackUrl });
  }

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold">登录</h1>
        <p className="text-sm text-muted-foreground">使用邮箱密码或第三方账号登录 OpenMAIC</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? '登录中…' : '登录'}
        </Button>
      </form>

      {(githubEnabled || googleEnabled) && (
        <div className="mt-6 space-y-2">
          <div className="text-center text-xs text-muted-foreground">或</div>
          {githubEnabled && (
            <Button variant="outline" className="w-full" onClick={() => onOAuth('github')}>
              GitHub 登录
            </Button>
          )}
          {googleEnabled && (
            <Button variant="outline" className="w-full" onClick={() => onOAuth('google')}>
              Google 登录
            </Button>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{' '}
        <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}
