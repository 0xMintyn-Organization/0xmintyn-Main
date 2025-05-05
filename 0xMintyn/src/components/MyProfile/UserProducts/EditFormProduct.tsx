/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProductMutation } from "@/redux/features/ebook/ebookApi";

interface EditProductFormProps {
    product: any;
    refetch: () => void;
    onClose: () => void;
}

const EditProductForm = ({ product, onClose, refetch }: EditProductFormProps) => {
    const { toast } = useToast();

    const [updateProduct, { isLoading, isSuccess, error }] = useUpdateProductMutation();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        currency: "USD",
        type: "Product",
        coverImage: null as File | null,
    });

    const [previewImage, setPreviewImage] = useState<string>("");

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || "",
                description: product.description || "",
                amount: product.amount || "",
                currency: product.currency || "USD",
                type: product.type || "Product",
                coverImage: null,
            });

            setPreviewImage(product.coverImage || product.image || "");
        }
    }, [product]);

    useEffect(() => {
        if (isSuccess) {
            toast({
                title: "Success",
                description: "Product updated successfully!",
            });
            onClose();
            refetch();
        }

        if (error && "data" in error) {
            toast({
                title: "Error",
                description: (error as any).data.error || "Failed to update product",
                variant: "destructive",
            });
        }
    }, [isSuccess, error ,  refetch]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, coverImage: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const form = new FormData();
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("amount", formData.amount);
        form.append("currency", formData.currency);
        form.append("type", formData.type);

        if (formData.coverImage) {
            form.append("coverImage", formData.coverImage);
        }

        await updateProduct({ id: product._id, formData: form });
    };

    if (!product) {
        return <div className="text-center py-10 text-gray-500">Loading product...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-4">
                Edit Product / Service
            </h2>

            {/* Image Preview */}
            {previewImage && (
                <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                />
            )}

            {/* Title */}
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Title"
                className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                required
            />

            {/* Description */}
            <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows={4}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                required
            />

            {/* Amount */}
            <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Amount"
                step="0.01"
                className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                required
            />

            {/* Currency */}
            <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
                required
            >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
                <option value="AUD">AUD</option>
            </select>

            {/* Type */}
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

            {/* Cover Image */}
            <input
                type="file"
                accept="image/*"
                name="coverImage"
                onChange={handleFileChange}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-800 dark:text-white"
            />

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
                {isLoading ? "Updating..." : "Update Product"}
            </button>
        </form>
    );
};

export default EditProductForm;
