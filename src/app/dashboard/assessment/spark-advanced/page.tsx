import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-advanced.json";

export default function SparkAdvancedPage() {
  return (
    <RIASECAssessment
      title="Career Spark Advanced"
      description="Make informed decisions about college and career paths for Grade 11-12. Answer each question honestly!"
      questions={QUESTIONS.questions}
      assessmentType="spark-advanced"
    />
  );
}
