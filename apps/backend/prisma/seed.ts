import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a seed user
  const user = await prisma.user.upsert({
    where: { externalId: 'seed-user-001' },
    update: {},
    create: {
      externalId: 'seed-user-001',
      email: 'diver@example.com',
      alias: 'Oslo Diver',
      role: 'user',
      preferredLanguage: 'no',
    },
  });

  console.log(`Seed user: ${user.id}`);

  // Oslo fjord dive spots — real-ish locations
  const spots = [
    {
      title: 'Gressholmen',
      description:
        'Popular shore dive on the island of Gressholmen. Shallow reef with kelp forest and good visibility in summer.',
      centerLat: 59.8862,
      centerLon: 10.7188,
      accessInfo: 'Take the ferry from Aker Brygge to Gressholmen. Walk to the south side.',
      parkingLocations: [
        { lat: 59.9102, lon: 10.7275, label: 'Aker Brygge ferry terminal' },
      ],
    },
    {
      title: 'Hovedoya nordvest',
      description:
        'Wall dive on the north-west side of Hovedoya. Drop-off to 18m with nudibranchs and crabs.',
      centerLat: 59.8975,
      centerLon: 10.7312,
      accessInfo: 'Ferry from Aker Brygge to Hovedoya. 10 min walk to the north-west shore.',
      parkingLocations: [
        { lat: 59.9102, lon: 10.7275, label: 'Aker Brygge ferry terminal' },
      ],
    },
    {
      title: 'Sjursoya',
      description:
        'Deep wall dive near the harbour area. Depths to 30m+. Interesting harbour life and occasional lobster sightings.',
      centerLat: 59.8785,
      centerLon: 10.7595,
      accessInfo: 'Drive to Sjursoya industrial area. Dive from the rocks on the east side.',
      parkingLocations: [
        { lat: 59.8790, lon: 10.7560, label: 'Parking by the road' },
      ],
    },
    {
      title: 'Bygdoy sjobad',
      description:
        'Easy shore dive from the beach at Bygdoy. Sandy bottom with seagrass and flatfish. Good for beginners.',
      centerLat: 59.9022,
      centerLon: 10.6758,
      accessInfo: 'Bus 30 to Bygdoy. Entrance from the public beach.',
      parkingLocations: [
        { lat: 59.9035, lon: 10.6745, label: 'Huk parking' },
        { lat: 59.9010, lon: 10.6780, label: 'Paradisbukta parking' },
      ],
    },
    {
      title: 'Nesoddtangen',
      description:
        'Scenic dive on the tip of the Nesodden peninsula. Rocky bottom with kelp and good fish life. Max depth around 20m.',
      centerLat: 59.8535,
      centerLon: 10.6572,
      accessInfo: 'Take the Nesodden ferry or drive. Walk to the point.',
      parkingLocations: [
        { lat: 59.8540, lon: 10.6600, label: 'Nesoddtangen parking' },
      ],
    },
    {
      title: 'Dronningen',
      description:
        'Shore dive right in the city center near Dronningen restaurant. Surprisingly rich marine life under the docks.',
      centerLat: 59.9120,
      centerLon: 10.7015,
      accessInfo: 'Walk from Aker Brygge. Enter water from the slipway.',
      parkingLocations: [],
    },
  ];

  for (const spot of spots) {
    const created = await prisma.diveSpot.create({
      data: {
        title: spot.title,
        description: spot.description,
        centerLat: spot.centerLat,
        centerLon: spot.centerLon,
        accessInfo: spot.accessInfo,
        createdById: user.id,
        parkingLocations: {
          create: spot.parkingLocations,
        },
      },
    });
    console.log(`Created: ${created.title} (${created.id})`);
  }

  console.log(`\nSeeded ${spots.length} dive spots in the Oslo fjord.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
