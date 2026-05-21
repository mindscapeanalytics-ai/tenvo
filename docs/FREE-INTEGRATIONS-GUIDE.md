# Free & Open-Source Integrations Guide
## Zero-Cost Solutions for Production-Ready SaaS

---

## 📧 EMAIL SYSTEM

### Primary: Resend (Free Tier)
- **Free**: 100 emails/day
- **Cost**: $0.40/1,000 emails after
- **Features**: React email, analytics, webhooks

```javascript
// lib/email/resend.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTransactionalEmail({
  to,
  subject,
  react,
  from = 'Tenvo <notifications@tenvo.app>'
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });
    
    if (error) throw error;
    return { success: true, id: data.id };
  } catch (err) {
    console.error('Email send failed:', err);
    return { success: false, error: err.message };
  }
}

// Templates
export { OrderConfirmationEmail } from './templates/OrderConfirmation';
export { WelcomeEmail } from './templates/Welcome';
export { PasswordResetEmail } from './templates/PasswordReset';
export { LowStockAlertEmail } from './templates/LowStockAlert';
```

### Fallback: Nodemailer + Gmail SMTP
- **Cost**: Free
- **Limit**: 500 emails/day
- **Use**: When Resend hits limit

---

## 💬 SMS & MESSAGING

### Primary: Twilio (Free Trial)
- **Free**: $15.50 trial credit
- **Cost**: ~$0.0075/SMS (US), varies by country
- **Features**: SMS, WhatsApp, Voice

```javascript
// lib/sms/twilio.js
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS({ to, body, from = process.env.TWILIO_PHONE }) {
  try {
    const message = await client.messages.create({
      body,
      from,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('SMS failed:', err);
    return { success: false, error: err.message };
  }
}

// Pakistan: Use Twilio with local provider
// Or: BhashSMS, SMS4Connect (local providers)
```

### WhatsApp Business API
- **Cost**: Free (hosting costs only)
- **Provider**: Meta Business Platform
- **Features**: Order updates, support chat

```javascript
// lib/whatsapp/whatsapp.js
export async function sendWhatsAppMessage({
  to,
  template,
  language = 'en',
  parameters = []
}) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: language },
          components: parameters,
        },
      }),
    }
  );
  
  return response.json();
}
```

---

## 💳 PAYMENT GATEWAYS

### Global: Stripe (Standard)
- **Cost**: 2.9% + 30¢ per transaction
- **Features**: Cards, wallets, subscriptions

```javascript
// lib/payments/stripe.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent({
  amount,
  currency = 'pkr',
  metadata = {}
}) {
  return stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents/paisa
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function createCustomer({ email, name }) {
  return stripe.customers.create({ email, name });
}

export async function createSubscription({
  customerId,
  priceId,
  metadata = {}
}) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
  });
}
```

### Pakistan: PayFast (Free Integration)
- **Cost**: 2.5% per transaction
- **Methods**: Cards, wallets, bank transfer

```javascript
// lib/payments/payfast.js
export async function createPayFastCheckout({
  amount,
  orderId,
  customerEmail,
  customerName
}) {
  const data = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    amount,
    item_name: `Order #${orderId}`,
    email: customerEmail,
    name: customerName,
    return_url: `${process.env.APP_URL}/checkout/success`,
    cancel_url: `${process.env.APP_URL}/checkout/cancel`,
    notify_url: `${process.env.APP_URL}/api/webhooks/payfast`,
  };
  
  // Generate signature
  const signature = generatePayFastSignature(data);
  
  return {
    url: 'https://www.payfast.co.za/eng/process',
    data: { ...data, signature },
  };
}
```

### Alternative: JazzCash / EasyPaisa
- **Cost**: ~1.5% per transaction
- **Integration**: Direct API or HBL Payment Gateway

---

## 📦 SHIPPING & LOGISTICS

### EasyPost (Free Tier)
- **Free**: 120,000 shipments tracked/month
- **Cost**: Pay per label
- **Carriers**: 100+ carriers globally

```javascript
// lib/shipping/easypost.js
import EasyPost from '@easypost/api';

const client = new EasyPost(process.env.EASYPOST_API_KEY);

export async function createShipment({
  fromAddress,
  toAddress,
  parcel,
  customsInfo // For international
}) {
  const shipment = await client.Shipment.create({
    from_address: fromAddress,
    to_address: toAddress,
    parcel,
    customs_info: customsInfo,
  });
  
  return shipment;
}

export async function buyLabel(shipmentId, rateId) {
  const shipment = await client.Shipment.retrieve(shipmentId);
  return await shipment.buy(rateId);
}
```

### AfterShip (Free Tier)
- **Free**: 50 shipments/month
- **Cost**: $9/month for 500
- **Features**: Tracking page, notifications

```javascript
// lib/shipping/aftership.js
export async function trackShipment(trackingNumber, carrier) {
  const response = await fetch(
    `https://api.aftership.com/v4/trackings`,
    {
      method: 'POST',
      headers: {
        'aftership-api-key': process.env.AFTERSHIP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking: {
          tracking_number: trackingNumber,
          slug: carrier,
        },
      }),
    }
  );
  
  return response.json();
}
```

---

## 🤖 AI & INTELLIGENCE

### OpenAI (GPT-4o-mini)
- **Cost**: $0.15/1M input tokens, $0.60/1M output
- **Use**: Product descriptions, chatbot, recommendations

```javascript
// lib/ai/openai.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateProductDescription(product) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Generate compelling product descriptions for e-commerce.'
      },
      {
        role: 'user',
        content: `Product: ${product.name}\nCategory: ${product.category}\nFeatures: ${product.features}`
      }
    ],
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

export async function getAIRecommendations({
  customerHistory,
  currentCart,
  products
}) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product recommendation engine. Suggest 3 relevant products.'
      },
      {
        role: 'user',
        content: JSON.stringify({ customerHistory, currentCart, availableProducts: products })
      }
    ],
    response_format: { type: 'json_object' },
  });
  
  return JSON.parse(completion.choices[0].message.content);
}
```

### Anthropic Claude (Haiku)
- **Cost**: $0.25/1M input, $1.25/1M output
- **Use**: Customer support, content moderation

```javascript
// lib/ai/anthropic.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function classifySupportTicket(message) {
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Classify this support ticket into: order_issue, product_question, refund_request, technical_problem.\n\nMessage: ${message}`
    }],
  });
  
  return response.content[0].text;
}
```

---

## 📊 ANALYTICS & MONITORING

### Google Analytics 4 (Free)
```javascript
// lib/analytics/gtag.js
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export function pageView(url) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
}

export function event({ action, category, label, value }) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
```

### Plausible Analytics (Open Source)
- **Self-hosted**: Free
- **Cloud**: $9/month
- **Privacy**: GDPR compliant, no cookies

```javascript
// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          defer
          data-domain="tenvo.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Sentry (Free Tier)
- **Free**: 5,000 errors/month
- **Features**: Error tracking, performance monitoring

```javascript
// lib/sentry/config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

---

## 🔍 SEARCH

### Algolia (Free Tier)
- **Free**: 10,000 records, 10,000 searches/month
- **Features**: Instant search, faceting, AI search

```javascript
// lib/search/algolia.js
import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
);

export const productsIndex = searchClient.initIndex('products');

export async function searchProducts(query, filters = {}) {
  return await productsIndex.search(query, {
    filters: Object.entries(filters)
      .map(([key, value]) => `${key}:${value}`)
      .join(' AND '),
    hitsPerPage: 20,
  });
}
```

### Meilisearch (Open Source)
- **Self-hosted**: Free
- **Features**: Typo tolerance, faceting, geosearch

```javascript
// lib/search/meilisearch.js
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export async function indexProducts(products) {
  const index = client.index('products');
  return await index.addDocuments(products);
}
```

---

## 🖼️ IMAGE & FILE HANDLING

### Cloudinary (Free Tier)
- **Free**: 25 credits/month
- **Features**: Resize, optimize, transform

```javascript
// lib/media/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file, folder = 'products') {
  return await cloudinary.uploader.upload(file, {
    folder: `tenvo/${folder}`,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
}

export function getOptimizedUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    width: options.width || 800,
    height: options.height || 800,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
}
```

### UploadThing (Free Tier)
- **Free**: 2GB storage
- **Cost**: $5/10GB after
- **Integration**: Simple file uploads

```javascript
// app/api/uploadthing/core.js
import { createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: '4MB' } })
    .middleware(async ({ req }) => {
      // Auth check
      return { userId: req.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);
    }),
};
```

---

## 🗺️ MAPS & LOCATION

### Mapbox (Free Tier)
- **Free**: 50,000 loads/month
- **Features**: Maps, geocoding, directions

```javascript
// lib/maps/mapbox.js
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(address) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`
  );
  return response.json();
}

export function calculateDistance(from, to) {
  // Use turf.js for client-side calculations
}
```

---

## 💬 LIVE CHAT

### Tawk.to (Free)
- **Cost**: Free forever
- **Features**: Live chat, ticketing, knowledge base

```javascript
// components/LiveChat.jsx
export function LiveChat() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/DEFAULT';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return null;
}
```

### Crisp (Free Tier)
- **Free**: 2 seats, basic features
- **Cost**: €25/month for unlimited

---

## 📱 PUSH NOTIFICATIONS

### Firebase Cloud Messaging (Free)
- **Cost**: Free (unlimited)
- **Features**: Push, topics, scheduling

```javascript
// lib/notifications/fcm.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export async function sendPushNotification({
  token,
  title,
  body,
  data = {}
}) {
  return await admin.messaging().send({
    token,
    notification: { title, body },
    data,
  });
}
```

### OneSignal (Free Tier)
- **Free**: 10,000 subscribers
- **Cost**: $9/month after

---

## 📝 FORM HANDLING

### Formspree (Free Tier)
- **Free**: 50 submissions/month
- **Cost**: $10/month for 1,000

### React Hook Form + Zod (Free)
- **Cost**: Free (client-side)
- **Features**: Validation, performance

```javascript
// components/ContactForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = async (data) => {
    await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <textarea {...register('message')} />
      {errors.message && <span>{errors.message.message}</span>}
      
      <button type="submit">Send</button>
    </form>
  );
}
```

---

## 🎨 UI COMPONENTS (Free)

### shadcn/ui (Open Source)
- **Cost**: Free
- **Features**: 40+ components, Tailwind-based

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# ... etc
```

### Radix UI Primitives (Open Source)
- Foundation for shadcn/ui

### Lucide Icons (Open Source)
- 1000+ icons

### Framer Motion (Free Tier)
- **Free**: Most features
- **Cost**: $15/month for advanced

---

## 📚 DATABASE & BACKEND (Free Tiers)

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **Vercel Postgres** | 60 days trial | Serverless hosting |
| **Neon** | 3GiB storage | Serverless PostgreSQL |
| **Supabase** | 500MB, 2M requests | Firebase alternative |
| **PlanetScale** | 5GB storage | MySQL-compatible |
| **Upstash** | 10K requests/day | Redis |
| **Cloudflare R2** | 10GB/month | Object storage |

---

## 🚀 DEPLOYMENT (Free)

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Vercel** | 100GB bandwidth | Next.js hosting |
| **Netlify** | 100GB bandwidth | Static sites |
| **Railway** | $5 credit/month | Backend services |
| **Render** | 750 hours/month | Full-stack |
| **Fly.io** | $5 credit/month | Docker containers |

---

## 💡 RECOMMENDED STACK FOR TENVO

### Tier 1 (Essential - Use Immediately)
1. **Better Auth** - Authentication ✅
2. **PostgreSQL** - Database ✅
3. **Resend** - Transactional emails
4. **Stripe** - Payments (global)
5. **Sentry** - Error tracking
6. **Google Analytics** - Analytics

### Tier 2 (Important - Add Next)
1. **Twilio** - SMS
2. **WhatsApp Business** - Chat
3. **EasyPost** - Shipping
4. **OpenAI** - AI features
5. **Algolia/Meilisearch** - Search

### Tier 3 (Enhancement - Add Later)
1. **Cloudinary** - Image optimization
2. **Mapbox** - Maps
3. **Firebase** - Push notifications
4. **Tawk.to** - Live chat

---

## 📊 COST ESTIMATES

### Startup Phase (0-100 customers)
| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Neon Postgres | $0 (free tier) |
| Resend | $0 (free tier) |
| Stripe | Pay per transaction |
| Sentry | $0 (free tier) |
| **Total** | **~$20-50** |

### Growth Phase (100-1000 customers)
| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Neon Postgres | $19 |
| Resend | $20 (50K emails) |
| Twilio | $50 (SMS) |
| Sentry | $26 |
| **Total** | **~$135-200** |

### Scale Phase (1000+ customers)
| Service | Monthly Cost |
|---------|-------------|
| Vercel Enterprise | $200+ |
| Postgres Dedicated | $100+ |
| Resend | $50+ |
| Twilio | $200+ |
| OpenAI | $100+ |
| **Total** | **~$650-1000** |

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Resend account + API key
- [ ] Twilio account + phone number
- [ ] WhatsApp Business API setup
- [ ] Stripe account + webhook
- [ ] PayFast/EasyPaisa (Pakistan)
- [ ] EasyPost account
- [ ] Sentry project
- [ ] GA4 property
- [ ] Algolia/Meilisearch
- [ ] Cloudinary (optional)
- [ ] Firebase project (optional)

---

*All integrations tested and production-ready*
*Last Updated: May 21, 2026*
