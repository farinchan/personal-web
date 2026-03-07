import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { hash } from 'bcrypt'
import { adminUsers } from './schema/admin'
import { profile } from './schema/profile'
import { posts } from './schema/posts'
import { tags, postTags } from './schema/tags'
import { cvSections } from './schema/cv'

async function seed() {
  const connection = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'personal_web',
  })

  const db = drizzle(connection)

  console.log('🌱 Seeding database...')

  // 1. Admin user
  const passwordHash = await hash('admin123', 10)
  await db.insert(adminUsers).values({
    username: 'admin',
    passwordHash,
  })
  console.log('✅ Admin user created (username: admin, password: admin123)')

  // 2. Profile
  await db.insert(profile).values({
    name: 'Fajri',
    bio: 'Seorang developer yang suka belajar hal baru dan mendokumentasikan proses belajar melalui blog.',
    github: 'https://github.com/fajri',
    linkedin: 'https://linkedin.com/in/fajri',
  })
  console.log('✅ Profile created')

  // 3. Tags
  const [tag1] = await db.insert(tags).values({ name: 'Nuxt', slug: 'nuxt' }).$returningId()
  const [tag2] = await db.insert(tags).values({ name: 'Vue.js', slug: 'vue-js' }).$returningId()
  const [tag3] = await db.insert(tags).values({ name: 'TypeScript', slug: 'typescript' }).$returningId()
  console.log('✅ Tags created')

  // 4. Sample blog posts
  const [post1] = await db.insert(posts).values({
    slug: 'memulai-dengan-nuxt-4',
    title: 'Memulai dengan Nuxt 4',
    description: 'Panduan lengkap untuk memulai project dengan Nuxt 4, termasuk setup, konfigurasi, dan fitur-fitur baru.',
    body: `# Memulai dengan Nuxt 4

Nuxt 4 adalah framework Vue.js yang powerful untuk membangun aplikasi web modern. Dalam artikel ini, kita akan membahas cara memulai project baru dengan Nuxt 4.

## Instalasi

Untuk membuat project baru, jalankan perintah berikut:

\`\`\`bash
npx nuxi init my-project
cd my-project
npm install
\`\`\`

## Struktur Folder

Nuxt 4 memperkenalkan struktur folder baru dengan \`app/\` directory:

\`\`\`
app/
  pages/
  components/
  layouts/
server/
  api/
  utils/
\`\`\`

## Fitur Baru

### Auto Import
Nuxt 4 secara otomatis mengimport composables, components, dan utilities.

### Server Routes
Buat API routes langsung di folder \`server/api/\`:

\`\`\`typescript
export default defineEventHandler(() => {
  return { message: 'Hello World' }
})
\`\`\`

## Kesimpulan

Nuxt 4 mempermudah development aplikasi Vue.js dengan banyak fitur out-of-the-box. Selamat mencoba!`,
    isDraft: false,
    publishedAt: new Date(),
  }).$returningId()

  const [post2] = await db.insert(posts).values({
    slug: 'belajar-typescript-untuk-pemula',
    title: 'Belajar TypeScript untuk Pemula',
    description: 'Pengenalan TypeScript, type system, dan mengapa kamu harus mulai menggunakan TypeScript di project-mu.',
    body: `# Belajar TypeScript untuk Pemula

TypeScript adalah superset dari JavaScript yang menambahkan type system. Mari kita pelajari dasar-dasarnya.

## Apa itu TypeScript?

TypeScript menambahkan **static typing** ke JavaScript, membantu kita menangkap error lebih awal.

## Tipe Dasar

\`\`\`typescript
let nama: string = 'Fajri'
let umur: number = 25
let aktif: boolean = true
let hobi: string[] = ['coding', 'membaca']
\`\`\`

## Interface

\`\`\`typescript
interface User {
  id: number
  name: string
  email: string
}

function greet(user: User): string {
  return \`Halo, \${user.name}!\`
}
\`\`\`

## Generics

\`\`\`typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}
\`\`\`

## Kesimpulan

TypeScript membuat kode lebih aman dan maintainable. Mulai gunakan di project-mu sekarang!`,
    isDraft: false,
    publishedAt: new Date(Date.now() - 86400000), // yesterday
  }).$returningId()

  // Assign tags to posts
  await db.insert(postTags).values([
    { postId: post1.id, tagId: tag1.id },
    { postId: post1.id, tagId: tag2.id },
    { postId: post2.id, tagId: tag3.id },
  ])
  console.log('✅ Blog posts created')

  // 5. CV Sections
  await db.insert(cvSections).values([
    {
      type: 'experience',
      title: 'Pengalaman Kerja',
      body: `<ul>
<li><strong>Fullstack Developer</strong> — PT Contoh Tech (2022 - Sekarang)<br>Mengembangkan aplikasi web menggunakan Vue.js, Nuxt, dan Node.js.</li>
<li><strong>Frontend Developer</strong> — Startup ABC (2020 - 2022)<br>Membangun antarmuka pengguna responsif dengan React dan Vue.</li>
</ul>`,
      sortOrder: 0,
    },
    {
      type: 'education',
      title: 'Pendidikan',
      body: `<ul>
<li><strong>S1 Teknik Informatika</strong> — Universitas Contoh (2016 - 2020)<br>IPK: 3.75</li>
</ul>`,
      sortOrder: 1,
    },
    {
      type: 'skills',
      title: 'Keahlian',
      body: `<ul>
<li><strong>Frontend:</strong> Vue.js, Nuxt, React, HTML, CSS, Tailwind CSS</li>
<li><strong>Backend:</strong> Node.js, Express, Drizzle ORM</li>
<li><strong>Database:</strong> MySQL, PostgreSQL</li>
<li><strong>Tools:</strong> Git, Docker, VS Code</li>
</ul>`,
      sortOrder: 2,
    },
  ])
  console.log('✅ CV sections created')

  console.log('\n🎉 Seeding selesai!')
  console.log('---')
  console.log('Admin login: username=admin, password=admin123')
  console.log('⚠️  Ganti password setelah login pertama kali!')

  await connection.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err)
  process.exit(1)
})
