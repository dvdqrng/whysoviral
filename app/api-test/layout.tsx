import { ColumnLayout } from "../components/column-layout";

export default function ApiTestLayout({
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