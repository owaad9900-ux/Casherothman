import { Product } from "../types";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    nameAr: "إسبريسو سينغل",
    nameEn: "Single Espresso",
    price: 9.00,
    cost: 1.80,
    quantity: 150,
    minQuantity: 20,
    category: "drinks-hot",
    barcode: "628100100011",
    isAvailable: true
  },
  {
    id: "prod-2",
    nameAr: "كورتادو مختص",
    nameEn: "Specialty Cortado",
    price: 14.00,
    cost: 3.10,
    quantity: 120,
    minQuantity: 15,
    category: "drinks-hot",
    barcode: "628100100012",
    isAvailable: true
  },
  {
    id: "prod-3",
    nameAr: "فلات وايت كلاسيك",
    nameEn: "Classic Flat White",
    price: 15.00,
    cost: 3.50,
    quantity: 110,
    minQuantity: 15,
    category: "drinks-hot",
    barcode: "628100100013",
    isAvailable: true
  },
  {
    id: "prod-4",
    nameAr: "كابتشينو كلاسيك",
    nameEn: "Classic Cappuccino",
    price: 16.00,
    cost: 3.80,
    quantity: 80,
    minQuantity: 15,
    category: "drinks-hot",
    barcode: "628100100014",
    isAvailable: true
  },
  {
    id: "prod-5",
    nameAr: "سبانيش لاتييه حار",
    nameEn: "Hot Spanish Latte",
    price: 18.00,
    cost: 4.20,
    quantity: 95,
    minQuantity: 20,
    category: "drinks-hot",
    barcode: "628100100015",
    isAvailable: true
  },
  {
    id: "prod-6",
    nameAr: "كيمكس قطر v60",
    nameEn: "v60 Chemex Drip",
    price: 19.00,
    cost: 4.80,
    quantity: 200,
    minQuantity: 25,
    category: "drinks-hot",
    barcode: "628100100016",
    isAvailable: true
  },
  {
    id: "prod-7",
    nameAr: "سبانيش لاتييه مثلج",
    nameEn: "Iced Spanish Latte",
    price: 19.00,
    cost: 4.30,
    quantity: 140,
    minQuantity: 25,
    category: "drinks-cold",
    barcode: "628100100021",
    isAvailable: true
  },
  {
    id: "prod-8",
    nameAr: "كولد برو منقع 12 ساعة",
    nameEn: "12hr Brewed Cold Brew",
    price: 21.00,
    cost: 5.00,
    quantity: 35,
    minQuantity: 10,
    category: "drinks-cold",
    barcode: "628100100022",
    isAvailable: true
  },
  {
    id: "prod-9",
    nameAr: "أسبريسو ليمونادة غازية",
    nameEn: "Espresso Lemonade Tonic",
    price: 22.00,
    cost: 5.50,
    quantity: 5, // Low stock on purpose to trigger immediate automated notification
    minQuantity: 12,
    category: "drinks-cold",
    barcode: "628100100023",
    isAvailable: true
  },
  {
    id: "prod-10",
    nameAr: "ماتشا لاتييه مثلج عضوي",
    nameEn: "Iced Premium Matcha Latte",
    price: 21.00,
    cost: 6.20,
    quantity: 45,
    minQuantity: 15,
    category: "drinks-cold",
    barcode: "628100100024",
    isAvailable: true
  },
  {
    id: "prod-11",
    nameAr: "كرواسون زبدة فرنسي",
    nameEn: "French Butter Croissant",
    price: 12.00,
    cost: 3.00,
    quantity: 4, // Low stock to trigger alert
    minQuantity: 10,
    category: "food",
    barcode: "628100100031",
    isAvailable: true
  },
  {
    id: "prod-12",
    nameAr: "كيكة الزعفران بالحليب",
    nameEn: "Saffron Milk Cake",
    price: 24.00,
    cost: 7.00,
    quantity: 18,
    minQuantity: 8,
    category: "food",
    barcode: "628100100032",
    isAvailable: true
  },
  {
    id: "prod-13",
    nameAr: "كوكيز كلاسيك رقائق الشوكولاته",
    nameEn: "Classic Chocolate Chip Cookie",
    price: 10.00,
    cost: 2.20,
    quantity: 40,
    minQuantity: 10,
    category: "food",
    barcode: "628100100033",
    isAvailable: true
  },
  {
    id: "prod-14",
    nameAr: "كيس بن كولومبيا مختص (250g)",
    nameEn: "Colombian Specialty Beans Bag (250g)",
    price: 65.00,
    cost: 32.00,
    quantity: 3, // Low stock to trigger alert
    minQuantity: 8,
    category: "retail",
    barcode: "628100100041",
    isAvailable: true
  },
  {
    id: "prod-15",
    nameAr: "كيس بن أثيوبيا هيرلوم (250g)",
    nameEn: "Ethiopian Heirloom Beans Bag (250g)",
    price: 70.00,
    cost: 35.00,
    quantity: 15,
    minQuantity: 8,
    category: "retail",
    barcode: "628100100042",
    isAvailable: true
  }
];
