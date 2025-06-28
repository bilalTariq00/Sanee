export interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  attachment?: string
  created_at: string
  is_custom_order?: boolean
  order_id?: number
  chat_order_id?: number
  gig_uid?: string
  amount?: number
  note?: string
  is_deleted?: boolean
  sender?: {
    uid: string
    first_name: string
    last_name: string
  }
  delivery_status?: "sent" | "delivered" | "read"
}

export interface ChatUser {
  id: number
  uid: string
  first_name: string
  last_name: string
  image?: string
  headline?: string
  last_message?: string
  last_message_time?: string
  is_online?: boolean
  is_typing?: boolean
}

export interface Gig {
  id: number
  title: string
  price: number
}

export interface UserProfile {
  id: number
  uid: string
  first_name: string
  last_name: string
  account_type: string
}
