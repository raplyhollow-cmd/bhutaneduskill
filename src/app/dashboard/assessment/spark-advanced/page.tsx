import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-advanced.json";

export default function SparkAdvancedPage() {
  // Transform the questions to match the expected type
  const transformedQuestions = QUESTIONS.questions.map(q => ({
    ...q,
    options: q.options.map(o => ({
      value: o.value,
      text: o.label,
    })),
  }));

  return (
    <RIASECAssessment
      title="Career Spark Advanced"
      description="Make informed decisions about college and career paths for Grade 11-12. Answer each question honestly!"
      questions={transformedQuestions}
      assessmentType="spark-advanced"
    />
  );
}
