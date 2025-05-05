import EducationCard from "@/components/EducationHub/EducationCard"
import LearningProgress from "@/components/EducationHub/LearningProgress"
import Protected from "@/hooks/useProtected";
import { eduCardDetails, skillDetail } from "@/lib/utils";



function EducationHub() {

    return(
        <Protected>

        <div className="flex flex-col mx-auto space-y-4">
                {/* Title and Paragraph */}
                <div className="space-y-2 dark:bg-zinc-800 p-5 rounded-xl mt-6 mx-4">
                    <h2 className="text-heading font-semibold">Education and Skill Development Hub</h2>
                    <p>
                        Empower yourself with knowledge and skills. Oxmintyn&apos;s Education Hub
                        provides a wide range of learning opportunities to help you grow
                        personally and professionally.
                    </p>    
                </div>
                
                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mx-4">
                    {eduCardDetails.map((card, idx) => (
                        <EducationCard
                            key={idx} 
                            imagePath={card.imagePath} 
                            imageAltText={card.imageAltText}
                            title={card.title}
                            description={card.description}
                            buttonName={card.buttonName}
                        />
                    ))}
                </div>

                {/* Learning Progress */}
                <div className="space-y-2 dark:bg-zinc-800 rounded-xl mt-8 mx-4">
                    <LearningProgress />    
                </div>
                
                {/* Skills */}
                <div className="p-5">
                    <h2 className="text-heading font-semibold">Skills You&apos;re Developing</h2>
                     {/* Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-3 ">
                        {skillDetail.map((skill, idx) => (
                            <div key={idx} className="dark:bg-zinc-800 p-5 rounded-lg flex flex-col items-center justify-center space-y-3 shadow-lg text-center">
                                <skill.icon size={32} className={`${skill.name === 'Leadership' ? 'text-yellow-400' : ''}`} />
                                <h3>{skill.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
        </div>
            </Protected>

    )
}

export default EducationHub