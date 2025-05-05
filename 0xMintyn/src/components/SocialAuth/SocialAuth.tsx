'use client'
import { useToast } from '@/hooks/use-toast'
import { useLoadUserQuery } from '@/redux/features/api/apiSlice'
import { useLogOutQuery, useSocialAuthMutation } from '@/redux/features/auth/authApi'
import { useSession } from 'next-auth/react'
import React, { FC, useEffect, useState } from 'react'

interface Props {
    children: React.ReactNode
}

const SocialAuthProvider: FC<Props> = ({ children }) => {
    const { toast } = useToast()
    const { data: sessionData } = useSession()
    const { data: userData, isLoading, refetch } = useLoadUserQuery({}, {
        refetchOnMountOrArgChange: true,
  
    })
    const [socialAuth, { isSuccess, error }] = useSocialAuthMutation()
    const [logout, setLogout] = useState(false)
    const { } = useLogOutQuery(undefined, { skip: !logout })

    useEffect(() => {
        if (isLoading) return

        // If user data is not present and sessionData exists, perform socialAuth
        if (!userData && sessionData?.user) {
            socialAuth({
                email: sessionData.user.email,
                name: sessionData.user.name,
                avatar: sessionData.user.image
            })
            refetch()
        }

        // Handle the success case for socialAuth
        if (sessionData === null && isSuccess) {
            toast({
                title: 'Success',
                description: 'Logged in successfully',
                variant: 'default',
            })
        }

        // Handle logout condition
        if (sessionData === null && !isLoading && !userData) {
            setLogout(true)
        }

        // Handle error
        if (error) {
            const errorMessage = 'data' in error ? error?.data?.error : error?.error
            toast({
                title: 'Error',
                description: errorMessage || 'An error occurred',
                variant: 'destructive',
            })
        }
    }, [sessionData, userData, isLoading, isSuccess, error, socialAuth, refetch, toast])

    return <div>{children}</div>
}

export default SocialAuthProvider
