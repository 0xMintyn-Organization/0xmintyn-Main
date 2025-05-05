/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import Categories from "@/components/Marketplace/Categories";
import CategoryCard from "@/components/Marketplace/CategoryCard";
import { MarketplacePagination } from "@/components/Marketplace/MarketplacePagination";
import SortDropdown from "@/components/Marketplace/SortDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Protected from "@/hooks/useProtected";
import { useGetAllProductsByPaginationQuery } from "@/redux/features/ebook/ebookApi";
import { useCreateOrderMutation } from "@/redux/features/order/orderApi";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function Marketplace() {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState("newest");


  const { data, isLoading, isSuccess , refetch } = useGetAllProductsByPaginationQuery({
    page: currentPage,
    search: searchQuery,
    category: selectedCategory,
    sort: selectedSort,
    sortBy: selectedSort,

  },
    {
      refetchOnMountOrArgChange: true
    }

  );
  const [createrOrder, { isSuccess: OrderSuccess, error, isLoading: OrderLoading }] = useCreateOrderMutation()
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  console.log("purchased", user?.purchasedProducts)
  console.log("products", products)

  const isPurchased = (productId: string) => {
    if (!user?.purchasedProducts) return false;

    return user.purchasedProducts.some((purchase: any) => purchase.productId === productId);
  };


  useEffect(() => {
    if (isSuccess) {
      setProducts(data.products);
      setTotalPages(data.totalPages);
    }

    if (OrderSuccess) {
      toast({
        title: 'Success',
        description: 'Order created successfully!',
        variant: 'default',
      })
      refetch();

    }


    if (error) {
      if ('data' in error) {
        const errorData = error as any;
        toast({
          title: "Error",
          description: errorData?.data?.error || "An error occurred",
          variant: "destructive",
        });
      }
    }
  }, [data, isSuccess, OrderSuccess, error, toast, OrderLoading , refetch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (sortBy: string) => {
    setSelectedSort(sortBy);
    setCurrentPage(1);
  };


  const handleBuyNowClick = async (productId: string) => {
    await createrOrder({ productId })
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    );
  }

  return (
    <Protected>
      <div className="flex mx-auto py-6 px-4">
        <div className="fixed hidden lg:block w-[10%] h-screen">
          <Categories onSelectCategory={(category) => {
            setSelectedCategory(category);
            setCurrentPage(1);
          }} />
        </div>

        <div className="w-full lg:ml-[14%] p-5 dark:bg-zinc-800 rounded-xl">
          <div className="space-y-4 mb-4">
            <h2 className="text-heading font-semibold">Oxmintyn Marketplace</h2>
            <Button className="text-white bg-green-900 hover:bg-green-800 font-semibold w-full">
              Create New Listing
            </Button>
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search for Products and Services"
                className="border-gray-500"
              />
              <Button className="text-white bg-green-900 hover:bg-green-800 font-semibold">
                Search
              </Button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <SortDropdown onSortChange={handleSortChange} />
              <div>

                {data && data.productsCount > 0 ? (
                  <p className="text-sm text-gray-500">
                    {data.productsCount} results found
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    No results found
                  </p>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 overflow-y-auto">
            {products.map((product: any) => (
              <CategoryCard
                key={product._id}
                imagePath={product.coverImage}
                type={product.type}
                currency={product.currency}
                imageAltText={product.title}
                profileImage={product.createdBy?.avatar}
                profileName={`${product.createdBy?.firstName} ${product.createdBy?.lastName}`}
                title={product.title}
                price={product.amount}
                description={product.description}
                onBuyNowClick={() => handleBuyNowClick(product._id)}
                isPurchased={isPurchased(product._id)}


              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12">
            <MarketplacePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </Protected>
  );
}

export default Marketplace;
