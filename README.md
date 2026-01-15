🌌 StarSync | Advanced Astrology & Consultation SaaSStarSync is a professional-grade, stateful backend platform for Vedic Astrology consultations. It combines real-time astrologer availability with secure payment processing and deep astronomical calculations for Kundli and Compatibility.


🚀 Key Features\

🔐 Stateful Session ManagementSingle-Device Login: Enforces a "one account, one device" rule using unique Session UUIDs.Instant Session Killing: Logging in on a new device automatically invalidates the session on the previous device.Real-time Status: Tracks whether Astrologers are online, offline, or busy.

💳 Stripe Payment & Wallet SystemSecure Recharge: Integrated Stripe checkout for wallet top-ups.Atomic Transactions: Ensures walletBalance updates are accurate and protected against race conditions.Transaction Auditing: Detailed logs for every call and wallet transaction.

☸️ Astrology EngineKundli Generation: Real-time Vedic birth chart generation using date, time, and location.Love Compatibility: Synastry-based "Match Making" algorithm to calculate compatibility scores.Daily Horoscopes: Automated zodiac insights and planetary transit updates.

🛡️ Role-Based Access Control (RBAC)User: Can generate charts, recharge wallets, and book consultations.Astrologer: Can manage their live status, view revenue stats, and read client reviews.Admin: Full dashboard to onboard/delete astrologers and monitor system health.

🛠️ Tech StackBackend: Node.js, Express.jsDatabase: MongoDB & Mongoose (Stateful Schema design)Authentication: JWT (Access & Refresh Tokens) with Session UUIDsPayments: Stripe API & WebhooksCloud Storage: Cloudinary (Profile & Astrology Assets)Security: Bcrypt.js, Crypto, CORS

🔒 Stateful Authentication FlowStarSync moves beyond stateless JWTs to provide a "kill-switch" capability. By checking the activeSessionId on every request, the server maintains absolute control over user sessions.Login: Server generates a uuidv4() and stores it in the DB and the JWT.Middleware: Compares the JWT's sessionId against the DB's activeSessionId.Logout/Conflict: Setting the DB value to null or a new ID instantly kicks out the old session.🚦 Installation & SetupClone the Repo:Bashgit clone https://github.com/mannrandhawa004/astro.git

Install Dependencies:Bash
npm install

Environment Variables (.env):Code snippet

PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECERET_KEY=your_access_secret
JWT_REFRESHTOKEN_SECERET_KEY=your_refresh_secret
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
CLOUDINARY_URL=your_cloudinary_url

