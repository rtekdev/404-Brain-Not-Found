import { getReportById } from "@/lib/reports";
import Reports from "../reports";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) { 
  const { id } = await params;
  const reportData = await getReportById(id);

  if (!reportData) return <p>There is no such report...</p>

  return (
    <div>
      <p>ID: {reportData.id}</p>
      <p>Title: {reportData.title}</p>
      <p>Location of distress: {reportData.position}</p>
      <p>Priority: {reportData.status}</p>
    </div>
  );
};