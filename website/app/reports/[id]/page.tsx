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
      <p>Title: {reportData.name}</p>
      <p>Location of distress: {reportData.position}</p>
      <p>Priority: {reportData.priority}</p>
      <p>metadata: {Object.keys(reportData.metadata).map((key, i) => {
        return (<p>{key}: {reportData.metadata[`${key}`]}</p>)
      })}</p>
    </div>
  );
};