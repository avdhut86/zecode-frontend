// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://directus:directuspassword@localhost:5432/zecode';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.storeProduct.deleteMany();
  await prisma.storePhoto.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.heroSlide.deleteMany();
  await prisma.pageTitle.deleteMany();

  console.log('✓ Cleared existing data');

  // Seed Categories
  const menCategory = await prisma.category.create({
    data: {
      title: 'MEN',
      slug: 'men',
      image: '/categories/men.png',
      link: '/men',
      sort: 1,
    },
  });

  const womenCategory = await prisma.category.create({
    data: {
      title: 'WOMEN',
      slug: 'women',
      image: '/categories/women.png',
      link: '/women',
      sort: 2,
    },
  });

  const kidsCategory = await prisma.category.create({
    data: {
      title: 'KIDS',
      slug: 'kids',
      image: '/categories/kids.png',
      link: '/kids',
      sort: 3,
    },
  });

  console.log('✓ Created categories');

  // Seed Subcategories - Men
  const menSubcategories = [
    { title: 'T-SHIRTS', slug: 'men-tshirts', image: '/categories/men-tshirts.png', link: '/men/tshirts', sort: 1 },
    { title: 'SHIRTS', slug: 'men-shirts', image: '/categories/men-shirts.png', link: '/men/shirts', sort: 2 },
    { title: 'JEANS', slug: 'men-jeans', image: '/categories/men-jeans.png', link: '/men/jeans', sort: 3 },
    { title: 'TROUSERS', slug: 'men-trousers', image: '/categories/men-trousers.png', link: '/men/trousers', sort: 4 },
    { title: 'JACKETS', slug: 'men-jackets', image: '/categories/men-jackets.png', link: '/men/jackets', sort: 5 },
    { title: 'SHOES', slug: 'men-shoes', image: '/categories/men-shoes.png', link: '/men/shoes', sort: 6 },
  ];

  for (const sub of menSubcategories) {
    await prisma.subcategory.create({
      data: { ...sub, categoryId: menCategory.id },
    });
  }

  // Seed Subcategories - Women
  const womenSubcategories = [
    { title: 'TOPS', slug: 'women-tops', image: '/categories/women-tops.png', link: '/women/tops', sort: 1 },
    { title: 'DRESSES', slug: 'women-dresses', image: '/categories/women-dresses.png', link: '/women/dresses', sort: 2 },
    { title: 'JEANS', slug: 'women-jeans', image: '/categories/women-jeans.png', link: '/women/jeans', sort: 3 },
    { title: 'SKIRTS', slug: 'women-skirts', image: '/categories/women-skirts.png', link: '/women/skirts', sort: 4 },
    { title: 'JACKETS', slug: 'women-jackets', image: '/categories/women-jackets.png', link: '/women/jackets', sort: 5 },
    { title: 'SHOES', slug: 'women-shoes', image: '/categories/women-shoes.png', link: '/women/shoes', sort: 6 },
  ];

  for (const sub of womenSubcategories) {
    await prisma.subcategory.create({
      data: { ...sub, categoryId: womenCategory.id },
    });
  }

  // Seed Subcategories - Kids
  const kidsSubcategories = [
    { title: 'BOYS T-SHIRTS', slug: 'kids-boys-tshirts', image: '/categories/kids-boys-tshirts.png', link: '/kids/boys-tshirts', sort: 1 },
    { title: 'GIRLS TOPS', slug: 'kids-girls-tops', image: '/categories/kids-girls-tops.png', link: '/kids/girls-tops', sort: 2 },
    { title: 'BOYS JEANS', slug: 'kids-boys-jeans', image: '/categories/kids-boys-jeans.png', link: '/kids/boys-jeans', sort: 3 },
    { title: 'GIRLS DRESSES', slug: 'kids-girls-dresses', image: '/categories/kids-girls-dresses.png', link: '/kids/girls-dresses', sort: 4 },
    { title: 'JACKETS', slug: 'kids-jackets', image: '/categories/kids-jackets.png', link: '/kids/jackets', sort: 5 },
    { title: 'SHOES', slug: 'kids-shoes', image: '/categories/kids-shoes.png', link: '/kids/shoes', sort: 6 },
  ];

  for (const sub of kidsSubcategories) {
    await prisma.subcategory.create({
      data: { ...sub, categoryId: kidsCategory.id },
    });
  }

  console.log('✓ Created subcategories');

  // Seed Products
  const products = [
    { name: 'Urban Oversized Tee', slug: 'urban-oversized-tee', description: 'Crafted for the modern urbanite, this oversized tee features premium cotton fabric and a relaxed fit. Perfect for street style looks.', price: 1299, originalPrice: 1599, image: '/products/men-tee.png', rating: 4.6, reviewCount: 124, categoryId: menCategory.id, isFeatured: true },
    { name: 'Slim Fit Chinos', slug: 'slim-fit-chinos', description: 'Versatile slim fit chinos that transition seamlessly from work to weekend. Made with stretch cotton for all-day comfort.', price: 1999, originalPrice: 2399, image: '/products/men-chinos.jpg', rating: 4.4, reviewCount: 98, categoryId: menCategory.id, isFeatured: true },
    { name: 'Floral Summer Dress', slug: 'floral-summer-dress', description: 'Embrace the season with this breezy floral dress. Features a flattering waistline and lightweight fabric.', price: 2499, originalPrice: 2999, image: '/products/women-dress.jpg', rating: 4.8, reviewCount: 176, categoryId: womenCategory.id, isFeatured: true },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: 'A classic denim jacket with a modern twist. Distressed details and a cropped fit make it a wardrobe essential.', price: 2999, originalPrice: 3499, image: '/products/women-jacket.jpg', rating: 4.5, reviewCount: 142, categoryId: womenCategory.id, isFeatured: true },
    { name: 'Kids Graphic Tee', slug: 'kids-graphic-tee', description: 'Fun and playful graphic tee for the little ones. Soft, durable fabric that stands up to playtime.', price: 799, originalPrice: 999, image: '/placeholders/thumb-default.jpg', rating: 4.7, reviewCount: 63, categoryId: kidsCategory.id, isFeatured: true },
    { name: 'Comfort Joggers', slug: 'comfort-joggers', description: 'Super soft joggers for active kids. Elastic waistband and ribbed cuffs ensure a perfect fit.', price: 999, originalPrice: 1199, image: '/placeholders/thumb-default.jpg', rating: 4.5, reviewCount: 58, categoryId: kidsCategory.id, isFeatured: true },
    { name: 'Boys Cotton T-Shirt', slug: 'boys-cotton-tshirt', description: 'Comfortable cotton t-shirt for boys, perfect for everyday wear', price: 299, originalPrice: 499, image: '/products/boys-tshirt-1.jpg', rating: 4.5, reviewCount: 145, categoryId: kidsCategory.id },
    { name: 'Girls Party Dress', slug: 'girls-party-dress', description: 'Beautiful party dress with floral patterns, perfect for special occasions', price: 799, originalPrice: 1299, image: '/products/girls-dress-1.jpg', rating: 4.8, reviewCount: 203, categoryId: kidsCategory.id },
    { name: 'Boys Denim Jeans', slug: 'boys-denim-jeans', description: 'Durable denim jeans with adjustable waist, comfortable fit', price: 599, originalPrice: 999, image: '/products/boys-jeans-1.jpg', rating: 4.3, reviewCount: 87, categoryId: kidsCategory.id },
    { name: 'Girls Leggings Set', slug: 'girls-leggings-set', description: 'Comfortable leggings with matching top, perfect for daily wear', price: 449, originalPrice: 699, image: '/products/girls-leggings-1.jpg', rating: 4.6, reviewCount: 156, categoryId: kidsCategory.id },
    { name: 'Kids Backpack', slug: 'kids-backpack', description: 'Spacious and colorful backpack with multiple compartments', price: 899, originalPrice: 1499, image: '/products/kids-backpack-1.jpg', rating: 4.7, reviewCount: 234, categoryId: kidsCategory.id },
    { name: 'Boys Sports Shoes', slug: 'boys-sports-shoes', description: 'Lightweight sports shoes with good grip and comfort', price: 1299, originalPrice: 1999, image: '/products/boys-shoes-1.jpg', rating: 4.4, reviewCount: 178, categoryId: kidsCategory.id },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('✓ Created products');

  // Seed Stores
  const stores = [
    {
      name: 'ZECODE Hesaraghatta',
      slug: 'hesaraghatta-road-bengaluru',
      address: '01, Bagalakunte, 1st cross, Hesarghatta Road, MEI Layout, Opposite BBMP Office',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560073',
      phone: '+91-8657039305',
      email: 'hessargatta@zecode.com',
      lat: 13.0576337,
      lng: 77.5069613,
      tags: ['Mallasandra', 'T. Dasarahalli', 'Nagasandra', 'Chokkasandra', 'Madavara', 'Chikkabanavara', 'Peenya', 'Jalahalli West'],
      workingHours: '10 AM to 10 PM',
      openedDate: '01/11/2024',
      placeId: 'ChIJMZMHeHcjrjsR1vSRgUCbrbc',
      description: 'Welcome to ZECODE Hesaraghatta, your one-stop destination for quality children\'s wear in Bengaluru.',
    },
    {
      name: 'ZECODE RT Nagar',
      slug: 'rt-nagar-bengaluru',
      address: '169, Matadahalli, Further Extension High Division, Near Indian Oil Petrol Pump, RT Nagar Main Road, MLA Layout, Krishnappa Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560032',
      phone: '+91-8657039306',
      email: 'rtnagar@zecode.com',
      lat: 13.0182407,
      lng: 77.591933,
      tags: ['Jalahalli', 'Jayanagar', 'Hormavu', 'RT Nagar'],
      workingHours: '10 AM to 10 PM',
      openedDate: '15/10/2024',
      placeId: 'ChIJ8Xkn99MXrjsROTR5MgmF5R4',
    },
    {
      name: 'ZECODE RR Nagar',
      slug: 'rr-nagar-bengaluru',
      address: '34/4A, Uttarahalli Main Road, Near RNS college next to Prince Royal Hotel, Channasandra, Kengeri',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560098',
      phone: '+91-8657039309',
      email: 'rrnagar@zecode.com',
      lat: 12.902684,
      lng: 77.5188986,
      tags: ['Chikkasandra', 'Hemmingganahalli', 'Nagarbhavi', 'Hesaraghatta'],
      workingHours: '10 AM to 10 PM',
      openedDate: '20/09/2024',
      placeId: 'ChIJszwtCqg_rjsRlnpiYG70GtA',
    },
    {
      name: 'ZECODE Sambhram College Road',
      slug: 'sambhram-college-road-bengaluru',
      address: 'Patel Arcade, 14, Kanshiram Nagara, Sadguru Layout, Lashmipura Main Road, Vaderhalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560097',
      phone: '+91-8657039302',
      email: 'sambhramcollege@zecode.com',
      lat: 13.090587,
      lng: 77.5385074,
      tags: ['Kengeri', 'Rajarajeshwari Nagar', 'Uttarahalli', 'RR Nagar'],
      workingHours: '10 AM to 10 PM',
      openedDate: '05/08/2024',
      placeId: 'ChIJf4ibRf8jrjsRPKs6p9orURg',
    },
    {
      name: 'ZECODE Vidyaranyapura',
      slug: 'vidyaranyapura-bengaluru',
      address: '960, Prithvi Arcade, Next to Paakashala, Vidyaranyapura Main Rd, BEL Layout 2nd Block, Chamundeswari Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560097',
      phone: '+91-8657039301',
      email: 'vidyaranyapura@zecode.com',
      lat: 13.0725551,
      lng: 77.55668539999999,
      tags: ['Santhe Yellu', 'HBR Nagar', 'Hebbal', 'Vidyaranya Korthy'],
      workingHours: '10 AM to 10 PM',
      openedDate: '12/07/2024',
      placeId: 'ChIJTVKWwpsjrjsRq8BvfnJCBv4',
    },
  ];

  for (const store of stores) {
    await prisma.store.create({
      data: store,
    });
  }

  console.log('✓ Created stores');

  // Seed Hero Slides
  await prisma.heroSlide.createMany({
    data: [
      { image: '/hero/hero1.png', title: 'YOUR NEW FASHION CODE', subtitle: 'Urban Clothing Stores in India', cta: 'FIND YOUR CODE', link: '/store-locator', sort: 1 },
      { image: '/hero/hero2.png', title: 'NEW ARRIVALS', subtitle: 'Discover the latest trends', cta: 'SHOP NOW', link: '/men', sort: 2 },
      { image: '/hero/hero3.png', title: 'KIDS COLLECTION', subtitle: 'Stylish wear for little ones', cta: 'EXPLORE', link: '/kids', sort: 3 },
    ],
  });

  console.log('✓ Created hero slides');

  // Seed Page Titles
  await prisma.pageTitle.createMany({
    data: [
      { slug: 'about', title: 'ABOUT US', subtitle: 'Know more about ZECODE' },
      { slug: 'store-locator', title: 'STORE LOCATOR', subtitle: 'Find a ZECODE store near you' },
      { slug: 'store-locator-map', title: 'STORE MAP', subtitle: 'Explore all ZECODE locations' },
      { slug: 'lit-zone', title: 'LIT ZONE', subtitle: 'The hottest trends and styles' },
      { slug: 'men', title: 'MEN', subtitle: 'Premium urban wear for men' },
      { slug: 'women', title: 'WOMEN', subtitle: 'Stylish fashion for women' },
      { slug: 'kids', title: 'KIDS', subtitle: 'Trendy and comfortable kids wear' },
    ],
  });

  console.log('✓ Created page titles');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
