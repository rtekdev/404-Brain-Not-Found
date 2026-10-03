"use client"

import { ReportsResponse } from "@/lib/reports";

interface ReportsProps { 
  reports: ReportsResponse[];
};

export default function Reports({
  reports,
}: ReportsProps) { 


  return (
    <div>
      {reports.map((report, i) => (<div key={report.id}>
        <p>{report.id}</p>
        <p>{report.name}</p>
      </div>))}
    </div>
  )
}