'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

export function ProductReviews({ product }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  
  // Mock reviews for demo
  const reviews = product.reviews || [
    {
      id: 1,
      author: 'Ahmed K.',
      rating: 5,
      date: '2024-01-15',
      content: 'Excellent product! Exactly as described. Fast shipping too.',
      helpful: 12,
    },
    {
      id: 2,
      author: 'Sara M.',
      rating: 4,
      date: '2024-01-10',
      content: 'Good quality, but took a bit longer to arrive than expected.',
      helpful: 8,
    },
  ];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    toast.success('Review submitted for moderation');
    setShowForm(false);
    setRating(0);
    setReview('');
  };
  
  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl font-bold">
            {product.rating?.toFixed(1) || '4.5'}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating || 4.5)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Based on {product.review_count || reviews.length} reviews
          </p>
        </div>
        
        <Button onClick={() => setShowForm(!showForm)}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      </div>
      
      {/* Review Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Submit Review</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold">
                      {item.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{item.author}</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 my-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < item.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-700">{item.content}</p>
                </div>
                
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({item.helpful})
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
