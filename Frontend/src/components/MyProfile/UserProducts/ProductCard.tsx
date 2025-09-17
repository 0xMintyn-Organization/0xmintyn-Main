/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  _id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  coverImage: string;
  product: any;
  type: string;
  onEdit: any;
  setEditingProduct: (product: any) => void;
  onDelete: (id: string) => void;
}

export default function ProductCard({
  _id,
  title,
  description,
  amount,
  currency,
  coverImage,
    product,
    setEditingProduct,
  type,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const handleEdit = () => {
    onEdit(_id);
    setEditingProduct(product);
  };

  const handleDelete = () => {
    onDelete(_id);
  };

  return (
    <div className="rounded-2xl shadow-md overflow-hidden border border-slate-100 dark:border-zinc-900 dark:bg-zinc-900 bg-slate-100 flex flex-col">
      <div className="relative w-full h-48">
        <Image src={coverImage} alt={title} fill className="object-cover" />
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {type}
          </span>
          <h2 className="font-bold text-lg dark:text-white">
            {title.length > 30 ? `${title.slice(0, 30)}...` : title}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {description.length > 100
              ? `${description.slice(0, 100)}...`
              : description}
          </p>
        </div>

        <div className="flex justify-between items-center mt-3">
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            {amount} {currency}
          </h3>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="hover:bg-yellow-100 dark:hover:bg-yellow-900"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hover:bg-red-100 dark:hover:bg-red-900"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
