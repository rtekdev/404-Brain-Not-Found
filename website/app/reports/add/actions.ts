"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { insertReport } from "@/lib/reports";
import { unitForCategory } from "@/lib/meta";
import { CATEGORY_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/lib/types";

export type FormState = {
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const keys = <T extends string>(o: Record<T, string>) => Object.keys(o) as [T, ...T[]];

const schema = z.object({
  title: z.string().trim().min(3, "Min. 3 znaki").max(255, "Max. 255 znaków"),
  description: z.string().trim().min(10, "Min. 10 znaków").max(2000),
  category: z.enum(keys(CATEGORY_LABELS)),
  source: z.enum(keys(SOURCE_LABELS)),
  status: z.enum(keys(STATUS_LABELS)),
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  confidence: z.coerce.number().min(0).max(1),
  confirmations: z.coerce.number().int().min(1).max(999),
  blocking: z.preprocess((v) => v === "on", z.boolean()),
  cameraId: z.string().optional().transform((v) => v || null),
});

export async function createReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values: raw };
  }

  const d = parsed.data;
  const { longitude, latitude, ...rest } = d;
  const id = await insertReport({
    ...rest,
    position: [longitude, latitude],
    // same rule as your buildReports(): "nowe" has no unit yet
    unitId: d.status === "nowe" ? null : unitForCategory(d.category).id,
  });

  revalidatePath("/reports");
  redirect(`/reports/${id}`); // keep outside try/catch, redirect works by throwing
}