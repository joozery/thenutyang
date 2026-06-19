"use server";

import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { randomUUID } from "crypto";
import { extname } from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData, folder = "images"): Promise<{ url: string }> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("ไม่พบไฟล์");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("รองรับเฉพาะ JPG, PNG, WebP, GIF");
  if (file.size > MAX_SIZE) throw new Error("ไฟล์ต้องไม่เกิน 5MB");

  const ext = extname(file.name) || ".jpg";
  const key = `${folder}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToR2(buffer, key, file.type);
  return { url };
}

export async function deleteImage(url: string): Promise<void> {
  const { keyFromUrl } = await import("@/lib/r2");
  const key = keyFromUrl(url);
  await deleteFromR2(key);
}
