import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";

export function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const displayName =
    user?.full_name || user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        <section className="section-py">
          <div className="container-main max-w-2xl">
            <div className="mb-8 flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                   className="h-16 w-16 rounded-full border border-moss-600/30 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-600/20 font-mono text-2xl font-medium text-moss-600">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-display text-h2 text-ink-900 dark:text-mist-50">
                  {displayName}
                </h1>
                <p className="text-caption text-ink-900/60 dark:text-mist-50/60">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-stone-200 dark:divide-moss-600/30">
              <div className="flex justify-between py-3">
                <span className="text-caption text-ink-900/60 dark:text-mist-50/60">Role</span>
                <span className="text-body font-medium text-ink-900 dark:text-mist-50">{user?.role}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-caption text-ink-900/60 dark:text-mist-50/60">Account type</span>
                <span className="text-body font-medium text-ink-900 dark:text-mist-50">
                  {user?.oauth_provider
                    ? `Signed in with ${user.oauth_provider}`
                    : user?.is_demo_account !== false
                      ? "Demo account"
                      : "Password"}
                </span>
              </div>
              {user?.oauth_provider && (
                <div className="flex justify-between py-3">
                  <span className="text-caption text-ink-900/60 dark:text-mist-50/60">Linked provider</span>
                  <span className="text-body font-medium capitalize text-ink-900 dark:text-mist-50">{user.oauth_provider}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <Link to="/dashboard">
                <Button variant="primary-pill" size="sm">Go to Dashboard</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={logout}>Log out</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
