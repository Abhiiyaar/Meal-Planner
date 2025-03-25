// This file can be deleted entirely
// If you want to keep the file structure but disable the functionality:

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "This functionality has been disabled." },
    { status: 404 }
  );
}

