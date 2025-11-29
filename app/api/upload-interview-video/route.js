import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), "public", "videos");
    await mkdir(uploadDir, { recursive: true });

    const fileName = file.name || `interview-${Date.now()}.webm`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath: `/videos/${fileName}`,
    });
  } catch (error) {
    console.error("Error saving video:", error);
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }
}
