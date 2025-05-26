import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export default function useUserAuth() {
    const { user } = useSelector((state: any) => state.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // simulate async loading or real user fetch here
        if (user) {
            setIsAuthenticated(true);
            setIsLoading(false);
        } else {
            // You might want to verify token or fetch user from server here
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    }, [user]);

    return { isLoading, isAuthenticated };
}
