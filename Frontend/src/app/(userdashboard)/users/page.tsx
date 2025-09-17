/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState } from "react"
import Protected from "@/hooks/useProtected"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function Users() {
    const [users, setUsers] = useState([])

    useEffect(() => {
        fetch("https://appbackend.0xmintyn.com/api/v1/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setUsers(data.users)
                }
            })
            .catch((err) => console.error("Error fetching users:", err))
    }, [])



    return (
        <Protected>
            <div className="flex flex-col w-full p-6 overflow-x-auto">
                <h2 className="text-2xl font-semibold mb-4 dark:text-white">Users</h2>
                <Table className="min-w-[1000px] text-left">
                    <TableHeader>
                        <TableRow className="bg-green-900 text-white">
                            <TableHead>Avatar</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Nationality</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user :any) => (
                            <TableRow key={user._id}>
                                <TableCell>
                                    <img
                                        src={user.avatar}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                </TableCell>
                                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.age}</TableCell>
                                <TableCell className="uppercase">{user.nationality}</TableCell>
                                <TableCell>{user.contactNumber}</TableCell>
                                <TableCell className="capitalize">{user.role}</TableCell>
                                <TableCell className={user.isVerified ? "text-green-500" : "text-red-500"}>
                                    {user.isVerified ? "Yes" : "No"}
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Protected>
    )
}

export default Users
