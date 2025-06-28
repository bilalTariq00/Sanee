"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Star } from "lucide-react"; // import the Star icon

function Review() {
  const { id } = useParams(); // contract ID
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetchContract(token);
  }, []);

  const fetchContract = async (token) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Response Data", res.data);
      setContract(res.data);
    } catch (err) {
      console.error("Failed to load contract", err);
    } finally {
      setLoading(false);
    }
  };

  const getReviewType = () => {
    if (!contract || !user?.id) return null;
    return user.id.toString() === contract.seller_id.toString() ? "seller_to_buyer" : "buyer_to_seller";
  };

  const handleSubmit = async () => {
    const reviewType = getReviewType();
    if (!reviewType) {
      toast.error("Unable to determine review direction");
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      contract_id: id,
      rating: rating,
      comment,
      type: reviewType,
      buyer_id: contract.buyer_id,
      seller_id: contract.seller_id
    };

    console.log("Final payload:", payload);

    try {
      await axios.post(`${config.API_BASE_URL}/reviews`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Review submitted successfully!");
      navigate("/");
    } catch (err) {
      console.error("Review submission failed", err);
      toast.error("Failed to submit review");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!contract) return <p className="text-red-600">Contract not found</p>;

  const reviewing = getReviewType() === "buyer_to_seller" ? "seller" : "buyer";

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card className="bg-white border-red-600 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-red-700">Review the {reviewing}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gig: <strong>{contract.gig?.title}</strong> (UID: {contract.gig?.gig_uid})
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rating" className="text-red-600">Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={`cursor-pointer ${star <= (hoverRating || rating) ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-gray-400'}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="text-red-600">Comment</Label>
            <Textarea
              id="comment"
              placeholder={`Write your feedback for the ${reviewing}...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-red-600"
            />
          </div>

          <Button
            className="w-full bg-red-600 text-white hover:bg-red-700"
            onClick={handleSubmit}
          >
            Submit Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default Review;
