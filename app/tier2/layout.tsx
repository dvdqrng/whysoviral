import { ColumnLayout } from "../components/column-layout";

export default function Tier2Layout({
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