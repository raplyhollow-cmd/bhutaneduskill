import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-lite.json";

export default function SparkLitePage() {
  const transformedQuestions = QUESTIONS.questions.map(q => ({
    ...q,
    options: q.options.map(o => ({
      value: o.value,
      text: o.label,
    })),
  }));

  return (
    <RIASECAssessment
      title="Career Spark Lite"
      description="Fun career exploration for Grade 8 and below. Answer each question honestly!"
      questions={transformedQuestions}
      assessmentType="spark-lite"
    />
  );
}
