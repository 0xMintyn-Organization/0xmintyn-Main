import { Response } from "express"
import UserModel from "../models/user.mode"



// get user by id 
export const getUserById = async (id: string, res: Response) => {
    const userJson = await UserModel.findById(id)
    const user = userJson ? JSON.parse(JSON.stringify(userJson)) : null

    if (userJson && user) {
        res.status(201).json({
            success: true,
            user
        })
    } else {
        res.status(404).json({
            success: false,
            message: 'User not found'
        })
    }
}

// Get All Users
export const getAllUsersService = async (res: Response) => {
    const users = await UserModel.find().sort({ createdAt: -1 })
    res.status(201).json({
        success: true,
        users
    })
}


// Update User Role 

export const updateUserRoleService = async (res: Response, email: string, role: string) => {
    const user = await UserModel.findOneAndUpdate({ email }, { role }, { new: true })

    res.status(201).json({
        success: true,
        user
    })  
}