import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MarketplaceProductModel } from '../models/marketplace/MarketplaceProduct.model';
import { MarketplaceServiceModel } from '../models/marketplace/MarketplaceService.model';

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
  },
  {
    title: "Stock Photo Collection - Business & Corporate",
    description: "High-quality stock photo collection featuring 100 professional business and corporate images. Perfect for websites, presentations, and marketing materials.",
    category: "Stock Media",
    subcategory: "Business",
    price: 29,
    originalPrice: 59,
    images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"],
    thumbnailImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    fileUrl: "https://example.com/photos/business-collection.zip",
    previewUrl: "https://example.com/preview/business-photos",
    fileFormat: "JPG/PNG",
    fileSize: "125.8 MB",
    features: ["100 High-Res Images", "Commercial License", "Multiple Formats", "Organized Folders", "Metadata Included"],
    specifications: {
      "Resolution": "4K (3840x2160)",
      "Format": "JPG/PNG",
      "License": "Commercial",
      "Usage": "Unlimited"
    },
    whatIncluded: ["100 Stock Photos", "Metadata Files", "License Document", "Usage Guidelines"],
    requirements: ["Image Viewer", "ZIP Extractor"],
    tags: ["stock", "photos", "business", "corporate", "professional"],
    license: "Commercial",
    downloadLimit: 10,
    accessDuration: "Lifetime",
    instantDownload: true,
    updates: "No updates needed",
    support: "Email support",
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
    addOns: [
      { name: "Rush Delivery", description: "24-hour delivery", price: 20 },
      { name: "Social Media Kit", description: "Social media templates", price: 30 },
      { name: "Business Card Design", description: "Matching business card", price: 25 }
    ],
    portfolio: [
      {
        title: "Tech Startup Logo",
        description: "Modern logo for a fintech startup",
        image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
        category: "Technology"
      },
      {
        title: "Restaurant Brand Identity",
        description: "Complete brand identity for a fine dining restaurant",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
        category: "Food & Beverage"
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
  },
  {
    title: "Website Development - React/Next.js Full Stack",
    description: "I will build a modern, responsive website using React and Next.js with full backend integration. Perfect for businesses, portfolios, and e-commerce sites.",
    category: "Web Development",
    subcategory: "Full Stack",
    images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"],
    thumbnailImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    videoUrl: "https://example.com/videos/web-development-demo.mp4",
    packages: [
      {
        name: "Basic",
        description: "Simple 5-page website with contact form",
        price: 299,
        originalPrice: 599,
        deliveryTime: "1 Week",
        revisions: 2,
        features: ["5 Pages", "Responsive Design", "Contact Form", "Basic SEO", "1 Month Support"],
        isPopular: false
      },
      {
        name: "Standard",
        description: "Full-featured website with CMS",
        price: 599,
        originalPrice: 1199,
        deliveryTime: "2 Weeks",
        revisions: 3,
        features: ["10 Pages", "CMS Integration", "SEO Optimized", "Analytics Setup", "3 Months Support"],
        isPopular: true
      },
      {
        name: "Premium",
        description: "Advanced website with custom features",
        price: 999,
        originalPrice: 1999,
        deliveryTime: "3 Weeks",
        revisions: 5,
        features: ["Unlimited Pages", "Custom Features", "Advanced SEO", "Performance Optimization", "6 Months Support"],
        isPopular: false
      }
    ],
    addOns: [
      { name: "E-commerce Integration", description: "Online store functionality", price: 200 },
      { name: "Mobile App", description: "React Native mobile app", price: 500 },
      { name: "SEO Optimization", description: "Advanced SEO setup", price: 100 }
    ],
    portfolio: [
      {
        title: "E-commerce Platform",
        description: "Full-stack e-commerce with payment integration",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
        category: "E-commerce"
      },
      {
        title: "Corporate Website",
        description: "Professional corporate website with CMS",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
        category: "Corporate"
      }
    ],
    whatYouGet: ["Fully functional website", "Source code", "Documentation", "Deployment assistance", "Training session"],
    requirements: ["Project requirements", "Design preferences", "Content materials", "Domain information", "Hosting preferences"],
    faqs: [
      {
        question: "What technologies do you use?",
        answer: "I use React, Next.js, Node.js, MongoDB, and modern web technologies."
      },
      {
        question: "Do you provide hosting?",
        answer: "I can help you set up hosting and deploy your website."
      }
    ],
    tags: ["web-development", "react", "nextjs", "fullstack", "responsive"],
    deliveryTime: "1-3 weeks",
    revisions: "2-5 revisions"
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/0xmintyn');
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
    
    // Use the specific seller ID from the database
    const sellerId = new mongoose.Types.ObjectId('68df4f264603ea259fe23a53');
    
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      sellerId: sellerId,
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
    
    // Use the specific seller ID from the database
    const sellerId = new mongoose.Types.ObjectId('68df4f264603ea259fe23a53');
    
    const servicesWithSeller = sampleServices.map(service => ({
      ...service,
      sellerId: sellerId,
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
