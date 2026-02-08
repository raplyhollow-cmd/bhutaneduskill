import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, assessments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/certificates/[assessmentId] - Generate certificate for completed assessment
export async function GET(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, params.assessmentId),
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check if user owns this assessment
    if (assessment.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (assessment.status !== "completed") {
      return NextResponse.json({ error: "Assessment not completed" }, { status: 400 });
    }

    const results = assessment.results as any;
    const assessmentType = assessment.type?.toUpperCase() || "ASSESSMENT";

    // Generate certificate HTML
    const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; font-family: 'Georgia', serif; }
    .certificate {
      width: 800px;
      height: 600px;
      padding: 40px;
      border: 10px solid #1e3a5f;
      margin: 0 auto;
      position: relative;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #d4af37;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      color: #1e3a5f;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-top: 10px;
    }
    .content {
      text-align: center;
      margin: 40px 0;
    }
    .presented-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    .student-name {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a5f;
      margin: 10px 0;
      font-style: italic;
    }
    .completion-text {
      font-size: 18px;
      color: #333;
      margin: 20px 0;
      line-height: 1.6;
    }
    .assessment-name {
      font-size: 24px;
      font-weight: bold;
      color: #d4af37;
      margin: 15px 0;
    }
    .results {
      background: white;
      padding: 20px;
      margin: 20px 40px;
      border-radius: 8px;
      border-left: 4px solid #1e3a5f;
    }
    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .result-item:last-child {
      border-bottom: none;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
    }
    .date {
      font-size: 14px;
      color: #666;
    }
    .seal {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .badge {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 80px;
      height: 80px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="badge">🏆</div>
    <div class="header">
      <h1 class="title">Certificate of Achievement</h1>
      <p class="subtitle">Career Guidance Platform - Bhutan</p>
    </div>
    <div class="content">
      <p class="presented-to">This is to certify that</p>
      <h2 class="student-name">${currentUser.firstName} ${currentUser.lastName || ""}</h2>
      <p class="completion-text">
        has successfully completed the
      </p>
      <h3 class="assessment-name">${assessmentType} Assessment</h3>
      <div class="results">
        <div class="result-item">
          <span>Completed:</span>
          <span>${new Date(assessment.completedAt || Date.now()).toLocaleDateString()}</span>
        </div>
        ${results.riasecCode ? `
        <div class="result-item">
          <span>RIASEC Code:</span>
          <strong>${results.riasecCode}</strong>
        </div>
        ` : ''}
        ${results.type ? `
        <div class="result-item">
          <span>Personality Type:</span>
          <strong>${results.type}</strong>
        </div>
        ` : ''}
        ${results.primaryType ? `
        <div class="result-item">
          <span>Primary Type:</span>
          <strong>${results.primaryType}</strong>
        </div>
        ` : ''}
      </div>
    </div>
    <div class="footer">
      <p class="date">Issued on ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="seal">
      Official<br>Seal
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(certificateHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
