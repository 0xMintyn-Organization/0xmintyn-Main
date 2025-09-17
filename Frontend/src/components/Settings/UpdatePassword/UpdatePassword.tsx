/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast";
import { useUpdatePasswordMutation } from '@/redux/features/user/userApi'
import React, { useEffect, useState } from 'react'

const UpdatePassword = () => {
      const { toast } = useToast();
    
    const [updatePassword, { isSuccess, error, isLoading }] = useUpdatePasswordMutation()

    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')


    useEffect(() => {
        if (isSuccess) {
            toast({
                title: 'Success',
                description: 'Password updated successfully!',
                variant: 'default',
            }) 
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }

        if (error){
            if ('data' in error) {
                const errorData = error as any;
                toast({
                    title: "Error",
                    description: errorData?.data?.error || "An error occurred",
                    variant: "destructive",
                });
            }
        }
    }
    , [isSuccess , error, toast])

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'New password and confirm password do not match.',
                variant: 'destructive',
            })
            return
        }

    
            await updatePassword({ oldPassword, newPassword })
            
        
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Change Password</h3>
            <div className="space-y-2">
                <Input
                    type="password"
                    placeholder="Current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                    className="w-full bg-green-700 hover:bg-green-800 text-white"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
            </div>
     
        </div>
    )
}

export default UpdatePassword
