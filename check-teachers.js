const { db } = require('./src/lib/db/index.ts');
const { users, schools } = require('./src/lib/db/schema.ts');
const { eq, and } = require('drizzle-orm');

(async () => {
  try {
    console.log('=== Finding your school ===');
    const schools = await db.select()
      .from(schools)
      .where(eq(schools.code, 'yan-thi-2026'))
      .limit(5);
    console.log('Schools with code yan-thi-2026:', JSON.stringify(schools, null, 2));
    
    if (schools.length > 0) {
      const schoolId = schools[0].id;
      console.log('\n=== Finding teachers for school ===', schoolId);
      
      const teachers = await db.select()
        .from(users)
        .where(and(
          eq(users.schoolId, schoolId),
          eq(users.type, 'teacher')
        ))
        .limit(10);
      
      console.log('Teachers found:', teachers.length);
      console.log(JSON.stringify(teachers.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        type: t.type,
        schoolId: t.schoolId,
        onboardingStatus: t.onboardingStatus,
        onboardingComplete: t.onboardingComplete,
      })), null, 2));
    }
    
    console.log('\n=== All teachers in database ===');
    const allTeachers = await db.select()
      .from(users)
      .where(eq(users.type, 'teacher'))
      .limit(10);
    
    console.log('All teachers:', allTeachers.length);
    console.log(JSON.stringify(allTeachers.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      schoolId: t.schoolId,
      onboardingStatus: t.onboardingStatus,
    })), null, 2));
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
})();
