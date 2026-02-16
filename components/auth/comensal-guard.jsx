"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isComensalLoggedIn } from "@/lib/auth";

export function ComensalGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isComensalLoggedIn()) {
      setAllowed(true);
    } else {
      const redirect = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirect);
    }
  }, [pathname, router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
