import { ColumnLayout } from "../components/column-layout";

export default function Layout({
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