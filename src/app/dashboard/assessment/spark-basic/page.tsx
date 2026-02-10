import { RIASECAssessment } from "@/components/assessment/RIASECAssessment";
import QUESTIONS from "@/lib/assessments/questions/spark-basic.json";

export default function SparkBasicPage() {
  const transformedQuestions = QUESTIONS.questions.map(q => ({
    ...q,
    options: q.options.map(o => ({
      value: o.value,
      text: o.label,
    })),
  }));

  return (
    <RIASECAssessment
      title="Career Spark Basic"
      description="Discover your stream and subject options for Grade 9-10. Answer each question honestly!"
      questions={transformedQuestions}
      assessmentType="spark-basic"
    />
  );
}
