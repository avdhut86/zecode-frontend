import { Product } from '@/types/store';

export const PRODUCTS: Product[] = [
    {
        id: 1,
        name: "Boys Cotton T-Shirt",
        slug: "boys-cotton-tshirt",
        description: "Comfortable cotton t-shirt for boys, perfect for everyday wear",
        price: 299,
        originalPrice: 499,
        image: "/products/boys-tshirt-1.jpg",
        category: "Boys Clothing",
        inStock: true,
        rating: 4.5,
        reviewCount: 145
    },
    {
        id: 2,
        name: "Girls Party Dress",
        slug: "girls-party-dress",
        description: "Beautiful party dress with floral patterns, perfect for special occasions",
        price: 799,
        originalPrice: 1299,
        image: "/products/girls-dress-1.jpg",
        category: "Girls Clothing",
        inStock: true,
        rating: 4.8,
        reviewCount: 203
    },
    {
        id: 3,
        name: "Boys Denim Jeans",
        slug: "boys-denim-jeans",
        description: "Durable denim jeans with adjustable waist, comfortable fit",
        price: 599,
        originalPrice: 999,
        image: "/products/boys-jeans-1.jpg",
        category: "Boys Clothing",
        inStock: true,
        rating: 4.3,
        reviewCount: 87
    },
    {
        id: 4,
        name: "Girls Leggings Set",
        slug: "girls-leggings-set",
        description: "Comfortable leggings with matching top, perfect for daily wear",
        price: 449,
        originalPrice: 699,
        image: "/products/girls-leggings-1.jpg",
        category: "Girls Clothing",
        inStock: true,
        rating: 4.6,
        reviewCount: 156
    },
    {
        id: 5,
        name: "Kids Backpack",
        slug: "kids-backpack",
        description: "Spacious and colorful backpack with multiple compartments",
        price: 899,
        originalPrice: 1499,
        image: "/products/kids-backpack-1.jpg",
        category: "Accessories",
        inStock: true,
        rating: 4.7,
        reviewCount: 234
    },
    {
        id: 6,
        name: "Boys Sports Shoes",
        slug: "boys-sports-shoes",
        description: "Lightweight sports shoes with good grip and comfort",
        price: 1299,
        originalPrice: 1999,
        image: "/products/boys-shoes-1.jpg",
        category: "Footwear",
        inStock: true,
        rating: 4.4,
        reviewCount: 178
    },
    {
        id: 7,
        name: "Girls Sandals",
        slug: "girls-sandals",
        description: "Stylish and comfortable sandals for girls",
        price: 499,
        originalPrice: 799,
        image: "/products/girls-sandals-1.jpg",
        category: "Footwear",
        inStock: true,
        rating: 4.5,
        reviewCount: 92
    },
    {
        id: 8,
        name: "Boys Hoodie",
        slug: "boys-hoodie",
        description: "Warm and comfortable hoodie for winter season",
        price: 799,
        originalPrice: 1299,
        image: "/products/boys-hoodie-1.jpg",
        category: "Boys Clothing",
        inStock: true,
        rating: 4.6,
        reviewCount: 167
    },
    {
        id: 9,
        name: "Girls School Uniform",
        slug: "girls-school-uniform",
        description: "Complete school uniform set with shirt and skirt",
        price: 899,
        originalPrice: 1499,
        image: "/products/girls-uniform-1.jpg",
        category: "School Uniform",
        inStock: true,
        rating: 4.7,
        reviewCount: 312
    },
    {
        id: 10,
        name: "Kids Water Bottle",
        slug: "kids-water-bottle",
        description: "BPA-free water bottle with fun cartoon designs",
        price: 249,
        originalPrice: 399,
        image: "/products/water-bottle-1.jpg",
        category: "Accessories",
        inStock: true,
        rating: 4.4,
        reviewCount: 189
    },
    {
        id: 11,
        name: "Boys Shorts",
        slug: "boys-shorts",
        description: "Comfortable cotton shorts for summer",
        price: 349,
        originalPrice: 599,
        image: "/products/boys-shorts-1.jpg",
        category: "Boys Clothing",
        inStock: true,
        rating: 4.3,
        reviewCount: 76
    },
    {
        id: 12,
        name: "Girls Hair Accessories Set",
        slug: "girls-hair-accessories",
        description: "Beautiful set of hair clips, bands, and scrunchies",
        price: 199,
        originalPrice: 349,
        image: "/products/hair-accessories-1.jpg",
        category: "Accessories",
        inStock: true,
        rating: 4.6,
        reviewCount: 145
    }
];

export function getProductById(id: number): Product | undefined {
    return PRODUCTS.find(product => product.id === id);
}

export function getProductsByIds(ids: number[]): Product[] {
    return ids.map(id => getProductById(id)).filter((product): product is Product => product !== undefined);
}
