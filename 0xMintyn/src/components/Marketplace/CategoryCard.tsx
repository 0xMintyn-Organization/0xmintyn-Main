import Image from "next/image";
import { Button } from "../ui/button";

interface CategoryCardType {
    imagePath: string;
    imageAltText: string;
    profileImage: string;
    profileName: string;
    title: string;
    price: number;
    currency: string;
    type: string;
    description: string;
    onBuyNowClick?: () => void;
    isPurchased?: boolean; // <-- ADD THIS

}

function CategoryCard({
    imagePath,
    imageAltText,
    type,
    currency,
    profileImage,
    onBuyNowClick,
    profileName,
    title,
    price,
    description, 
    isPurchased = false, 
   
}: CategoryCardType) {
    return (
        <div className="dark:text-white rounded-lg overflow-hidden shadow-lg">
            <div className="relative w-full h-40">
                <Image
                    src={imagePath}
                    alt={imageAltText}
                    fill
                    className="object-cover"
                />
                <div className="absolute bottom-2 z-40 left-2 bg-green-900 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {type}
                </div>
            </div>


            <div className="p-4 flex flex-col justify-evenly space-y-3">
                {/* Profile Image and Name */}
                <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6">
                        <Image
                            src={profileImage}
                            alt={profileName}
                            fill
                            className="rounded-full object-cover"
                        />
                    </div>
                    <h4>{profileName}</h4>
                </div>

                {/* Product Info */}
                <h3 className="font-semibold">{
                    title ? title.length > 20 ? `${title.slice(0, 20)}...` : title : "No Title"
                }</h3>
                <h2 className="text-heading font-semibold">{price} {currency}</h2>
                <p className="text-sm">{
                    description ? description.length > 50 ? `${description.slice(0, 50)}...` : description : "No Description"
                }</p>

                {/* Conditional Button */}
                {isPurchased ? (
                    <div className="w-full mt-5 text-center bg-green-100 text-green-700 font-semibold py-2 rounded-3xl">
                        Purchased
                    </div>
                ) : (
                    <Button
                        aria-label="buynow"
                        className="w-full mt-5 bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl"
                        onClick={onBuyNowClick}
                    >
                        Buy Now
                    </Button>
                )}
            </div>
        
        </div>
    )
}

export default CategoryCard