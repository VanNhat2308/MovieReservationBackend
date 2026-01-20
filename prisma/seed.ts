import { PrismaClient, RoleName, ShowtimeStatus, ReservationStatus, PaymentStatus } from '../src/generated/prisma/client'
import * as argon from 'argon2'
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
  const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('Seeding database...')

  /* =======================
     ROLE
  ======================== */
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  })

  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: { name: RoleName.USER },
  })

  /* =======================
     USER
  ======================== */
  const admin = await prisma.user.upsert({
    where: { email: 'admin@movie.com' },
    update: {},
    create: {
      email: 'admin@movie.com',
      password: await argon.hash('123456'),
      fullName: 'Admin System',
      roleId: adminRole.id,
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@movie.com' },
    update: {},
    create: {
      email: 'user@movie.com',
      password: await argon.hash('123456'),
      fullName: 'Normal User',
      roleId: userRole.id,
    },
  })

  /* =======================
     GENRE
  ======================== */
  const action = await prisma.genre.upsert({
    where: { name: 'Action' },
    update: {},
    create: { name: 'Action' },
  })

  const drama = await prisma.genre.upsert({
    where: { name: 'Drama' },
    update: {},
    create: { name: 'Drama' },
  })

  /* =======================
     MOVIE
  ======================== */
  const movie = await prisma.movie.create({
    data: {
      title: 'Avengers',
      description: 'Superhero movie',
      duration: 150,
      releaseDate: new Date('2024-01-01'),
      posterUrl: 'https://image.com/avengers.jpg',
      genres: {
        create: [
          { genreId: action.id },
          { genreId: drama.id },
        ],
      },
    },
  })

  /* =======================
     THEATER
  ======================== */
  const theater = await prisma.theater.create({
    data: {
      name: 'Cinema Room 1',
      totalRows: 5,
      totalCols: 5,
    },
  })

  /* =======================
     SEAT
  ======================== */
  

  const seats = [] as any[]
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) {
      seats.push({
        rowLabel: String.fromCharCode(64 + row), // A, B, C
        number: col,
        theaterId: theater.id,
      })
    }
  }

  await prisma.seat.createMany({ data: seats })

  const firstSeat = await prisma.seat.findFirst()

  /* =======================
     SHOWTIME
  ======================== */
  const showtime = await prisma.showtime.create({
    data: {
      movieId: movie.id,
      theaterId: theater.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      price: 100000,
      status: ShowtimeStatus.OPEN,
    },
  })

  /* =======================
     RESERVATION
  ======================== */
  const reservation = await prisma.reservation.create({
    data: {
      userId: user.id,
      showtimeId: showtime.id,
      status: ReservationStatus.CONFIRMED,
      totalPrice: 100000,
      seats: {
        create: {
          showtimeId: showtime.id,
          seatId: firstSeat!.id,
        },
      },
    },
  })

  /* =======================
     PAYMENT
  ======================== */
  await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      amount: 100000,
      method: 'CASH',
      status: PaymentStatus.SUCCESS,
    },
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
