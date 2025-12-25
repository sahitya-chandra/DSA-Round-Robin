"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Star, MessageSquare, User, Mail, Sparkles } from "lucide-react";

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 0,
    message: "",
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: "", email: "", rating: 0, message: "" });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-primary pixel-border-outset flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-4 font-minecraft">
            Thank You!
          </h2>
          <p className="text-muted-foreground text-lg">
            Your feedback has been submitted successfully.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-block p-4 bg-primary/10 pixel-border-outset mb-4">
            <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-minecraft">
            Share Your Feedback
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 mb-6">
            Help us improve DSA Round Robin! Your thoughts and suggestions matter to us.
          </p>
          
          {/* Anonymous Feedback Button */}
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 px-4">
              Want to share feedback anonymously?
            </p>
            <motion.a
              href="https://anon-board-ebon.vercel.app/feedback/cmjlr1q4w0011d61t4y5grewc"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground pixel-border-outset hover:brightness-110 transition-all active:pixel-border-inset text-sm sm:text-base font-minecraft"
            >
              <span>🕵️</span>
              Give Anonymous Feedback
              <span className="text-lg">→</span>
            </motion.a>
          </div>
          
          <div className="text-xs sm:text-sm text-muted-foreground mb-2">
            Or fill out the form below with your details
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-4 p-4 bg-destructive/10 border-2 border-destructive pixel-border-outset"
          >
            <p className="text-destructive text-sm sm:text-base font-minecraft text-center">
              ⚠️ {error}
            </p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-card border-2 border-border pixel-border-outset p-4 sm:p-6 md:p-8 minecraft-texture"
        >
          {/* Name Field */}
          <div className="mb-4 sm:mb-6">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground mb-2 font-minecraft">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Your Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-input text-foreground pixel-border-inset outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground text-sm sm:text-base font-minecraft"
            />
          </div>

          {/* Email Field */}
          <div className="mb-4 sm:mb-6">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground mb-2 font-minecraft">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-input text-foreground pixel-border-inset outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground text-sm sm:text-base font-minecraft"
            />
          </div>

          {/* Rating */}
          <div className="mb-4 sm:mb-6">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground mb-3 font-minecraft">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Rate Your Experience
            </label>
            <div className="flex gap-1 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-2 sm:p-3 pixel-border-outset bg-secondary hover:bg-accent transition-all active:pixel-border-inset"
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      star <= (hoveredStar || formData.rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground mb-2 font-minecraft">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Your Feedback
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Tell us what you think..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-input text-foreground pixel-border-inset outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground resize-none text-sm sm:text-base font-minecraft"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.rating}
            className={`w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-bold pixel-border-outset transition-all ${
              isSubmitting || !formData.rating
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:brightness-110 active:pixel-border-inset"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
