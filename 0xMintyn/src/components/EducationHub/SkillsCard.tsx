import Image from "next/image"
import { Button } from "../ui/button";

interface SkillsCardType {
    imagePath: string;
    imageAltText: string;
    title: string;
    description: string;
    buttonName: string;
}

function SkillsCard({imagePath, imageAltText, title, description, buttonName}: SkillsCardType) {
    return(
        <div className="dark:text-white rounded-lg overflow-hidden shadow-lg p-4 dark:bg-zinc-800">
            <div className="relative w-full h-40">
                <Image
                    src={imagePath}
                    alt={imageAltText}
                    fill
                    className="object-cover"
                />
            </div>

            <div className=" flex flex-col justify-evenly space-y-3 mt-3">
            
                {/* Product Info */}
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm">{description}</p>

                {/* CTA Button */}
                <div>
                <Button 
                    className="p-5 mt-5 bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl"
                    aria-label={buttonName}
                >
                    {buttonName}
                </Button>
                </div>
            </div>
        </div>
    )
}

export default SkillsCard