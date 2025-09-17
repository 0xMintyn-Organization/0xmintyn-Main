import Image from "next/image";

interface PurchasedProductCardProps {
    imagePath: string;
    imageAltText: string;
    profileImage: string;
    profileName: string;
    title: string;
    price: number;
    currency: string;
    type: string;
    description: string;
}

function PurchasedProductCard({
    imagePath,
    imageAltText,
    type,
    currency,
    profileImage,
    profileName,
    title,
    price,
    description,
}: PurchasedProductCardProps) {
    return (
        <div className="dark:text-white rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
            {/* Product Cover Image */}
            <div className="relative w-full h-40">
                <Image
                    src={imagePath}
                    alt={imageAltText}
                    fill
                    className="object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-green-900 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {type}
                </div>
            </div>

            {/* Product Details */}
            <div className="p-4 flex flex-col space-y-3">
                {/* Creator Info */}
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <Image
                            src={profileImage}
                            alt={profileName}
                            fill
                            className="rounded-full object-cover"
                        />
                    </div>
                    <h4 className="font-medium">{profileName}</h4>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg">
                    {title ? (title.length > 30 ? `${title.slice(0, 30)}...` : title) : "No Title"}
                </h3>

                {/* Price */}
                <div className="text-green-700 dark:text-green-400 font-bold">
                    {price} {currency}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description ? (description.length > 70 ? `${description.slice(0, 70)}...` : description) : "No Description"}
                </p>

                {/* Purchased Label */}
                <div className="mt-4 px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full w-max">
                    Purchased
                </div>
            </div>
        </div>
    );
}

export default PurchasedProductCard;
