"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, DollarSign, MessageCircle, User } from "lucide-react"
import { HireModal } from "@/components/HireModal"
import { ImageCarousel } from "@/components/ImageCarousel"
import config from "@/config"

interface Gig {
  gig_uid: string
  id: string
  title: string
  description: string
  price: number
  delivery_time: number
  category?: {
    name: string
  }
  user?: {
    uid: string
  }
  seller?: {
    first_name: string
    last_name: string
  }
  images?: Array<{
    image_path: string
  }>
}

export default function GigDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHire, setShowHire] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await fetch(`${config.API_BASE_URL}/gigs/${slug}`)
        if (!res.ok) throw new Error("Gig not found")
        const data = await res.json()
        setGig(data)
        console.log(data)
      } catch (err) {
        console.error("Gig not found", err)
      } finally {
        setLoading(false)
      }
    }
    fetchGig()
  }, [slug])

  const handleHireClick = () => setShowHire(true)

  const handleHireConfirm = (data: { gigId: string; message: string }) => {
    setShowHire(false)
    navigate(`/checkout/${gig?.gig_uid}`, { state: data })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gig...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!gig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Gig not found.</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <Link to="/" className="top-0">
              <ArrowLeft/>
            </Link>
    <div className="container mx-auto px-4 py-8">
       
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Image Carousel */}
        <div className="lg:col-span-2">
          <ImageCarousel images={gig.images || []} />
        </div>

        {/* Gig Info */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{gig.title}</h1>

              <div className="space-y-3 mb-6">
                {gig.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                      {gig.category.name}
                    </Badge>
                    <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                    {gig.subcategory?.name}
                    </Badge>
                    
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    <strong>Delivery:</strong> {gig.delivery_time} days
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                 <img src='/riyal.svg' className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold text-red-600">{gig.price}</span>
                </div>
              </div>

              <Separator className="my-4" />
<Button
  size="sm"
  variant="ghost"
  onClick={() => navigate(`/profile/${gig.user?.uid}`)}
  className="p-0 text-sm text-red-600 hover:underline"
>
  View Profile
</Button>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <div className="text-gray-600 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {gig.description}
                </div>
              </div>

            <div className="space-y-3">
  {gig.is_available_for_hire && (
    <Button
      onClick={handleHireClick}
      className="w-full bg-red-600 hover:bg-red-700 text-white"
      size="lg"
    >
      <User className="h-4 w-4 mr-2" />
      Hire Now
    </Button>
  )}

  <Button
    onClick={() => navigate(`/messages/${gig.user?.uid}`)}
    variant="outline"
    className="w-full border-red-600 text-red-600 hover:bg-red-50"
    size="lg"
  >
    <MessageCircle className="h-4 w-4 mr-2" />
    Chat with Seller
  </Button>
</div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hire Modal */}
      {showHire && <HireModal gig={gig} onClose={() => setShowHire(false)} onConfirm={handleHireConfirm} />}
    </div>
    </>
  )
}
