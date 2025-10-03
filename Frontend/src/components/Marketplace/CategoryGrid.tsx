'use client';

import React from 'react';
import { 
  Laptop, 
  BookOpen, 
  Shirt, 
  Home, 
  Gamepad2, 
  Smartphone,
  Palette,
  Code,
  PenTool,
  Megaphone,
  GraduationCap,
  Camera,
  Music,
  Briefcase,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const productCategories = [
  { id: 'templates', name: 'Website Templates', icon: FileText, count: 750, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
  { id: 'design', name: 'Design Assets', icon: Palette, count: 890, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  { id: 'code', name: 'Code Templates', icon: Code, count: 650, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { id: 'ebooks', name: 'E-books & Guides', icon: BookOpen, count: 450, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
  { id: 'software', name: 'Software & Tools', icon: Laptop, count: 320, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' },
  { id: 'media', name: 'Stock Media', icon: Camera, count: 1250, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  { id: 'fonts', name: 'Fonts & Typography', icon: PenTool, count: 280, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  { id: '3d', name: '3D Assets', icon: Gamepad2, count: 180, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' }
];

const serviceCategories = [
  { id: 'design', name: 'Design & Creative', icon: Palette, count: 320, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  { id: 'development', name: 'Web Development', icon: Code, count: 180, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { id: 'writing', name: 'Writing & Translation', icon: PenTool, count: 250, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
  { id: 'marketing', name: 'Digital Marketing', icon: Megaphone, count: 190, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { id: 'education', name: 'Tutoring & Education', icon: GraduationCap, count: 140, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  { id: 'photography', name: 'Photography', icon: Camera, count: 95, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
  { id: 'music', name: 'Music & Audio', icon: Music, count: 80, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' },
  { id: 'business', name: 'Business Services', icon: Briefcase, count: 120, color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400' }
];

interface CategoryGridProps {
  activeTab: 'products' | 'services';
}

export default function CategoryGrid({ activeTab }: CategoryGridProps) {
  const categories = activeTab === 'products' ? productCategories : serviceCategories;

  return (
    <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Browse Categories
          </h2>
          <Button variant="outline" size="sm">
            View All Categories
          </Button>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group cursor-pointer bg-background rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-3 ${category.color}`}>
                <category.icon className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {category.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {category.count} items
              </Badge>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
