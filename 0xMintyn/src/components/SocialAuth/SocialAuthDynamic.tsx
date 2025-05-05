'use client'
import dynamic from 'next/dynamic'

const SocialAuthProvider = dynamic(() => import('./SocialAuth'), { ssr: false });



const SocialAuthDynamic = () => {
    return (
        <SocialAuthProvider>
            <div />
        </SocialAuthProvider>
    )
}

export default SocialAuthDynamic