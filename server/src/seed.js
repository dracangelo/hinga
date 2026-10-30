import { db, tx } from './db.js';
import { hashPassword } from './auth.js';
import { DEFAULT_CATEGORIES } from './lib/categories.js';

const IMG = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PEX = (id, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const src = (value, w = 900) =>
  String(value).startsWith('http') ? String(value) : IMG(value, w);

const P = (
  name,
  slug,
  category,
  price,
  {
    description = '',
    story = '',
    occasions = [],
    compareAt = null,
    stock = 20,
    image,
    gallery = [],
    colors = [],
    sizes = ['Standard'],
    featured = false,
    active = 1,
    rating = 4.6,
    reviewCount = 0,
    sold = 0,
  } = {},
) => ({
  name,
  slug,
  category,
  price_cents: Math.round(price * 100),
  compare_at_cents: compareAt ? Math.round(compareAt * 100) : null,
  description,
  story,
  occasions: occasions.join(','),
  stock,
  image: src(image),
  gallery: [image, ...gallery].map((g) => src(g)).join(','),
  colors: colors.join(','),
  sizes: sizes.join(','),
  featured: featured ? 1 : 0,
  active,
  rating,
  review_count: reviewCount,
  sold_count: sold,
});

const PRODUCTS = [
  /* -------------------------- flowering plants ------------------------ */
  P('Blush Hydrangea', 'blush-hydrangea', 'flowering-plants', 5400, {
    image: PEX(10102526),
    gallery: [PEX(37397030), PEX(26839232)],
    description:
      'A soft pink hydrangea in a weathered terracotta pot, already in bloom. Around 40cm tall including the pot.',
    story:
      'Hydrangeas drink more than most — keep the soil evenly moist and give them morning light, and this one will flower for months.',
    occasions: ['birthday', 'housewarming', 'thank-you', 'sympathy'],
    compareAt: 6200,
    stock: 18,
    colors: ['Pink', 'Blue', 'White'],
    sizes: ['15cm pot', '20cm pot'],
    featured: true,
    rating: 4.8,
    reviewCount: 96,
    sold: 214,
  }),
  P('Pink Kalanchoe', 'pink-kalanchoe', 'flowering-plants', 2600, {
    image: PEX(36617364),
    gallery: [PEX(39449496)],
    description:
      'A compact kalanchoe covered in tiny pink flowers, potted in a ribbed stoneware pot. Sits happily on a kitchen windowsill.',
    story:
      'Flowering kalanchoe is a succulent — water it when the soil is dry and it will keep blooming for six weeks or more.',
    occasions: ['thank-you', 'get-well', 'friendship', 'birthday'],
    stock: 34,
    colors: ['Pink', 'Orange', 'Yellow'],
    sizes: ['10cm pot'],
    rating: 4.5,
    reviewCount: 58,
    sold: 307,
  }),
  P('White Cyclamen', 'white-cyclamen', 'flowering-plants', 3200, {
    image: PEX(14411981),
    gallery: [PEX(5362009)],
    description:
      'White cyclamen with silver-marbled leaves in a speckled ceramic pot. A bright windowsill plant for the cooler months.',
    story:
      'Cyclamen like it cool — a north-facing sill suits them better than a warm radiator. Water from below and let the soil dry a little between drinks.',
    occasions: ['get-well', 'sympathy', 'birthday', 'thank-you'],
    stock: 26,
    colors: ['White', 'Pink', 'Red'],
    sizes: ['13cm pot'],
    rating: 4.6,
    reviewCount: 41,
    sold: 132,
  }),
  P('Peace Lily', 'peace-lily', 'flowering-plants', 4200, {
    image: PEX(12253035),
    gallery: [PEX(29268310)],
    description:
      'A glossy peace lily in a matte white pot, with a white spathe just opening. Tolerates low light and the odd missed watering.',
    story:
      'The peace lily tells you when it is thirsty — the leaves droop, then perk up within an hour of a drink.',
    occasions: ['sympathy', 'housewarming', 'get-well', 'thank-you'],
    compareAt: 4800,
    stock: 20,
    colors: ['White'],
    sizes: ['15cm pot', '20cm pot'],
    featured: true,
    rating: 4.8,
    reviewCount: 87,
    sold: 198,
  }),
  P('Anthurium Ruby', 'anthurium-ruby', 'flowering-plants', 4800, {
    image: PEX(19225481),
    gallery: [PEX(38003902), PEX(5877422)],
    description:
      'A red anthurium with waxy heart-shaped spathes, potted with moss in a dark ceramic pot.',
    story:
      'Give it bright, indirect light and it can flower almost year round — one of the few houseplants that earns its keep.',
    occasions: ['romance', 'anniversary', 'housewarming', 'birthday'],
    stock: 15,
    colors: ['Red', 'White', 'Pink'],
    sizes: ['15cm pot'],
    rating: 4.7,
    reviewCount: 39,
    sold: 76,
  }),

  /* --------------------------- foliage plants ------------------------- */
  P('Monstera Deliciosa', 'monstera-deliciosa', 'foliage-plants', 5800, {
    image: PEX(32293880),
    gallery: [PEX(12014192), PEX(21529566)],
    description:
      'A mature split-leaf monstera in a white ceramic pot, around 70cm tall. The leaves to arrive already have their signature splits.',
    story:
      'Give it a bright corner, water when the top inch of soil dries out, and it will unfurl a new split leaf every few weeks.',
    occasions: ['housewarming', 'birthday', 'thank-you', 'wedding'],
    stock: 14,
    colors: ['Green'],
    sizes: ['15cm pot', '20cm pot', '25cm pot'],
    featured: true,
    rating: 4.9,
    reviewCount: 142,
    sold: 356,
  }),
  P('Monstera Petite', 'monstera-petite', 'foliage-plants', 3900, {
    image: PEX(12014192),
    gallery: [PEX(8790105)],
    description:
      'A young monstera on a low stand — the same big leaves, sized for a desk or a narrow shelf.',
    story:
      'A good first houseplant: forgiving, fast-growing and dramatic without needing a whole room.',
    occasions: ['thank-you', 'housewarming', 'friendship', 'get-well'],
    stock: 28,
    colors: ['Green'],
    sizes: ['10cm pot', '15cm pot'],
    featured: true,
    rating: 4.7,
    reviewCount: 61,
    sold: 189,
  }),
  P('Fiddle Leaf Fig', 'fiddle-leaf-fig', 'foliage-plants', 11200, {
    image: PEX(6044736),
    gallery: [PEX(8857324)],
    description:
      'A statement fiddle-leaf fig with a full canopy in a white planter. Around 1.2m tall.',
    story:
      'Fussy about draughts and overwatering, but once it settles it becomes the best plant in the house.',
    occasions: ['housewarming', 'birthday', 'wedding', 'anniversary'],
    compareAt: 13500,
    stock: 7,
    colors: ['Green'],
    sizes: ['25cm pot', '30cm pot'],
    rating: 4.6,
    reviewCount: 47,
    sold: 92,
  }),
  P('Snake Plant', 'snake-plant', 'foliage-plants', 3400, {
    image: PEX(22863428),
    gallery: [PEX(38189976), PEX(28217128)],
    description:
      'A tall sansevieria in a white pot. Happy in low light and needs water once a fortnight at most.',
    story:
      'The plant for people who forget to water things. It stores water in its leaves and shrugs off neglect.',
    occasions: ['housewarming', 'thank-you', 'get-well', 'friendship'],
    stock: 31,
    colors: ['Green', 'Variegated'],
    sizes: ['15cm pot', '20cm pot'],
    rating: 4.8,
    reviewCount: 119,
    sold: 402,
  }),
  P('Bird of Paradise', 'bird-of-paradise', 'foliage-plants', 6800, {
    image: PEX(10975125),
    description:
      'A tall strelitzia with paddle-shaped leaves in a ribbed stoneware pot. A tropical statement for the brightest room in the house.',
    story:
      'It wants sun and space — put it in your brightest window and turn it a quarter turn each month so it grows evenly.',
    occasions: ['housewarming', 'birthday', 'wedding'],
    stock: 9,
    colors: ['Green'],
    sizes: ['20cm pot', '25cm pot'],
    rating: 4.7,
    reviewCount: 28,
    sold: 54,
  }),
  P('Rubber Plant', 'rubber-plant', 'foliage-plants', 4400, {
    image: '1501004318641-b39e6451bec6',
    description:
      'A dark-leaved ficus elastica in a white pot, roughly 60cm tall. Glossy enough to look almost lacquered.',
    story:
      'Wipe the leaves once a month and it will keep that shine. Water sparingly in winter and it will forgive almost anything else.',
    occasions: ['housewarming', 'thank-you', 'birthday'],
    stock: 22,
    colors: ['Green', 'Burgundy'],
    sizes: ['15cm pot', '20cm pot'],
    rating: 4.6,
    reviewCount: 52,
    sold: 143,
  }),
  P('Boston Fern', 'boston-fern', 'foliage-plants', 3800, {
    image: '1497250681960-ef046c08a56e',
    description:
      'A full Boston fern in a hanging pot, ready to soften a bathroom or a shady corner.',
    story:
      'Ferns love humidity — mist it a couple of times a week, or keep it in the bathroom and let the shower do the work.',
    occasions: ['thank-you', 'get-well', 'housewarming', 'friendship'],
    stock: 24,
    colors: ['Green'],
    sizes: ['15cm pot'],
    rating: 4.5,
    reviewCount: 46,
    sold: 128,
  }),

  /* ------------------------ succulents & cacti ------------------------ */
  P('String of Pearls', 'string-of-pearls', 'succulents-cacti', 2900, {
    image: PEX(13799658),
    gallery: [PEX(12367419), PEX(31757865)],
    description:
      'A trailing string of pearls in a mustard pot. Leave it alone and it will cascade over the edge by summer.',
    story:
      'Bright light, very little water, and a pot it can hang from. That is the entire care routine.',
    occasions: ['friendship', 'thank-you', 'birthday', 'housewarming'],
    stock: 30,
    colors: ['Green'],
    sizes: ['10cm pot', '15cm pot'],
    featured: true,
    rating: 4.7,
    reviewCount: 73,
    sold: 264,
  }),
  P('Echeveria in Mint Pot', 'echeveria-mint-pot', 'succulents-cacti', 2200, {
    image: '1485955900006-10f4d324d411',
    description:
      'A single echeveria rosette in a small mint ceramic pot. A desk plant that asks for almost nothing.',
    story:
      'Water the soil, never the rosette — water sitting in the leaves is the one thing that will rot it.',
    occasions: ['thank-you', 'friendship', 'get-well', 'birthday'],
    stock: 40,
    colors: ['Green', 'Blush'],
    sizes: ['8cm pot', '10cm pot'],
    rating: 4.5,
    reviewCount: 64,
    sold: 318,
  }),
  P('Barrel Cactus', 'barrel-cactus', 'succulents-cacti', 2600, {
    image: '1459411552884-841db9b3cc2a',
    description:
      'A round golden barrel cactus in a terracotta pot. Water every three weeks and otherwise leave it be.',
    story:
      'Cacti sulk in low light — this one wants the sunniest sill in the house, and a gritty soil that drains fast.',
    occasions: ['thank-you', 'housewarming', 'friendship', 'get-well'],
    stock: 26,
    colors: ['Green'],
    sizes: ['10cm pot'],
    rating: 4.4,
    reviewCount: 37,
    sold: 156,
  }),
  P('Prickly Pear', 'prickly-pear', 'succulents-cacti', 2400, {
    image: '1493957988430-a5f2e15f39a3',
    description:
      'A small prickly pear in a terracotta pot on a wooden tray. Slow-growing, sun-loving and nearly indestructible.',
    story:
      'Every pad can become a new plant — snap one off in spring, let it callus for a week, then pot it up.',
    occasions: ['thank-you', 'housewarming', 'friendship'],
    stock: 32,
    colors: ['Green'],
    sizes: ['10cm pot'],
    rating: 4.5,
    reviewCount: 44,
    sold: 172,
  }),

  /* ------------------------------ orchids ----------------------------- */
  P('Phalaenopsis Orchid', 'phalaenopsis-orchid', 'orchids', 9500, {
    image: PEX(35531493),
    gallery: [PEX(30494401)],
    description:
      'A double-stem moth orchid in a hand-thrown peach pot, planted with moss and sent with a care card.',
    story:
      'With bright indirect light and a weekly soak, this orchid will bloom for three months or more — then rest and reflower.',
    occasions: ['birthday', 'anniversary', 'thank-you', 'get-well'],
    compareAt: 11000,
    stock: 8,
    colors: ['White', 'Pink', 'Peach'],
    sizes: ['13cm pot', '18cm pot'],
    featured: true,
    rating: 4.9,
    reviewCount: 78,
    sold: 164,
  }),
  P('White Orchid Arrangement', 'white-orchid-arrangement', 'orchids', 12000, {
    image: PEX(30494401),
    gallery: [PEX(35531493)],
    description:
      'A pair of white phalaenopsis in a wide ceramic bowl, dressed with moss and bark. Ready to sit on a dining table.',
    story:
      'Our most durable centrepiece — water it with two ice cubes a week and it will outlast any bouquet by months.',
    occasions: ['wedding', 'anniversary', 'sympathy'],
    stock: 5,
    colors: ['White'],
    sizes: ['Arrangement'],
    rating: 4.8,
    reviewCount: 26,
    sold: 61,
  }),

  /* -------------------------- herbs & edibles ------------------------- */
  P('Kitchen Herb Trio', 'kitchen-herb-trio', 'herbs-edibles', 3200, {
    image: PEX(2073001),
    gallery: [PEX(18864983)],
    description:
      'Basil, mint and parsley in three terracotta pots, ready for the kitchen windowsill.',
    story:
      'Cut from the top to keep them bushy, and water when the soil feels dry. The parsley will keep going through winter.',
    occasions: ['housewarming', 'thank-you', 'friendship', 'birthday'],
    stock: 36,
    colors: ['Mixed'],
    sizes: ['3-pot set'],
    featured: true,
    rating: 4.6,
    reviewCount: 89,
    sold: 287,
  }),
  P('Meyer Lemon Tree', 'meyer-lemon-tree', 'herbs-edibles', 8800, {
    image: PEX(36371415),
    description:
      'A young Meyer lemon in a terracotta pot, already carrying fruit. Around 70cm tall.',
    story:
      'Citrus wants sun, a sheltered spot and a feed in spring. The lemons are worth the fuss.',
    occasions: ['housewarming', 'anniversary', 'birthday'],
    compareAt: 9800,
    stock: 10,
    colors: ['Green'],
    sizes: ['20cm pot', '25cm pot'],
    rating: 4.7,
    reviewCount: 34,
    sold: 72,
  }),
  P('Bay Laurel Topiary', 'bay-laurel-topiary', 'herbs-edibles', 4600, {
    image: '1520412099551-62b6bafeb5bb',
    description:
      'A clipped bay tree in a dark ceramic pot. Bring it into the kitchen for the leaves, keep it by the door for the shape.',
    story:
      'Bay is happiest outdoors in summer and by a bright window in winter. Trim it twice a year to keep the shape.',
    occasions: ['housewarming', 'anniversary', 'thank-you'],
    stock: 12,
    colors: ['Green'],
    sizes: ['20cm pot'],
    rating: 4.6,
    reviewCount: 23,
    sold: 48,
  }),

  /* ---------------------------- pots & care --------------------------- */
  P('Terracotta Pot Set', 'terracotta-pot-set', 'pots-care', 2800, {
    image: PEX(37397147),
    gallery: [PEX(5780844), PEX(38339210)],
    description:
      'Three unglazed terracotta pots in 4", 6" and 8", each with a drainage saucer.',
    story:
      'Terracotta breathes — it dries out faster than glazed ceramic, which most houseplants prefer.',
    occasions: ['housewarming', 'thank-you', 'birthday'],
    stock: 40,
    colors: ['Terracotta'],
    sizes: ['Set of 3'],
    featured: true,
    rating: 4.7,
    reviewCount: 58,
    sold: 205,
  }),
  P('Clay Pot Trio', 'clay-pot-trio', 'pots-care', 2400, {
    image: PEX(5780844),
    gallery: [PEX(37397147)],
    description:
      'Three aged clay pots with a weathered finish, for herbs on a sill or cuttings on a bench.',
    story:
      'Small imperfections and a chalky patina are part of the character. Rinse them before planting.',
    occasions: ['housewarming', 'thank-you'],
    stock: 34,
    colors: ['Clay'],
    sizes: ['Set of 3'],
    rating: 4.4,
    reviewCount: 31,
    sold: 96,
  }),
  P('Plant Care Kit', 'plant-care-kit', 'pots-care', 2400, {
    image: PEX(5934017),
    gallery: [PEX(18864983)],
    description:
      'A brass mister, snips, a small fork and a bottle of organic feed in a cotton bag.',
    story:
      'Everything for a first houseplant, chosen by our team. Refill the feed in the shop whenever you run out.',
    occasions: ['thank-you', 'housewarming', 'birthday', 'friendship'],
    stock: 26,
    colors: ['Natural'],
    sizes: ['Kit'],
    rating: 4.8,
    reviewCount: 67,
    sold: 231,
  }),
  P('Potting Mix & Feed', 'potting-mix-and-feed', 'pots-care', 1800, {
    image: PEX(18864983),
    gallery: [PEX(5934017)],
    description:
      'A bag of our houseplant potting mix with a pouch of slow-release feed. Enough for three or four repots.',
    story:
      'Our mix is peat-free: bark, coir and pumice, blended for aeration and drainage.',
    occasions: ['housewarming', 'thank-you'],
    stock: 50,
    colors: ['Natural'],
    sizes: ['5L bag', '10L bag'],
    rating: 4.6,
    reviewCount: 29,
    sold: 118,
  }),
];

const COUPONS = [
  { code: 'BLOOM10', kind: 'percent', value: 10, min: 0, active: 1, expires_at: null },
  { code: 'FRESH15', kind: 'percent', value: 15, min: 600000, active: 1, expires_at: null },
  { code: 'WELCOME20', kind: 'fixed', value: 200000, min: 500000, active: 1, expires_at: null },
  { code: 'MOTHERFIVE', kind: 'percent', value: 20, min: 800000, active: 0, expires_at: null },
];

const REVIEW_NAMES = [
  'Amelia R.',
  'Marcus T.',
  'Priya N.',
  'Jonah K.',
  'Sofia L.',
  'Ellie W.',
  'Daniel O.',
  'Noor A.',
  'Tessa M.',
  'Oliver B.',
  'Hana S.',
  'Lucas P.',
];

const REVIEW_BODIES = [
  'Arrived in perfect condition. Well watered, wrapped to protect the leaves, and the care card was actually useful.',
  'Exactly as described and much bigger than I expected. The pot is lovely enough to leave on show.',
  'Gorgeous. My mother has it on her windowsill and has already sent me three photos of it.',
  'Healthy leaves, no yellowing, and the soil was still moist when it arrived. Clearly packed by someone who cares.',
  'Ordered for our new flat and it fills the corner beautifully. Delivery was on time and careful.',
  'Lovely plant, though the pot is a little smaller than I pictured. Still very happy with it.',
  'Thoughtful and packed with real care. The little care card and feed sample were a nice touch.',
  'Surprised by how large it is. Great value and it has already put out two new leaves.',
  'Second order from Hinga and the quality is consistent. Everything arrives healthy.',
  'The recipient was delighted. Quick delivery and the handwritten note made it personal.',
];

const REVIEW_TITLES = [
  'Perfect in every way',
  'Exceeded expectations',
  'Beautifully arranged',
  'Would order again',
  'Gorgeous and fresh',
  'Delighted with it',
  'Great quality',
  'Exactly as described',
];

const CUSTOMERS = [
  { name: 'Wanjiru Kamau', email: 'wanjiru@example.com', city: 'Nairobi', phone: '+254 712 345 678' },
  { name: 'Brian Otieno', email: 'brian@example.com', city: 'Mombasa', phone: '+254 722 456 789' },
  { name: 'Aisha Mohamed', email: 'aisha@example.com', city: 'Nairobi', phone: '+254 733 567 890' },
  { name: 'Kevin Mwangi', email: 'kevin@example.com', city: 'Nakuru', phone: '+254 701 678 901' },
  { name: 'Faith Chebet', email: 'faith@example.com', city: 'Eldoret', phone: '+254 715 789 012' },
  { name: 'Njeri Kariuki', email: 'njeri@example.com', city: 'Nairobi', phone: '+254 726 890 123' },
  { name: 'Hassan Ali', email: 'hassan@example.com', city: 'Kisumu', phone: '+254 738 901 234' },
  { name: 'Mercy Wambui', email: 'mercy@example.com', city: 'Thika', phone: '+254 705 012 345' },
];

/* A short back-and-forth on the first request so the account thread isn't empty. */
const LANDSCAPING_MESSAGES = [
  {
    author: 'customer',
    body: 'Measured again this morning — the paved courtyard is 14 m by 9 m, with one tap on the north wall. Any morning this week works for me if you want to walk the site.',
  },
  {
    author: 'studio',
    body: 'Noted, thank you. Joseph will come by on Thursday at 9am with the soil kit and a tape. We are leaning toward lavender and bougainvillea along the wall, with the roses kept to the raised beds.',
  },
];

const LANDSCAPING_REQUESTS = [
  {
    location: 'Lavington, Nairobi',
    landSize: '320 m²',
    siteType: 'courtyard',
    flowers: ['Roses', 'Bougainvillea', 'Lavender'],
    timeline: 'one-to-three-months',
    budget: '150k-400k',
    notes: 'Paved courtyard that cooks in the afternoon sun. Wants low-water beds, a jasmine screen for privacy and a small seating corner under the frangipani.',
    status: 'contacted',
  },
  {
    name: 'Muthoni Gichuru',
    email: 'muthoni.gichuru@example.com',
    phone: '+254 720 114 552',
    location: 'Karen, Nairobi',
    landSize: '1.2 acres',
    siteType: 'home-garden',
    flowers: ['Hydrangeas', 'Bird of paradise', 'Indigenous shrubs'],
    timeline: 'within-a-month',
    budget: 'over-400k',
    notes: 'New build on bare red soil. Needs the whole garden from scratch — lawn, beds along the driveway and a windbreak on the western boundary.',
    status: 'quoted',
  },
  {
    name: 'David Kiptoo',
    email: 'd.kiptoo@example.com',
    phone: '+254 733 908 441',
    location: 'Milimani, Kisumu',
    landSize: '90 m²',
    siteType: 'rooftop',
    flowers: ['Kalanchoe', 'Alyssum', 'Orchids'],
    timeline: 'planning',
    budget: '50k-150k',
    notes: 'Fourth-floor rooftop terrace above a shop. Worried about weight and wind — would like planters and shade-loving flowers we can maintain ourselves.',
    status: 'new',
  },
];

const ORDER_STATUSES = [
  'delivered',
  'delivered',
  'delivered',
  'out_for_delivery',
  'confirmed',
  'preparing',
  'pending',
  'cancelled',
];

/* ------------------------------------------------------------------ */

function seed({ reset = false } = {}) {
  if (reset) {
    tx(() => {
      for (const table of [
        'order_items',
        'orders',
        'cart_items',
        'product_reviews',
        'addresses',
        'products',
        'categories',
        'coupons',
        'newsletter',
        'landscaping_messages',
        'landscaping_requests',
        'users',
      ]) {
        db.exec(`DELETE FROM ${table}`);
      }
      db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','products','categories','orders','order_items','product_reviews','cart_items','addresses','coupons','newsletter','landscaping_requests','landscaping_messages')");
    });
  }

  const alreadySeeded = db.prepare('SELECT COUNT(*) AS c FROM products').get().c > 0;
  if (alreadySeeded && !reset) {
    console.log('Database already seeded — run `npm run reset` to rebuild it.');
    return;
  }

  tx(() => {
    /* users */
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, phone, city) VALUES (?, ?, ?, ?, ?, ?)',
    );
    insertUser.run('Hinga Admin', 'admin@hinga.shop', hashPassword('admin1234'), 'admin', '+254 700 000 000', 'Nairobi');
    for (const c of CUSTOMERS) {
      insertUser.run(c.name, c.email, hashPassword('customer123'), 'customer', c.phone, c.city);
    }

    /* saved addresses for the demo customer */
    const demoCustomer = db.prepare('SELECT id FROM users WHERE email = ?').get('wanjiru@example.com');
    const insertAddress = db.prepare(
      `INSERT INTO addresses (user_id, label, recipient, phone, address, city, state, zip, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertAddress.run(
      demoCustomer.id,
      'Home',
      'Wanjiru Kamau',
      '+254 712 345 678',
      '28 Riverside Drive, Westlands',
      'Nairobi',
      'Nairobi County',
      '00100',
      'KE',
      1,
    );
    insertAddress.run(
      demoCustomer.id,
      'Studio',
      'Wanjiru Kamau',
      '+254 712 345 678',
      'Kilimani Business Centre, 3rd Floor',
      'Nairobi',
      'Nairobi County',
      '00200',
      'KE',
      0,
    );

    /* products */
    const insertProduct = db.prepare(
      `INSERT INTO products (slug, name, description, story, category, occasions, price_cents,
        compare_at_cents, stock, image, gallery, colors, sizes, featured, active, rating,
        review_count, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of PRODUCTS) {
      insertProduct.run(
        p.slug,
        p.name,
        p.description,
        p.story,
        p.category,
        p.occasions,
        p.price_cents,
        p.compare_at_cents,
        p.stock,
        p.image,
        p.gallery,
        p.colors,
        p.sizes,
        p.featured,
        p.active,
        p.rating,
        p.review_count,
        p.sold_count,
      );
    }

    /* categories */
    const insertCategory = db.prepare(
      `INSERT OR IGNORE INTO categories (slug, name, description, image, links, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
    );
    DEFAULT_CATEGORIES.forEach((category, index) => {
      insertCategory.run(
        category.slug,
        category.name,
        category.description,
        category.image,
        JSON.stringify(category.links),
        index,
      );
    });

    /* coupons */
    const insertCoupon = db.prepare(
      'INSERT INTO coupons (code, kind, value, min_subtotal_cents, active, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const c of COUPONS) insertCoupon.run(c.code, c.kind, c.value, c.min, c.active, c.expires_at);

    /* reviews */
    const productRows = db.prepare('SELECT id, name FROM products').all();
    const insertReview = db.prepare(
      'INSERT INTO product_reviews (product_id, user_id, name, rating, title, body) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const product of productRows) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i += 1) {
        const idx = Math.floor(Math.random() * REVIEW_NAMES.length);
        insertReview.run(
          product.id,
          null,
          REVIEW_NAMES[idx],
          4 + Math.floor(Math.random() * 2),
          REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)],
          REVIEW_BODIES[Math.floor(Math.random() * REVIEW_BODIES.length)],
        );
      }
    }

    /* orders */
    const customerRows = db
      .prepare("SELECT id, name, email, phone, city FROM users WHERE role = 'customer'")
      .all();
    const productList = db.prepare('SELECT * FROM products WHERE active = 1').all();

    const insertOrder = db.prepare(
      `INSERT INTO orders (order_number, user_id, status, payment_status, payment_method,
        subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, coupon_code,
        customer_name, customer_email, customer_phone, ship_address, ship_city, ship_state,
        ship_zip, ship_country, notes, tracking_number, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertOrderItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, name, image, unit_price_cents, qty, size, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (let i = 0; i < 26; i += 1) {
      const customer = customerRows[i % customerRows.length];
      const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const chosen = [];
      for (let j = 0; j < itemCount; j += 1) {
        const product = productList[Math.floor(Math.random() * productList.length)];
        if (!chosen.includes(product)) chosen.push(product);
      }

      let subtotal = 0;
      const lines = chosen.map((product) => {
        const qty = 1 + Math.floor(Math.random() * 2);
        subtotal += product.price_cents * qty;
        return { product, qty };
      });

      const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
      const shipping = subtotal >= 750000 ? 0 : 40000;
      const tax = Math.round((subtotal - discount) * 0.16);
      const total = subtotal - discount + shipping + tax;

      const daysAgo = Math.floor(Math.random() * 45);
      const date = new Date(Date.now() - daysAgo * 86400000);
      const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');

      const orderNumber = `HG-SEED${String(1000 + i)}`;
      const info = insertOrder.run(
        orderNumber,
        customer.id,
        status,
        status === 'cancelled' ? 'refunded' : 'paid',
        i % 3 === 0 ? 'mpesa' : 'card',
        subtotal,
        discount,
        shipping,
        tax,
        total,
        discount ? 'BLOOM10' : null,
        customer.name,
        customer.email,
        customer.phone,
        `${12 + i} Riverside Drive, Westlands`,
        customer.city,
        customer.city === 'Nairobi' ? 'Nairobi County' : 'Kenya',
        '00100',
        'KE',
        i % 6 === 0 ? 'Please leave with the concierge if nobody answers.' : '',
        status === 'delivered' || status === 'out_for_delivery' ? `HGX${100000 + i * 977}` : '',
        dateStr,
        dateStr,
      );

      for (const line of lines) {
        insertOrderItem.run(
          Number(info.lastInsertRowid),
          line.product.id,
          line.product.name,
          line.product.image,
          line.product.price_cents,
          line.qty,
          line.product.sizes.split(',')[0],
          line.product.colors ? line.product.colors.split(',')[0] : '',
        );
      }
    }

    /* landscaping quotation requests */
    const insertRequest = db.prepare(
      `INSERT INTO landscaping_requests (reference, user_id, name, email, phone, location,
        land_size, site_type, preferred_flowers, timeline, budget, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertMessage = db.prepare(
      `INSERT INTO landscaping_messages (request_id, author, author_name, body, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );

    const demoBuyer = customerRows[0];
    for (const [i, request] of LANDSCAPING_REQUESTS.entries()) {
      const daysAgo = 2 + i * 6;
      const dateStr = new Date(Date.now() - daysAgo * 86400000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      const info = insertRequest.run(
        `LS-SEED0${i + 1}`,
        i === 0 ? demoBuyer.id : null,
        request.name || demoBuyer.name,
        request.email || demoBuyer.email,
        request.phone || demoBuyer.phone,
        request.location,
        request.landSize,
        request.siteType,
        request.flowers.join(', '),
        request.timeline,
        request.budget,
        request.notes,
        request.status,
        dateStr,
        dateStr,
      );

      if (i !== 0) continue;
      for (const [j, message] of LANDSCAPING_MESSAGES.entries()) {
        const sentAt = new Date(Date.now() - Math.max(0, daysAgo - 1 - j) * 86400000)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ');
        insertMessage.run(
          Number(info.lastInsertRowid),
          message.author,
          message.author === 'studio' ? 'Joseph · Hinga garden team' : request.name || demoBuyer.name,
          message.body,
          sentAt,
        );
      }
    }
  });

  console.log(
    `Seeded ${PRODUCTS.length} potted plants, ${DEFAULT_CATEGORIES.length} categories, ${CUSTOMERS.length + 1} users, 26 orders, ${LANDSCAPING_REQUESTS.length} landscaping requests.`,
  );
  console.log('Admin:    admin@hinga.shop / admin1234');
  console.log('Customer: wanjiru@example.com / customer123');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) seed({ reset: process.argv.includes('--reset') });
