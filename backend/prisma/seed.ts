import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hvac-diagnostic.com' },
    update: {},
    create: {
      email: 'admin@hvac-diagnostic.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  })

  console.log('Created admin user:', {
    email: admin.email,
    name: admin.name,
    role: admin.role,
  })

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@hvac-diagnostic.com' },
    update: {},
    create: {
      email: 'user@hvac-diagnostic.com',
      password: userPassword,
      name: 'Test User',
      role: 'user',
    },
  })

  console.log('Created test user:', {
    email: user.email,
    name: user.name,
    role: user.role,
  })

  console.log('\nSeeding complete!')
  console.log('\nTest credentials:')
  console.log('Admin - Email: admin@hvac-diagnostic.com, Password: admin123')
  console.log('User - Email: user@hvac-diagnostic.com, Password: user123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
