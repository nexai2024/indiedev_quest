"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { GitBranch } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type GithubStatus = {
  connected: boolean;
  hasRepoAccess: boolean;
  login: string | null;
  scopes: string[];
};

function clerkErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    const first = errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not start GitHub authorization. Enable GitHub in Clerk with custom credentials so the repo scope can be requested.";
}

export default function ConnectGitHub({ redirectTo = "/quests?github=connected" }: { redirectTo?: string }) {
  const { user, isSignedIn } = useUser();
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/github/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as GithubStatus;
      setStatus(data);
    } catch {
      // Keep last known status.
    }
  }, [isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`;
      const existing = user.externalAccounts.find((account) => account.provider === "github");
      const result = existing
        ? await existing.reauthorize({ additionalScopes: ["repo"], redirectUrl })
        : await user.createExternalAccount({
            strategy: "oauth_github",
            additionalScopes: ["repo"],
            redirectUrl,
          });
      const nextUrl = result.verification?.externalVerificationRedirectURL;
      if (!nextUrl) {
        toast.error("GitHub did not return an authorization URL. Enable GitHub SSO in Clerk first.");
        return;
      }
      window.location.assign(nextUrl.href);
    } catch (error) {
      toast.error(clerkErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs font-mono text-gray-400">
        Sign in, then connect GitHub with repo access to prove a private repository without making it public.
      </div>
    );
  }

  if (status?.hasRepoAccess) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono text-emerald-300">
        <GitBranch className="h-4 w-4" />
        GitHub connected{status.login ? ` as @${status.login}` : ""}. Private repos you can open will pass.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
      <p className="text-xs font-mono text-gray-400">
        Private GitHub repos look like 404 until you authorize repo access. We only read repo metadata, not your code.
      </p>
      <Button type="button" variant="outline" className="font-game text-lg" onClick={connect} disabled={busy}>
        <GitBranch className="mr-2 h-4 w-4" />
        {busy ? "Opening GitHub..." : status?.connected ? "Grant private repo access" : "Connect GitHub"}
      </Button>
    </div>
  );
}
