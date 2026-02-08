import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-lite.json";

export default function SparkLitePage() {
  return (
    <RIASECAssessment
      title="Career Spark Lite"
      description="Fun career exploration for Grade 8 and below. Answer each question honestly!"
      questions={QUESTIONS.questions}
      assessmentType="spark-lite"
    />
  );
}
