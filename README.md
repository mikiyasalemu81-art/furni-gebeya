# Furni Gebeya (ፈርኒ ገበያ)

> **Ethiopia's Premier Marketplace for Artisanal Furniture, Local Timber & Carpentry Workshops**

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + RLS + Realtime)**, **AfroMessage SMS**, and **Cloudinary**.

---

## 🚀 Key Features Built Across All Stages

1. **Brand & Design Tokens**:
   - Custom palette tailored for the Ethiopian market: Red Primary, Light Blue, Cyan accents, and Deep Black.
   - Dark/Light Theme with persistent theme toggling.
   - Trilingual Next-Intl support (**English**, **Amharic (አማርኛ)**, and **Afaan Oromoo**).
2. **Phone OTP Authentication (AfroMessage)**:
   - Ethiopian phone numbers (`+251...`) with strict E.164 normalization.
   - Hashed OTP storage using HMAC-SHA256, 5-minute expiry, rate limiting, and maximum attempt limits.
   - Safe development fallback: OTP prints directly to the terminal when `NODE_ENV=development`.
   - Seeded system administrator (`+251911000000`).
3. **Role Selection & Verification**:
   - Roles: **Supplier / Artisan**, **Seller / Showroom**, and **Buyer**.
   - Identity & Trade License verification queue with signed URLs.
   - Real-time audit logs for every admin action.
   - SMS notifications on approval, rejection, or more documents requested via AfroMessage.
4. **Listings Management & Home Feed**:
   - Create, edit, mark sold, and delete listings.
   - Strict upload rules: Maximum 4 photos compressed client-side via HTML5 canvas, zero video files allowed.
   - Fixed ETB price or "Ask Price" (ዋጋ ይጠይቁ). Condition: **New (አዲስ)** or **Used (ያገለገለ)**.
   - Multi-filtering: Category, Ethiopian timber/material (Wanza, Tid, Zigba), price range, city, and verified-only.
5. **LinkedIn-Style Public Profiles**:
   - Custom cover photo, business banner, member since, bio, role badges, and verified checkmarks.
   - Protected direct contact section (Phone, WhatsApp, Telegram, Workshop Map) visible to logged-in users with audit logging of every contact view.
   - 30-day free trial activated upon verification approval.
   - Pluggable payment gateway interface (`PaymentGatewayService` / `ChapaPaymentGateway`).
6. **In-App Realtime Chat & Reviews Moderation**:
   - 1:1 conversation pairs optionally linked to furniture items.
   - Unread counts, timestamps, user blocking, and reporting.
   - Verified reviews: Users can only review a seller if they viewed contact info or chatted with them.
   - Admin moderation console for reports and reviews.
7. **Production Hardening & Admin Console**:
   - Master Admin Console at `/admin`: Verification Queue, Subscriptions & Trial, Reports Moderation, Reviews Moderation, User Accounts with Suspend/Reactivate, and Audit Trail.
   - Vercel Cron endpoint at `/api/cron/trial-reminders` protected by `CRON_SECRET` to dispatch SMS reminders on Day 20 and Day 27.
   - Comprehensive Row Level Security (RLS) policies for all database tables.

---

## 🛠️ Local Development Setup

1. **Clone & Install Dependencies**:
   ```powershell
   git clone <repo-url>
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```powershell
   cp .env.example .env.local
   ```

3. **Run the Development Server**:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Test Accounts**:
   - **System Admin**: Log in with phone `+251911000000`. In development, any 6-digit OTP works or check the server console. Access the admin dashboard at `/en/admin`.
   - **Artisan**: Log in with any phone, choose "Supplier", upload verification, and experience the workflow.

---

## 🌐 Checklist of Environment Variables for Vercel Deployment

When deploying to [Vercel](https://vercel.com):

| Variable Name | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Your production domain (e.g., `https://furnigebeya.et`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Project Anonymous Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Secret Service Role Key (Bypasses RLS on server endpoints) |
| `AFROMESSAGE_API_TOKEN` | Yes | AfroMessage API Bearer Token for SMS delivery in Ethiopia |
| `AFROMESSAGE_SENDER_NAME` | Optional | Registered Sender Name (defaults to `FurniGebeya`) |
| `OTP_SECRET` | Yes | 32+ character random secret for HMAC-SHA256 OTP hashing |
| `CRON_SECRET` | Yes | Secret token for Vercel Cron jobs (`/api/cron/trial-reminders`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary Cloud Name for media storage |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary Secret Key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Client-side Cloudinary Cloud Name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | Cloudinary unsigned or signed upload preset |
| `CHAPA_PUBLIC_KEY` | Optional | Chapa Public Key for online payment processing |
| `CHAPA_SECRET_KEY` | Optional | Chapa Secret Key |
| `CHAPA_WEBHOOK_SECRET` | Optional | Chapa Webhook Secret |

---

## 🔒 Security & RLS Summary

All tables in `supabase/migrations/` enforce Row Level Security:
- `profiles`: Users can only edit their own profile; Admins have master access.
- `listings`: Only verified sellers/suppliers and admins can publish. Soft-deleted and archived listings are hidden from public queries.
- `verifications`: Uploaded documents live in a private Supabase Storage bucket accessed only via short-lived signed URLs.
- `contact_views`: Logs all seller contact inquiries with timestamps to prevent scrapers and track review eligibility.
- `conversations` & `messages`: Encrypted in transit and strictly restricted to the 2 participants.
- `reviews`: Restricted to users who interacted with the seller; single review per user pair.
- `reports`: Admin-moderated with audit trails.
