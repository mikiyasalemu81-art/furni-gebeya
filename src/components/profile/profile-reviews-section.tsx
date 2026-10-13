"use client";

import * as React from "react";
import { Star, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Review } from "@/lib/marketplace-types";

interface ProfileReviewsSectionProps {
  targetUserId: string;
  targetUserName: string;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}

export function ProfileReviewsSection({
  targetUserId,
  targetUserName,
  isLoggedIn,
  onRequireLogin,
}: ProfileReviewsSectionProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [averageRating, setAverageRating] = React.useState(5.0);
  const [totalReviews, setTotalReviews] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Review form states
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ error?: string; success?: string } | null>(null);

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?targetUserId=${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 5.0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (e) {
      console.error("[Fetch reviews error]", e);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setFeedback({ success: "Your review has been published!" });
      setComment("");
      fetchReviews();
    } catch (err: any) {
      setFeedback({ error: err.message || "Failed to submit review" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            Reviews & Ratings
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              {totalReviews}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Feedback from buyers who contacted or traded with {targetUserName}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/60 px-4 py-2 rounded-xl">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="text-xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/ 5.0</span>
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handlePostReview} className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Write a Review</h4>
        <p className="text-xs text-muted-foreground">
          Note: Only users who previously viewed contact details or chatted with this seller can post a review.
        </p>

        {feedback?.error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}

        {feedback?.success && (
          <div className="p-2.5 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}

        {/* Star selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience (furniture quality, communication, delivery reliability)..."
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          required
        />

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Posting..." : "Post Review"}
          </Button>
        </div>
      </form>

      {/* Reviews list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm">No reviews yet for this seller.</p>
            <p className="text-xs">Be the first to leave feedback after inquiry!</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="border-b border-border/40 pb-4 last:border-none space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center">
                    {rev.reviewer_name?.slice(0, 1) || "U"}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{rev.reviewer_name}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{rev.comment}</p>
              <div className="text-[10px] text-muted-foreground/60">
                {new Date(rev.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
