'use client';

import React, { useState } from 'react';
import { Download, Eye, Heart, Search, Filter, Grid, List, FileText, Code, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Sample digital library data
const libraryItems = [
  {
    id: 1,
    title: "Premium Website Template Pack",
    type: "Template",
    fileFormat: "HTML/CSS",
    fileSize: "25.4 MB",
    purchaseDate: "2024-01-15",
    downloadCount: 3,
    maxDownloads: 5,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    seller: "WebCraft",
    license: "Commercial",
    status: "active"
  },
  {
    id: 2,
    title: "Professional UI/UX Design Kit",
    type: "Design Assets",
    fileFormat: "Figma/Sketch",
    fileSize: "12.8 MB",
    purchaseDate: "2024-01-10",
    downloadCount: 1,
    maxDownloads: 10,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
    seller: "DesignPro",
    license: "Extended",
    status: "active"
  },
  {
    id: 3,
    title: "Stock Photo Collection - Business",
    type: "Stock Photos",
    fileFormat: "JPG/PNG",
    fileSize: "45.2 MB",
    purchaseDate: "2024-01-05",
    downloadCount: 2,
    maxDownloads: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    seller: "PhotoStock",
    license: "Standard",
    status: "active"
  },
  {
    id: 4,
    title: "Cryptocurrency Trading eBook",
    type: "E-book",
    fileFormat: "PDF",
    fileSize: "8.7 MB",
    purchaseDate: "2023-12-20",
    downloadCount: 1,
    maxDownloads: 3,
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=200&fit=crop",
    seller: "CryptoEdu",
    license: "Personal",
    status: "active"
  },
  {
    id: 5,
    title: "React Native App Template",
    type: "Code Template",
    fileFormat: "React Native",
    fileSize: "156.3 MB",
    purchaseDate: "2023-12-15",
    downloadCount: 0,
    maxDownloads: 5,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop",
    seller: "CodeMaster",
    license: "Commercial",
    status: "active"
  },
  {
    id: 6,
    title: "Premium Font Collection",
    type: "Fonts",
    fileFormat: "TTF/OTF",
    fileSize: "12.1 MB",
    purchaseDate: "2023-12-10",
    downloadCount: 4,
    maxDownloads: 5,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop",
    seller: "TypeCraft",
    license: "Extended",
    status: "expired"
  }
];

const typeIcons = {
  "Template": FileText,
  "Design Assets": Image,
  "Stock Photos": Image,
  "E-book": FileText,
  "Code Template": Code,
  "Fonts": FileText,
  "Software": Code,
  "Video": Video,
  "Audio": Music
};

export default function DigitalLibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [favorites, setFavorites] = useState<number[]>([]);

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const handleDownload = (item: any) => {
    if (item.downloadCount >= item.maxDownloads) {
      alert('Maximum downloads reached for this item');
      return;
    }
    // Simulate download
    console.log('Downloading:', item.title);
    alert(`Downloading ${item.title}...`);
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Digital Library</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Access all your purchased digital products
              </p>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search your library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground"
              >
                <option value="all">All Types</option>
                <option value="Template">Templates</option>
                <option value="Design Assets">Design Assets</option>
                <option value="Stock Photos">Stock Photos</option>
                <option value="E-book">E-books</option>
                <option value="Code Template">Code Templates</option>
                <option value="Fonts">Fonts</option>
              </select>
              
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-green-900 hover:bg-green-800 text-white rounded-r-none' : 'rounded-r-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-green-900 hover:bg-green-800 text-white rounded-l-none' : 'rounded-l-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* List View */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-zinc-200 dark:border-zinc-700">
                <div className="flex">
                  <div className="w-32 h-24 relative flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover rounded-l-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 rounded-l-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {item.status === 'expired' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          by {item.seller} • Purchased {new Date(item.purchaseDate).toLocaleDateString()}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            {getTypeIcon(item.type)}
                            <span className="ml-1">{item.type}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.fileFormat}
                          </Badge>
                          <span>{item.fileSize}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.license} License
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <div className="mb-2">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Downloads: {item.downloadCount}/{item.maxDownloads}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFavorite(item.id)}
                            className={favorites.includes(item.id) ? 'text-red-500' : ''}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(item)}
                            disabled={item.status === 'expired' || item.downloadCount >= item.maxDownloads}
                            className="bg-green-900 hover:bg-green-800 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Digital Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Access all your purchased digital products
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="Template">Templates</option>
              <option value="Design Assets">Design Assets</option>
              <option value="Stock Photos">Stock Photos</option>
              <option value="E-book">E-books</option>
              <option value="Code Template">Code Templates</option>
              <option value="Fonts">Fonts</option>
            </select>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-green-900 hover:bg-green-800 text-white rounded-r-none' : 'rounded-r-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-green-900 hover:bg-green-800 text-white rounded-l-none' : 'rounded-l-none hover:bg-gray-200 dark:hover:bg-zinc-600'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-105 border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {item.status === 'expired' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive">Expired</Badge>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.seller}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {item.downloadCount}/{item.maxDownloads}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {item.fileFormat}
                    </Badge>
                    <span className="text-xs">{item.fileSize}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full bg-green-900 hover:bg-green-800 text-white"
                  disabled={item.status === 'expired' || item.downloadCount >= item.maxDownloads}
                  onClick={() => handleDownload(item)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {item.status === 'expired' ? 'Expired' : 
                   item.downloadCount >= item.maxDownloads ? 'Max Downloads' : 'Download'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
