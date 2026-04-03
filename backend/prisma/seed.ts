import { PrismaClient, Curriculum } from '@prisma/client';

const prisma = new PrismaClient();

const subjects: { name: string; curriculum: Curriculum }[] = [
  // Core subjects - available at both GCSE and A-Level
  { name: 'Mathematics', curriculum: 'both' },
  { name: 'Further Mathematics', curriculum: 'a_level' },
  { name: 'English Language', curriculum: 'both' },
  { name: 'English Literature', curriculum: 'both' },
  { name: 'Biology', curriculum: 'both' },
  { name: 'Chemistry', curriculum: 'both' },
  { name: 'Physics', curriculum: 'both' },
  { name: 'History', curriculum: 'both' },
  { name: 'Geography', curriculum: 'both' },
  { name: 'French', curriculum: 'both' },
  { name: 'Spanish', curriculum: 'both' },
  { name: 'German', curriculum: 'both' },
  { name: 'Computer Science', curriculum: 'both' },
  { name: 'Economics', curriculum: 'both' },
  { name: 'Business Studies', curriculum: 'both' },
  { name: 'Psychology', curriculum: 'both' },
  { name: 'Sociology', curriculum: 'both' },
  { name: 'Art', curriculum: 'both' },
  // Additional UK GCSE/A-Level subjects
  { name: 'Religious Studies', curriculum: 'both' },
  { name: 'Music', curriculum: 'both' },
  { name: 'Drama', curriculum: 'both' },
  { name: 'Physical Education', curriculum: 'both' },
  { name: 'Design and Technology', curriculum: 'both' },
  { name: 'Media Studies', curriculum: 'both' },
  { name: 'Law', curriculum: 'a_level' },
  { name: 'Politics', curriculum: 'a_level' },
  { name: 'Accounting', curriculum: 'both' },
  { name: 'Latin', curriculum: 'both' },
];

async function main() {
  console.log('Seeding subjects...');

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: { curriculum: subject.curriculum },
      create: { name: subject.name, curriculum: subject.curriculum },
    });
  }

  console.log(`Seeded ${subjects.length} subjects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
