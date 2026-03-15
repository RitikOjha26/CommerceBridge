const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { faker } = require("@faker-js/faker");

dotenv.config({ path: path.join(__dirname, "..", "config", "config.env") });
mongoose.set("strictQuery", true);

const User = require("../models/userModel");
const Product = require("../models/productModel");

const categories = ["Electronics", "Mobiles", "Laptops", "Fashion", "Appliances", "Home"];
const colors = ["Black", "Blue", "Silver", "Gray", "Green", "White", "Rose Gold", "Navy", "Olive", "Beige"];

const catalog = {
  Electronics: [
    { brand: "Sony", line: "WF-C710N", type: "True Wireless Earbuds", basePrice: 6999, warranty: 1, specs: ["Bluetooth 5.3", "30 Hours Battery", "IPX4 Rating"], highlights: ["Active noise cancellation", "Compact charging case", "Balanced sound profile"] },
    { brand: "boAt", line: "Airdopes 411 Max", type: "Wireless Earbuds", basePrice: 2499, warranty: 1, specs: ["ENx Calling", "45 Hours Battery", "ASAP Charge"], highlights: ["Affordable daily-use earbuds", "Deep bass tuning", "Good call clarity"] },
    { brand: "JBL", line: "Flip Essential 2", type: "Portable Bluetooth Speaker", basePrice: 7999, warranty: 1, specs: ["16W Output", "IPX7", "12 Hours Playtime"], highlights: ["Portable cylindrical design", "Punchy sound output", "Outdoor-ready build"] },
    { brand: "Noise", line: "ColorFit Pro 6", type: "Smart Watch", basePrice: 4499, warranty: 1, specs: ["1.96 inch AMOLED", "Bluetooth Calling", "Health Suite"], highlights: ["Bright AMOLED display", "Daily fitness tracking", "Good value smartwatch"] },
    { brand: "Canon", line: "EOS R50", type: "Mirrorless Camera", basePrice: 62999, warranty: 2, specs: ["24.2MP Sensor", "4K Video", "Dual Pixel AF"], highlights: ["Beginner-friendly camera", "Strong autofocus", "Compact travel form factor"] },
    { brand: "Logitech", line: "G435", type: "Gaming Headset", basePrice: 5499, warranty: 2, specs: ["Lightspeed Wireless", "40 mm Drivers", "18 Hours Battery"], highlights: ["Low-latency gaming audio", "Lightweight fit", "Works across PC and console"] },
    { brand: "Anker", line: "737", type: "Power Bank", basePrice: 9999, warranty: 1, specs: ["24000 mAh", "140W Output", "Digital Display"], highlights: ["Laptop-grade fast charging", "Premium build quality", "Travel-friendly capacity"] },
    { brand: "Samsung", line: "M8", type: "Smart Monitor", basePrice: 31999, warranty: 3, specs: ["32 inch 4K", "USB-C", "Smart TV Apps"], highlights: ["Monitor plus smart TV hybrid", "Clean desk setup", "Great for work and entertainment"] },
    { brand: "GoPro", line: "Hero 12", type: "Action Camera", basePrice: 37999, warranty: 1, specs: ["5.3K Video", "HyperSmooth", "Waterproof"], highlights: ["Adventure-ready camera", "Stabilized footage", "Best for travel creators"] },
    { brand: "Philips", line: "TAA4216", type: "Wireless Headphones", basePrice: 5999, warranty: 1, specs: ["35 mm Drivers", "35 Hours Battery", "Fast Charge"], highlights: ["Comfort-focused over-ear fit", "Long playback time", "Clear and balanced audio"] },
  ],
  Mobiles: [
    { brand: "Samsung", line: "Galaxy A55 5G", type: "Smartphone", basePrice: 36999, warranty: 1, specs: ["8GB RAM", "256GB Storage", "5000 mAh Battery"], highlights: ["Premium mid-range smartphone", "AMOLED display", "Reliable software support"] },
    { brand: "OnePlus", line: "Nord 4", type: "5G Smartphone", basePrice: 32999, warranty: 1, specs: ["8GB RAM", "128GB Storage", "100W Charging"], highlights: ["Fast charging focus", "Smooth UI experience", "Strong everyday performance"] },
    { brand: "Xiaomi", line: "Redmi Note 14 Pro", type: "5G Smartphone", basePrice: 28999, warranty: 1, specs: ["8GB RAM", "256GB Storage", "120Hz AMOLED"], highlights: ["Feature-rich value phone", "High refresh display", "Versatile camera setup"] },
    { brand: "realme", line: "GT Neo 7", type: "Gaming Smartphone", basePrice: 31999, warranty: 1, specs: ["12GB RAM", "256GB Storage", "5500 mAh Battery"], highlights: ["Performance-focused chipset", "Gaming-friendly thermals", "Fast charging included"] },
    { brand: "Motorola", line: "Edge 60 Fusion", type: "Curved Display Phone", basePrice: 27999, warranty: 1, specs: ["8GB RAM", "256GB Storage", "68W TurboPower"], highlights: ["Near-stock Android", "Slim in-hand feel", "Solid camera tuning"] },
    { brand: "Apple", line: "iPhone 15", type: "Smartphone", basePrice: 69999, warranty: 1, specs: ["128GB Storage", "A16 Bionic", "Super Retina XDR"], highlights: ["Premium ecosystem phone", "Strong camera quality", "Long-term software support"] },
    { brand: "POCO", line: "X7 Pro", type: "Performance Phone", basePrice: 25999, warranty: 1, specs: ["8GB RAM", "256GB Storage", "120W HyperCharge"], highlights: ["Aggressive performance pricing", "Large vapor cooling", "Fast charging standout"] },
    { brand: "vivo", line: "V40 5G", type: "Camera Smartphone", basePrice: 34999, warranty: 1, specs: ["8GB RAM", "256GB Storage", "ZEISS Camera"], highlights: ["Portrait-centric camera phone", "Slim premium design", "Good AMOLED panel"] },
    { brand: "OPPO", line: "Reno 12", type: "Camera Phone", basePrice: 33999, warranty: 1, specs: ["12GB RAM", "256GB Storage", "80W SuperVOOC"], highlights: ["Stylish thin body", "Fast charging", "Good selfie camera"] },
    { brand: "Nothing", line: "Phone (3a)", type: "5G Smartphone", basePrice: 31999, warranty: 1, specs: ["8GB RAM", "128GB Storage", "120Hz OLED"], highlights: ["Distinctive transparent design", "Clean software", "Balanced mid-premium offering"] },
  ],
  Laptops: [
    { brand: "HP", line: "Pavilion Plus 14", type: "Creator Laptop", basePrice: 74999, warranty: 1, specs: ["Intel Core Ultra 5", "16GB RAM", "512GB SSD"], highlights: ["OLED-class productivity laptop", "Portable metal chassis", "Ideal for creators and students"] },
    { brand: "Dell", line: "Inspiron 14 5440", type: "Thin Laptop", basePrice: 68999, warranty: 1, specs: ["Intel Core i5", "16GB RAM", "512GB SSD"], highlights: ["Balanced home and office laptop", "Trusted service network", "Comfortable keyboard"] },
    { brand: "Lenovo", line: "LOQ 15IRX9", type: "Gaming Laptop", basePrice: 87999, warranty: 1, specs: ["Intel Core i7", "RTX 4050", "16GB RAM"], highlights: ["Entry gaming sweet spot", "High-refresh display", "Strong thermal headroom"] },
    { brand: "ASUS", line: "Vivobook S15", type: "Student Laptop", basePrice: 65999, warranty: 1, specs: ["AMD Ryzen 7", "16GB RAM", "1TB SSD"], highlights: ["Slim and lightweight", "Great for coding and college", "Fast SSD storage"] },
    { brand: "Acer", line: "Swift Go 14", type: "Ultrabook", basePrice: 72999, warranty: 1, specs: ["Intel Core Ultra 7", "16GB RAM", "512GB SSD"], highlights: ["Portable metal ultrabook", "Sharp display", "Strong battery life"] },
    { brand: "Apple", line: "MacBook Air M3", type: "Premium Laptop", basePrice: 114999, warranty: 1, specs: ["Apple M3", "8GB Unified Memory", "256GB SSD"], highlights: ["Best-in-class battery life", "Silent design", "Excellent for everyday work"] },
    { brand: "MSI", line: "Katana 15", type: "Gaming Laptop", basePrice: 94999, warranty: 2, specs: ["Intel Core i7", "RTX 4060", "16GB RAM"], highlights: ["Gaming-focused chassis", "Dedicated GPU performance", "Good upgrade potential"] },
    { brand: "Samsung", line: "Galaxy Book4", type: "Business Laptop", basePrice: 79999, warranty: 1, specs: ["Intel Core 5", "16GB RAM", "512GB SSD"], highlights: ["Ecosystem-friendly laptop", "Minimal premium design", "Strong portability"] },
    { brand: "LG", line: "Gram 16", type: "Lightweight Laptop", basePrice: 109999, warranty: 1, specs: ["Intel Core Ultra 7", "16GB RAM", "1TB SSD"], highlights: ["Very lightweight large-screen laptop", "Huge battery life", "Built for mobility"] },
    { brand: "Honor", line: "MagicBook X16", type: "Office Laptop", basePrice: 58999, warranty: 1, specs: ["Intel Core i5", "16GB RAM", "512GB SSD"], highlights: ["Value productivity laptop", "Minimalist design", "Good for office workloads"] },
  ],
  Fashion: [
    { brand: "Levi's", line: "511", type: "Slim Fit Jeans", basePrice: 2499, warranty: 0, specs: ["Cotton Blend", "Mid Rise", "Machine Wash"], highlights: ["Classic everyday denim", "Comfort stretch fabric", "Versatile casual styling"] },
    { brand: "Nike", line: "Revolution 7", type: "Running Shoes", basePrice: 3999, warranty: 0, specs: ["Mesh Upper", "Foam Midsole", "Lace-Up"], highlights: ["Lightweight daily runner", "Breathable upper", "Comfortable underfoot feel"] },
    { brand: "Puma", line: "Essentials", type: "Zip Hoodie", basePrice: 2799, warranty: 0, specs: ["Cotton Polyester", "Regular Fit", "Full Sleeves"], highlights: ["Sporty casual layering piece", "Soft fleece interior", "Easy everyday styling"] },
    { brand: "Allen Solly", line: "Signature", type: "Casual Shirt", basePrice: 1999, warranty: 0, specs: ["100% Cotton", "Slim Fit", "Full Sleeves"], highlights: ["Office to weekend versatility", "Soft cotton hand feel", "Clean tailored silhouette"] },
    { brand: "H&M", line: "Studio", type: "Oversized T-Shirt", basePrice: 1299, warranty: 0, specs: ["Cotton Jersey", "Relaxed Fit", "Round Neck"], highlights: ["Streetwear-inspired fit", "Soft fabric", "Easy pairing with denim"] },
    { brand: "Roadster", line: "Urban Utility", type: "Bomber Jacket", basePrice: 3499, warranty: 0, specs: ["Poly Blend", "Regular Fit", "Zip Closure"], highlights: ["Layering-ready outerwear", "Modern casual look", "Ideal for mild winters"] },
    { brand: "Adidas", line: "Duramo SL", type: "Walking Shoes", basePrice: 4299, warranty: 0, specs: ["Textile Upper", "Rubber Outsole", "Cushioned Sole"], highlights: ["Daily walking comfort", "Trusted sports brand", "Lightweight construction"] },
    { brand: "Biba", line: "Festive Grace", type: "Kurta Set", basePrice: 3299, warranty: 0, specs: ["Viscose Blend", "Straight Fit", "Hand Wash"], highlights: ["Festive ethnic styling", "Comfortable drape", "Elegant print details"] },
    { brand: "US Polo Assn.", line: "Core Club", type: "Polo T-Shirt", basePrice: 1799, warranty: 0, specs: ["Pique Cotton", "Regular Fit", "Short Sleeves"], highlights: ["Classic polo styling", "Premium casual staple", "Smart-casual friendly"] },
    { brand: "Fastrack", line: "Active Street", type: "Analog Watch", basePrice: 2199, warranty: 1, specs: ["Quartz Movement", "Water Resistant", "Mineral Glass"], highlights: ["Affordable statement watch", "Daily wear design", "Youth-focused styling"] },
  ],
  Appliances: [
    { brand: "Philips", line: "NA130", type: "Air Fryer", basePrice: 8499, warranty: 2, specs: ["1700W", "6.2L Capacity", "Rapid Air Tech"], highlights: ["Oil-light cooking appliance", "Family-size basket", "Easy digital presets"] },
    { brand: "Prestige", line: "PIC 31", type: "Induction Cooktop", basePrice: 2899, warranty: 1, specs: ["2000W", "Push Button Control", "Auto Voltage"], highlights: ["Compact portable cooking", "Good for hostels and kitchens", "Easy cleaning surface"] },
    { brand: "LG", line: "NeoChef 28L", type: "Microwave Oven", basePrice: 12999, warranty: 1, specs: ["28L", "Convection", "Touch Panel"], highlights: ["Multi-mode cooking appliance", "Even heating", "Modern kitchen finish"] },
    { brand: "Samsung", line: "Jet Lite", type: "Vacuum Cleaner", basePrice: 15999, warranty: 1, specs: ["Cordless", "200W Suction", "HEPA Filter"], highlights: ["Cordless convenience", "Lightweight handheld design", "Works for home cleaning"] },
    { brand: "Whirlpool", line: "Magicook 20", type: "Solo Microwave", basePrice: 6999, warranty: 1, specs: ["20L", "Jog Dial", "Defrost Function"], highlights: ["Simple reheating appliance", "Compact for small kitchens", "Reliable brand support"] },
    { brand: "Kent", line: "Grand Plus", type: "Water Purifier", basePrice: 17999, warranty: 1, specs: ["RO+UV+UF", "8L Tank", "TDS Control"], highlights: ["Multiple purification stages", "Suitable for mixed water sources", "Popular home utility"] },
    { brand: "Havells", line: "Stealth Puro", type: "Air Purifier", basePrice: 14999, warranty: 1, specs: ["HEPA H13", "CADR 250", "Touch Controls"], highlights: ["Room air cleaning appliance", "Compact modern styling", "Quiet low-speed performance"] },
    { brand: "Bajaj", line: "Rex 750", type: "Mixer Grinder", basePrice: 3499, warranty: 2, specs: ["750W", "3 Jars", "Stainless Steel Blades"], highlights: ["Daily kitchen essential", "Strong motor", "Good for Indian cooking"] },
    { brand: "Eureka Forbes", line: "SmartClean", type: "Robot Vacuum", basePrice: 21999, warranty: 1, specs: ["App Control", "Auto Dock", "Multi-surface"], highlights: ["Automated floor cleaning", "Smart scheduling", "Good for larger homes"] },
    { brand: "Morphy Richards", line: "ToastX 4S", type: "Pop-up Toaster", basePrice: 2499, warranty: 1, specs: ["4 Slice", "Variable Browning", "Crumb Tray"], highlights: ["Breakfast utility appliance", "Easy operation", "Compact countertop footprint"] },
  ],
  Home: [
    { brand: "Wakefit", line: "AeroMesh", type: "Office Chair", basePrice: 6999, warranty: 1, specs: ["Mesh Back", "Height Adjustable", "Lumbar Support"], highlights: ["Ergonomic work-from-home chair", "Breathable backrest", "Good for long sitting hours"] },
    { brand: "Nilkamal", line: "Nova", type: "Study Table", basePrice: 5499, warranty: 1, specs: ["Engineered Wood", "Compact Width", "Open Shelves"], highlights: ["Student-friendly desk", "Compact footprint", "Simple modern styling"] },
    { brand: "Durian", line: "Heston", type: "Fabric Sofa", basePrice: 24999, warranty: 3, specs: ["3 Seater", "Solid Wood Frame", "Premium Upholstery"], highlights: ["Living-room centerpiece", "Comfortable seating depth", "Sturdy build quality"] },
    { brand: "HomeTown", line: "Cedar", type: "Coffee Table", basePrice: 3999, warranty: 1, specs: ["Engineered Wood", "Walnut Finish", "Storage Shelf"], highlights: ["Compact center table", "Warm wood finish", "Useful shelf storage"] },
    { brand: "IKEA", line: "MALM", type: "Chest of Drawers", basePrice: 11999, warranty: 1, specs: ["6 Drawers", "Particle Board", "Minimal Design"], highlights: ["Bedroom storage essential", "Clean Scandinavian design", "Functional drawer space"] },
    { brand: "Godrej Interio", line: "StorEase", type: "Wardrobe", basePrice: 21999, warranty: 1, specs: ["3 Door", "Lockable", "Mirror Panel"], highlights: ["Large storage capacity", "Family bedroom utility", "Practical interior layout"] },
    { brand: "Sleepyhead", line: "Original", type: "Mattress", basePrice: 14999, warranty: 5, specs: ["Queen Size", "Memory Foam", "Medium Firm"], highlights: ["Comfort-focused bedroom upgrade", "Pressure relief support", "Popular online mattress style"] },
    { brand: "Urban Ladder", line: "Edison", type: "Bookshelf", basePrice: 8999, warranty: 1, specs: ["Engineered Wood", "5 Shelves", "Wall-safe Design"], highlights: ["Living room and study storage", "Modern open shelf look", "Good decor utility"] },
    { brand: "Cello", line: "Max Fresh", type: "Plastic Storage Cabinet", basePrice: 4299, warranty: 1, specs: ["4 Shelves", "Moisture Resistant", "Easy Assembly"], highlights: ["Budget storage solution", "Lightweight cabinet", "Suitable for utility areas"] },
    { brand: "Pepperfry", line: "Solis", type: "TV Unit", basePrice: 9999, warranty: 1, specs: ["Engineered Wood", "Cable Management", "Closed Storage"], highlights: ["Living room entertainment console", "Contemporary style", "Useful hidden storage"] },
  ],
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickColor(index) {
  return colors[index % colors.length];
}

function makeStorage(index) {
  return ["128GB", "256GB", "512GB"][index % 3];
}

function makeRam(index) {
  return ["6GB", "8GB", "12GB", "16GB"][index % 4];
}

function makeSize(index) {
  return ["S", "M", "L", "XL", "XXL"][index % 5];
}

function buildVariantName(item, category, index) {
  const color = pickColor(index);

  if (category === "Mobiles") {
    return `${item.brand} ${item.line} ${makeRam(index)} ${makeStorage(index)} ${color}`;
  }

  if (category === "Laptops") {
    return `${item.brand} ${item.line} ${makeRam(index)} 512GB SSD ${color}`;
  }

  if (category === "Fashion") {
    return `${item.brand} ${item.line} ${item.type} ${color} Size ${makeSize(index)}`;
  }

  if (category === "Home") {
    return `${item.brand} ${item.line} ${item.type} ${color} Finish`;
  }

  return `${item.brand} ${item.line} ${item.type} ${color}`;
}

function buildDescription(item, category, index) {
  const variantName = buildVariantName(item, category, index);
  const fakerDesc = faker.commerce.productDescription();
  return `${variantName} — ${fakerDesc}`;
}

function buildSpecifications(item, category, index) {
  const specs = [];

  item.specs.forEach((entry, specIndex) => {
    if (entry.includes(": ")) {
      specs.push(entry);
      return;
    }

    const fallbackTitles = ["Feature", "Detail", "Attribute"];
    specs.push(`${fallbackTitles[specIndex] || "Spec"}: ${entry}`);
  });

  if (category === "Mobiles") {
    specs.push(`Color: ${pickColor(index)}`);
    specs.push(`Variant: ${makeRam(index)} + ${makeStorage(index)}`);
  } else if (category === "Laptops") {
    specs.push(`Color: ${pickColor(index)}`);
    specs.push(`Weight: ${["1.24 kg", "1.39 kg", "1.67 kg", "1.92 kg"][index % 4]}`);
  } else if (category === "Fashion") {
    specs.push(`Color: ${pickColor(index)}`);
    specs.push(`Size: ${makeSize(index)}`);
  } else if (category === "Appliances") {
    specs.push(`Color: ${["Black", "Silver", "White"][index % 3]}`);
    specs.push(`Installation Type: ${["Countertop", "Freestanding", "Portable"][index % 3]}`);
  } else if (category === "Home") {
    specs.push(`Primary Color: ${pickColor(index)}`);
    specs.push(`Assembly: ${["DIY", "Carpenter Assembly", "Pre-assembled"][index % 3]}`);
  } else {
    specs.push(`Color: ${pickColor(index)}`);
    specs.push(`In The Box: Main Unit, Cable, User Manual`);
  }

  return specs.map((entry) => {
    const separatorIndex = entry.indexOf(": ");
    const title = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : "Spec";
    const description = separatorIndex >= 0 ? entry.slice(separatorIndex + 2) : entry;
    return { title, description };
  });
}

function buildHighlights(item, category, index) {
  const variantSpecific =
    category === "Mobiles"
      ? `Variant configured with ${makeRam(index)} RAM and ${makeStorage(index)} storage`
      : category === "Fashion"
        ? `Available in ${pickColor(index)} and size ${makeSize(index)}`
        : category === "Laptops"
          ? `Configured in ${pickColor(index)} finish for premium desk presence`
          : `Available in ${pickColor(index)} finish`;

  return [...item.highlights, variantSpecific, faker.lorem.sentence()];
}

function buildReviews(userId, count, productRating) {
  return Array.from({ length: count }, () => {
    const rating = Math.min(5, Math.max(1, Math.round((productRating + faker.number.float({ min: -1, max: 0.5 })) * 10) / 10));
    return {
      user: userId,
      name: faker.person.fullName(),
      rating,
      comment: faker.lorem.sentences(2),
    };
  });
}

function buildPrice(item, category, index) {
  const cycle = [0, 499, 999, 1499, 1999];
  const bump = cycle[index % cycle.length] + Math.floor(index / 10) * 350;

  if (category === "Fashion") return item.basePrice + (index % 5) * 150 + Math.floor(index / 10) * 100;
  if (category === "Mobiles") return item.basePrice + bump;
  if (category === "Laptops") return item.basePrice + bump * 2;
  if (category === "Home") return item.basePrice + bump;

  return item.basePrice + bump;
}

function buildProduct(item, category, index, userId) {
  const name = buildVariantName(item, category, index);
  const price = buildPrice(item, category, index);
  const cuttedPrice = price + Math.max(700, Math.round(price * (0.12 + (index % 4) * 0.03)));
  const slug = slugify(`${category}-${item.brand}-${item.line}-${index + 1}`);
  const rating = Number((3.8 + (index % 12) * 0.1).toFixed(1));
  const reviewsCount = 18 + (index % 33) + Math.floor(index / 10) * 4;

  return {
    name,
    description: buildDescription(item, category, index),
    highlights: buildHighlights(item, category, index),
    specifications: buildSpecifications(item, category, index),
    price,
    cuttedPrice,
    images: [
      {
        public_id: `seed/${slug}/primary`,
        url: `https://dummyimage.com/800x800/f5f5f5/222222&text=${encodeURIComponent(name)}`,
      },
      {
        public_id: `seed/${slug}/alt-1`,
        url: `https://dummyimage.com/800x800/e9eef6/222222&text=${encodeURIComponent(`${item.brand} ${item.type}`)}`,
      },
    ],
    brand: {
      name: item.brand,
      logo: {
        public_id: `seed/brand/${slugify(item.brand)}`,
        url: `https://dummyimage.com/280x90/0f172a/ffffff&text=${encodeURIComponent(item.brand)}`,
      },
    },
    category,
    stock: category === "Fashion" ? 25 + (index % 70) : 10 + (index % 45),
    warranty: item.warranty,
    ratings: rating,
    numOfReviews: reviewsCount,
    reviews: buildReviews(userId, 3 + (index % 6), rating),
    user: userId,
    createdAt: new Date(Date.now() - index * 86400000),
  };
}

async function upsertSeederUser() {
  let user = await User.findOne({ email: "seedadmin@example.com" });

  if (!user) {
    user = await User.create({
      name: "Seeder Admin",
      email: "seedadmin@example.com",
      gender: "male",
      password: "seedadmin123",
      role: "admin",
      avatar: {
        public_id: "seed/admin-avatar",
        url: "https://dummyimage.com/200x200/1f2937/ffffff&text=Admin",
      },
    });
  }

  return user;
}

async function seedProducts() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const reset = process.argv.includes("--reset");
  const seederUser = await upsertSeederUser();

  if (reset) {
    await Product.deleteMany({});
  }

  const products = [];

  for (const category of categories) {
    const templates = catalog[category];

    for (let i = 0; i < 150; i += 1) {
      const template = templates[i % templates.length];
      products.push(buildProduct(template, category, i, seederUser._id));
    }
  }

  await Product.insertMany(products);

  console.log(`Inserted ${products.length} realistic catalog products using user ${seederUser.email}`);
  await mongoose.disconnect();
}

seedProducts().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
