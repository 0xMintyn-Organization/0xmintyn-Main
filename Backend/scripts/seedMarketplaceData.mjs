import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MarketplaceProductModel } from '../models/marketplace/MarketplaceProduct.model.js';
import { MarketplaceServiceModel } from '../models/marketplace/MarketplaceService.model.js';

dotenv.config();

// Sample products data
const sampleProducts = [
  {
    title: "Premium Website Template Pack - Modern Business",
    description: "A complete collection of 10 modern, responsive website templates perfect for business websites. Includes HTML, CSS, JavaScript files with clean, professional design.",
    category: "Website Templates",
    subcategory: "Business",
    price: 49,
    originalPrice: 99,
    images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"],
    thumbnailImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    fileUrl: "https://example.com/templates/business-pack.zip",
    previewUrl: "https://example.com/preview/business-pack",
    fileFormat: "HTML/CSS",
    fileSize: "25.4 MB",
    features: ["10 Responsive Templates", "Mobile-First Design", "Cross-Browser Compatible", "SEO Optimized", "Clean Code"],
    specifications: {
      "Framework": "HTML5/CSS3",
      "Bootstrap": "5.0+",
      "Browser Support": "All Modern Browsers",
      "Responsive": "Yes"
    },
    whatIncluded: ["10 HTML Templates", "CSS Stylesheets", "JavaScript Files", "Documentation", "License File"],
    requirements: ["Basic HTML/CSS Knowledge", "Text Editor", "Web Browser"],
    tags: ["website", "template", "business", "responsive", "modern"],
    license: "Commercial",
    downloadLimit: 5,
    accessDuration: "Lifetime",
    instantDownload: true,
    updates: "6 months free updates",
    support: "Email support included",
    documentation: true
  },
  {
    title: "Professional UI/UX Design Kit - Figma",
    description: "Complete UI/UX design system with 200+ components, icons, and templates. Perfect for designers and developers working on modern web applications.",
    category: "Design Assets",
    subcategory: "UI/UX",
    price: 79,
    originalPrice: 149,
    images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop"],
    thumbnailImage: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop",
    fileUrl: "https://example.com/designs/ui-kit.fig",
    previewUrl: "https://example.com/preview/ui-kit",
    fileFormat: "Figma/Sketch",
    fileSize: "45.2 MB",
    features: ["200+ Components", "Icon Library", "Color System", "Typography Scale", "Grid System"],
    specifications: {
      "Software": "Figma",
      "Components": "200+",
      "Icons": "500+",
      "Templates": "20+"
    },
    whatIncluded: ["Figma File", "Component Library", "Icon Set", "Style Guide", "Usage Examples"],
    requirements: ["Figma Account", "Figma Desktop App"],
    tags: ["ui", "ux", "design", "figma", "components"],
    license: "Extended",
    downloadLimit: 3,
    accessDuration: "Lifetime",
    instantDownload: true,
    updates: "1 year free updates",
    support: "Community support",
    documentation: true
  }
];

// Sample services data
const sampleServices = [
  {
    title: "Professional Logo Design - Complete Brand Identity",
    description: "I will create a unique, professional logo design for your business along with complete brand identity guidelines. Perfect for startups and established businesses looking to refresh their brand.",
    category: "Design & Creative",
    subcategory: "Logo Design",
    images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop"],
    thumbnailImage: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop",
    videoUrl: "https://example.com/videos/logo-design-demo.mp4",
    packages: [
      {
        name: "Basic",
        description: "Simple logo design with 2 concepts",
        price: 25,
        originalPrice: 50,
        deliveryTime: "3 Days",
        revisions: 2,
        features: ["2 Logo Concepts", "2 Revisions", "PNG & JPG Files", "Transparent Background"],
        isPopular: false
      },
      {
        name: "Standard",
        description: "Complete logo with brand guidelines",
        price: 75,
        originalPrice: 150,
        deliveryTime: "5 Days",
        revisions: 3,
        features: ["3 Logo Concepts", "3 Revisions", "All File Formats", "Brand Guidelines", "Business Card Design"],
        isPopular: true
      },
      {
        name: "Premium",
        description: "Full brand identity system",
        price: 150,
        originalPrice: 300,
        deliveryTime: "1 Week",
        revisions: 5,
        features: ["5 Logo Concepts", "Unlimited Revisions", "Complete Brand Guidelines", "Business Card Design", "Letterhead Design", "Social Media Kit"],
        isPopular: false
      }
    ],
    whatYouGet: ["High-quality logo files", "Brand guidelines document", "Source files", "Commercial usage rights", "Lifetime support"],
    requirements: ["Business name", "Industry description", "Color preferences", "Style references", "Target audience"],
    faqs: [
      {
        question: "What file formats will I receive?",
        answer: "You'll receive PNG, JPG, PDF, AI, and SVG files in various sizes."
      },
      {
        question: "Can I request changes after delivery?",
        answer: "Yes, you have the number of revisions specified in your package."
      }
    ],
    tags: ["logo", "branding", "design", "identity", "professional"],
    deliveryTime: "3-7 days",
    revisions: "2-5 revisions"
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/0xmintyn');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Seed products
async function seedProducts() {
  try {
    console.log('🌱 Seeding products...');
    
    // Create a dummy seller ID (you'll need to replace this with actual admin user ID)
    const adminSellerId = new mongoose.Types.ObjectId();
    
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      sellerId: adminSellerId,
      isApproved: true,
      approvalStatus: 'Approved'
    }));
    
    await MarketplaceProductModel.insertMany(productsWithSeller);
    console.log(`✅ Successfully seeded ${sampleProducts.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
}

// Seed services
async function seedServices() {
  try {
    console.log('🌱 Seeding services...');
    
    // Create a dummy seller ID (you'll need to replace this with actual admin user ID)
    const adminSellerId = new mongoose.Types.ObjectId();
    
    const servicesWithSeller = sampleServices.map(service => ({
      ...service,
      sellerId: adminSellerId,
      isApproved: true,
      approvalStatus: 'Approved'
    }));
    
    await MarketplaceServiceModel.insertMany(servicesWithSeller);
    console.log(`✅ Successfully seeded ${sampleServices.length} services`);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  
  // Clear existing data (optional)
  // await MarketplaceProductModel.deleteMany({});
  // await MarketplaceServiceModel.deleteMany({});
  
  await seedProducts();
  await seedServices();
  
  console.log('🎉 Database seeding completed!');
  process.exit(0);
}

// Run the script
main().catch(console.error);
