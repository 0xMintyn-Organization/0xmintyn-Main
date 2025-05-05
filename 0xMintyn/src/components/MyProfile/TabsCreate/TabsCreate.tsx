/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Menu, Tab, Transition } from "@headlessui/react";
import { PlusCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useToast } from "@/hooks/use-toast";
import { useCreateProductMutation } from "@/redux/features/ebook/ebookApi";

const TabsCreate = () => {
    const [isOpen, setIsOpen] = useState(false);

    const closeModal = () => setIsOpen(false);
    const openModal = () => setIsOpen(true);

    return (
        <div>
            <Menu as="div" className="relative inline-block text-left">
                <Menu.Button as={Fragment}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openModal}
                        className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-x-2 rounded hover:bg-blue-600"
                    >
                        <PlusCircleIcon className="w-6 h-6" />
                        Create
                    </motion.button>
                </Menu.Button>
            </Menu>

            <Transition show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
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
                            

                                <Tab.Group>
                                    <Tab.List className="flex space-x-2 mb-4">
                                        {["Add"].map((tab) => (
                                            <Tab
                                                key={tab}
                                                className={({ selected }) =>
                                                    clsx(
                                                        "w-full py-2 text-sm font-medium rounded-lg transition",
                                                        selected
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-700 text-blue-500 hover:bg-blue-100 dark:hover:bg-zinc-600"
                                                    )
                                                }
                                            >
                                                {tab}
                                            </Tab>
                                        ))}
                                    </Tab.List>

                                    <Tab.Panels>
                                        <Tab.Panel>
                                            <EbookForm />
                                        </Tab.Panel>
                                       
                                    </Tab.Panels>
                                </Tab.Group>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};


const EbookForm = () => {
    const [createProduct, { isLoading, isSuccess, error }] = useCreateProductMutation();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        currency: "",
        coverImage: null,
        type: "Product", 
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files && files[0]) {
            setFormData({
                ...formData,
                // @ts-expect-error // TS error: Type 'File' is not assignable to type 'string | null'
                coverImage: files[0], // Handle the file input
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Create a FormData object for submission
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("description", formData.description);
        submitData.append("amount", formData.amount);
        submitData.append("currency", formData.currency);
        submitData.append("type", formData.type);

        // If there's an image file, append it to FormData
        if (formData.coverImage) {
            submitData.append("coverImage", formData.coverImage);
        }

        // Send the form data using the mutation
        await createProduct(submitData);
    };

    useEffect(() => {
        if (isSuccess) {
            toast({
                title: "Success",
                description: "Created  successfully!",
                variant: "default",
            });
            setFormData({
                title: "",
                description: "",
                amount: "",
                currency: "USD",
                coverImage: null,
                type: "Product",
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
    }, [isSuccess, error]);

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md my-16">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                Create your Service or Products
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Title Input */}
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                    <span className="text-red-500">*</span>
                </label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    required
                >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                </select>   
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder=" Title"
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    required
                />

                {/* Description Input */}
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder=" Description"
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    rows={4}
                    required
                />

                {/* Amount (Price) Input */}
                <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Amount"
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    step="0.01"
                    required
                />

                {/* Currency Select */}
                <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    required
                >
                    <option value="" disabled>
                        Select Currency
                    </option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="AUD">AUD</option>
                </select>

                {/* Type Select */}
            

                {/* Cover Image Upload */}
                <input
                    type="file"
                    accept="image/*"
                    name="coverImage"
                    onChange={handleFileChange}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                    required
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
                    disabled={isLoading}
                >
                    {isLoading ? "Submitting..." : "Submit "}
                </button>
            </form>
        </div>
    );
};




export default TabsCreate;
