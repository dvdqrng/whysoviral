import { ColumnLayout } from "../components/column-layout";

export default function ApiUsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ColumnLayout>
      {children}
    </ColumnLayout>
  );
} 