import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-basic.json";

export default function SparkBasicPage() {
  return (
    <RIASECAssessment
      title="Career Spark Basic"
      description="Discover your stream and subject options for Grade 9-10. Answer each question honestly!"
      questions={QUESTIONS.questions}
      assessmentType="spark-basic"
    />
  );
}
