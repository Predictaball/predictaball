import "next-auth"
import "@auth/core/jwt"

declare module "next-auth" {
    interface Session {
        backendToken?: string
        isAdmin?: boolean
    }

    interface User {
        backendToken?: string
        refreshToken?: string
        isAdmin?: boolean
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        backendToken?: string
        refreshToken?: string
        isAdmin?: boolean
        userId?: string
    }
}
