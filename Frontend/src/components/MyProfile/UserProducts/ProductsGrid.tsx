/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, Fragment } from "react";
import { useDeleteProductMutation, useGetAllProductsByUserQuery } from "@/redux/features/ebook/ebookApi";
import ProductCard from "./ProductCard";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import EditProductForm from "./EditFormProduct";
import { useToast } from "@/hooks/use-toast";

const ProductsGrid = () => {
      const { toast } = useToast();
    
    const { data, isLoading,  refetch } = useGetAllProductsByUserQuery({} , 
        {
            refetchOnMountOrArgChange: true,
        }
    );

    const [deleteProduct, { isSuccess:deleteSuccess,  isLoading: isDeleting , error }] = useDeleteProductMutation();
    const [userProducts, setUserProducts] = useState<any[]>([]);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (data?.products) {
            setUserProducts(data.products);
        }

        if (deleteSuccess) {
            toast({
                title: "Success",
                description: "Product deleted successfully!",
            });

            refetch();

        }

        if (isDeleting) {
            toast({
                title: "Deleting...",
                description: "Please wait while we delete the product.",
            });
        }
 
        if (error) {
            if ("data" in error) {
                const errorData = error as any;
                toast({
                    title: "Error",
                    description: errorData.data.error,
                    variant: "destructive",
                });
            }
        }

    }, [data, deleteSuccess, isDeleting, error, refetch]); 

    const handleEdit = ( productId:string ) => {
        setIsEditModalOpen(true);
    };

    const handleDelete = async (productId: string) => {
       await deleteProduct(productId)
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40 text-lg font-semibold">
                Loading products...
            </div>
        );
    }

    if ( !data || !data.products || data.products.length === 0) {
        return (
            <div className="text-center text-gray-500 mt-10 text-base">
                No products found or an error occurred.
            </div>
        );
    }


    console.log("User Products:", userProducts);
    console.log("Editing Product:", editingProduct);
    return (
        <>
            <Card>
                <section className="px-8 py-6">
                    <h2 className="text-2xl font-bold text-center mb-6 text-green-500">
                        Your Products & Services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {userProducts.map((product: any) => (
                            <ProductCard
                                key={product._id}
                                _id={product._id}
                                title={product.title || product.name}
                                description={product.description}
                                amount={product.amount || product.price}
                                currency={product.currency || "USD"}
                                coverImage={product.coverImage || product.image}
                                type={product.type || "Product"}
                                onEdit={handleEdit}
                                setEditingProduct={setEditingProduct}
                                product={product}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </section>
            </Card>

            <Transition show={isEditModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeEditModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-90"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-90"
                        >
                            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-800 p-6 shadow-xl">
                                <EditProductForm product={editingProduct} onClose={closeEditModal} refetch={refetch} />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default ProductsGrid;
