"use client";
import { SessionProvider } from "next-auth/react";

export default function NextAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Không tự fetch lại khi focus: response đến muộn có thể ghi đè phiên vừa được proxy làm mới
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
