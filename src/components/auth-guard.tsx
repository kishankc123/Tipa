"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Starts false so server and first client render match (no `window` on
  // the server); flips after mount once we can read the real token. This
  // is the one legitimate case for setState-in-effect: whether the user
  // is authenticated genuinely isn't knowable until the client mounts.
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
