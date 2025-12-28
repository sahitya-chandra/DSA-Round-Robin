import { createAuthClient } from "better-auth/react"
import { API_BASE_URL } from "./api"

export const authClient: any = createAuthClient({
	baseURL: API_BASE_URL,
})