import { DailySnapshotPage } from "@/components/daily-snapshot-page";

export const metadata = {
  title: "Daily Snapshot",
  description: "Sieh dir einen gespeicherten Daily Snapshot in deinem Personal Journal an.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DailySnapshotPage id={id} />;
}
