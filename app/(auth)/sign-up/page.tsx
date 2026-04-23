'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    // 邀请码字段当前仅前端收集，校验逻辑在 Phase 1 接入
    const { error } = await authClient.signUp.email({ email, password, name });
    setPending(false);
    if (error) {
      toast.error(error.message ?? 'Sign up failed');
      return;
    }
    if (inviteCode) {
      // 暂存供 Phase 1 兑换流程使用
      sessionStorage.setItem('pendingInviteCode', inviteCode);
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold">注册</h1>
        <p className="text-sm text-muted-foreground">创建 OpenMAIC 账号</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">昵称</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">至少 8 位字符</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite">邀请码（可选）</Label>
          <Input
            id="invite"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? '创建中…' : '创建账号'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？{' '}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
