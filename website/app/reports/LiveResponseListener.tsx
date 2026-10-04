"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveReports() {
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/reports/stream");
    let timer: ReturnType<typeof setTimeout>;

    es.onmessage = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.refresh()
      }, 200); // batch bursts of inserts
    };

    return () => {
      clearTimeout(timer);
      es.close();
    };
  }, [router]);

  return null;
}