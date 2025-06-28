export interface User {
  id: number
  uid: string
  first_name: string
  last_name: string
  image?: string
  headline?: string
  last_message?: string
  last_message_time?: string
  is_online?: boolean
  account_type?: "buyer" | "seller"
}

export interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  attachment?: string
  created_at: string
  updated_at: string
  is_custom_order?: boolean
  order_id?: number | null
  chat_order_id?: number | null
  gig_uid?: string
  amount?: number
  note?: string
  is_deleted?: boolean | number
  sender?: {
    id: number
    uid: string
    first_name: string
    last_name: string
    image?: string
  }
  receiver?: {
    id: number
    uid: string
    first_name: string
    last_name: string
    image?: string
  }
}

export interface Gig {
  id: number
  title: string
  price: number
  description?: string
  gig_uid?: string
}

export interface CustomOrder {
  id: number
  gig_id: number
  sender_uid: string
  receiver_id: string
  amount: number
  expiry_date: string
  note?: string
  gig_uid: string
  status: "pending" | "accepted" | "rejected" | "expired"
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface MessagesResponse {
  messages: Message[]
  current_page: number
  next_page?: number
  last_page: number
  total: number
}

export interface UnreadMessagesResponse {
  messages: Array<{
    id: number
    sender: {
      uid: string
      first_name: string
      last_name: string
    }
  }>
}
