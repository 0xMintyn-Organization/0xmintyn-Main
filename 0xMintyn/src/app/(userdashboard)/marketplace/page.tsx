/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import Categories from "@/components/Marketplace/Categories";
import CategoryCard from "@/components/Marketplace/CategoryCard";
import { MarketplacePagination } from "@/components/Marketplace/MarketplacePagination";
import SortDropdown from "@/components/Marketplace/SortDropdown";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Protected from "@/hooks/useProtected";
import { useGetAllProductsByPaginationQuery } from "@/redux/features/ebook/ebookApi";
import { useCreatePaymentIntentMutation, useGetStripePublishableKeyQuery } from "@/redux/features/order/orderApi";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from '@stripe/react-stripe-js'
import PaymentForm from "@/components/Marketplace/PaymentForm";
import { IoMdCheckmarkCircleOutline, IoMdClose, IoMdCloseCircle } from 'react-icons/io'

function Marketplace() {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState("newest");
  const [productId , setProductId] = useState("");


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
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const { data: config } = useGetStripePublishableKeyQuery({})
  const [createPaymentIntent, { data: paymentIntent }] =
    useCreatePaymentIntentMutation();
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState("")

  console.log("purchased", user?.purchasedProducts)
  console.log("products", products)

  const isPurchased = (productId: string) => {
    if (!user?.purchasedProducts) return false;

    return user.purchasedProducts.some((purchase: any) => purchase.productId === productId);
  };


  useEffect(() => {
    if (config) {
      setStripePromise(loadStripe(config.pulishableKey));
    }
  }, [config]);

  const handlePayment = async (amount: number) => {
    try {
      const amountInCents = amount * 100; // Convert to cents if needed
      const response = await createPaymentIntent(amountInCents ).unwrap();
      setClientSecret(response.client_secret);
      toast({ title: 'Success', description: 'Payment initiated', variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: 'Payment failed', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (paymentIntent) {
      setClientSecret(paymentIntent?.client_secret)
    }
  }, [paymentIntent])


  useEffect(() => {
    if (isSuccess) {
      setProducts(data.products);
      setTotalPages(data.totalPages);
    }

   

  }, [data, isSuccess,  toast, refetch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (sortBy: string) => {
    setSelectedSort(sortBy);
    setCurrentPage(1);
  };



  if (isLoading) {
    return (
      <Spinner />
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
                onBuyNowClick={() => {
                  setProductId(product._id);
                  handlePayment(product.amount);
                }}
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
        {clientSecret && stripePromise && productId && (
          <div
            className='w-full h-screen bg-[#00000036] fixed top-0 left-0 flex items-center justify-center z-50'
          >
            <div
              className='w-[500px] bg-white dark:bg-zinc-800  rounded-xl p-3'
            >
              <div className="w-full flex justify-end">
                <IoMdClose
                  size={40}
                  className='cursor-pointer text-black'
                  onClick={() => {
                    setClientSecret("");
                    setProductId("");
                  }
                }
                />
              </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm clientSecret={clientSecret} productId={productId} setProductId={setProductId} />
          </Elements>
          </div>
          </div>
        )}
      </div>
    </Protected>
  );
}

export default Marketplace;
