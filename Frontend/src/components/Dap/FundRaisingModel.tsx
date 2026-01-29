import Image from "next/image";
import { Button } from "../ui/button"
import { FaHandshakeSimple } from "react-icons/fa6";
import { IconType } from "react-icons";


function FundRaisingModel() {

    const modelDetails: {image: string | IconType, title: string, shortDesc: string}[] = [
        {
            image: '/assets/images/dap/icons/library-48.ico',
            title: "Community Projects",
            shortDesc: "Supporting community-driven initiatives and development"
        },
        {
            image: '/assets/images/dap/icons/money-bag.svg',
            title: "Impact Investing",
            shortDesc: "Funding projects with positive social and environmental impact"
        },
        {
            image: '/assets/images/dap/icons/globe-showing-europe-africa.svg',
            title: "UBI-Driven Projects",
            shortDesc: "Supporting Universal Basic Income Initiatives"
        },
        {
            image: FaHandshakeSimple,
            title: "Collaboration",
            shortDesc: "Fostering partnerships and community engagement"
        },
    ]
    return(
        // DAP Fundraising Model
        <div className="space-y-2 dark:bg-zinc-800 p-5 rounded-xl mt-6">
            <h2 className="text-heading font-semibold">DAP Fundraising Model</h2>
            <p className="text-xs">
                Equalmint&apos;s DAP fundraising model empowers communities through 
                community-driven initiatives and impact investing supporting UBI-driven projects that
                address critical societal challenges. By participating, individuals
                join a transformative movement, fostering collaboration, transparency,
                and sustainable social and financial outcomes, ultimately creating a 
                brighter, more equitable future. 
            </p>
            <div className="grid grid-cols-4 gap-4 justify-between my-8">
                {modelDetails.map((model, idx) => (
                    <div key={idx} className="py-6 bg-gray-200 dark:bg-black rounded-lg text-center flex flex-col items-center">
                        <div className="relative w-8 h-8">
                            {typeof model.image === 'string' ? (
                                <Image 
                                    src={model.image}
                                    alt={`Image ${idx + 1}`}
                                    fill
                                />
                            ) : (
                                <model.image size={32} className="text-yellow-400"/>
                            )}
                            
                        </div>
                        <h3 className="font-semibold mt-4">{model.title}</h3>
                        <p className="text-xs">{model.shortDesc}</p>
                    </div>
                ))}
                
            </div>
            <div className="flex justify-center">
                <Button 
                    className="p-4 my-4 text-xs bg-green-900 font-semibold text-white hover:bg-green-800 rounded-2xl"
                    aria-label="learn-more"
                >
                    Learn More About DAP
                </Button>
            </div> 
        </div>
    )
}

export default FundRaisingModel