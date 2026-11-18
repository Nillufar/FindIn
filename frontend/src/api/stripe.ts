import {loadStripe} from '@stripe/stripe-js';

// Loaded once and shared by every payment component (Apple Pay button, card form).
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
