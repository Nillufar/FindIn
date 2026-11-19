import Stripe from 'stripe';
import {env} from '../config/env.js';

let client: Stripe | undefined;

// Lazily create the Stripe client so the API can boot without payment keys.
export function getStripe(): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set. Add it to the repository root .env file.');
    }
    client ??= new Stripe(env.STRIPE_SECRET_KEY);
    return client;
}
