export interface Review {
    id: string;
    platform: "Google" | "Yelp" | "OpenTable";
    author: string;
    rating: number;
    text: string;
    date: string;
    sentiment: "positive" | "negative" | "neutral";
}

const MOCK_REVIEWS: Review[] = [
    {
        id: "r1",
        platform: "Google",
        author: "Sarah Jenkins",
        rating: 5,
        text: "Absolutely fantastic experience! The Truffle Burger was cooked to perfection and the AI-driven recommendations from the waitstaff were spot on. Can't wait to come back.",
        date: "2 hours ago",
        sentiment: "positive"
    },
    {
        id: "r2",
        platform: "Yelp",
        author: "David L.",
        rating: 2,
        text: "Food was okay but the wait time was ridiculous. We had a reservation and still waited 35 minutes for a table. The hostess seemed very overwhelmed.",
        date: "Yesterday",
        sentiment: "negative"
    },
    {
        id: "r3",
        platform: "OpenTable",
        author: "VIP Diner (Michael C.)",
        rating: 5,
        text: "Always a pleasure dining here. They remembered my table preference and peanut allergy without me even having to ask. Flawless service as usual.",
        date: "2 days ago",
        sentiment: "positive"
    },
    {
        id: "r4",
        platform: "Google",
        author: "Elena R.",
        rating: 4,
        text: "Great atmosphere and solid cocktails. The Spicy Marg is a must-try. Dropped one star because the music was a little too loud for a dinner conversation.",
        date: "3 days ago",
        sentiment: "neutral"
    }
];

export function getRecentReviews(): Review[] {
    return MOCK_REVIEWS;
}

export function getReviewStats() {
    return {
        averageRating: 4.0,
        totalReviews: 1248,
        sentimentBreakdown: {
            positive: "82%",
            neutral: "11%",
            negative: "7%"
        }
    };
}
