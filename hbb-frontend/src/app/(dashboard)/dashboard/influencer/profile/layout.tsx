import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="pt-20 lg:pt-16 px-8 lg:px-12 h-screen blur-bg">
      <div className="">{children}</div>
    </main>
  );
}
