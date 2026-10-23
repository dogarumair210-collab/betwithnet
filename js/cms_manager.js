// ============================================================
// Bet With Net - CMS Pages Engine
// Full Add, Edit, Delete, Slug Resolution & Publishing Controls
// Synchronized with Player Policy Viewer & Admin Back-Office
// ============================================================

class CMSManager {
    constructor() {
        this.STORAGE_KEY = 'bwn_cms_pages_v1';
        this.pages = this.load();
    }

    getDefaults() {
        return [
            {
                id: 'cms-terms',
                title: 'Terms and Conditions',
                slug: 'terms',
                category: 'Legal & Compliance',
                status: 'published',
                updatedAt: '2026-09-10 14:00',
                author: 'Casino Compliance Officer',
                content: `<h2>1. Acceptance of Terms</h2>
<p>By registering, accessing, or wagering on <strong>Bet With Net</strong>, you agree to be bound by these comprehensive terms, rules, and privacy stipulations.</p>
<h2>2. Legal Eligibility</h2>
<p>You must be at least 18 years of age (or legal gambling age in your jurisdiction) to open an account. Only one account is permitted per person, household, and IP address.</p>
<h2>3. Deposits & Wagering</h2>
<p>All deposits must be made using genuine personal banking channels (EasyPaisa, JazzCash, Raast, or USDT). Wagered funds are subject to game-specific RTP rules.</p>
<h2>4. Cashout & Withdrawals</h2>
<p>Withdrawals are processed exclusively to accounts matching the registered player's legal name. Suspicious betting patterns or arbitrage may lead to account review.</p>
<h2>5. Fair Play & Security</h2>
<p>Our RNG (Random Number Generator) algorithm is cryptographically audited. Any exploitation of system bugs or reverse-engineering will result in permanent suspension.</p>`
            },
            {
                id: 'cms-privacy',
                title: 'Privacy Policy',
                slug: 'privacy',
                category: 'Legal & Compliance',
                status: 'published',
                updatedAt: '2026-09-08 11:30',
                author: 'Data Protection Officer',
                content: `<h2>1. Data Collection</h2>
<p>We collect essential player data including username, contact phone number, email address, transaction identifiers (TID), and gameplay logs to provide seamless casino services.</p>
<h2>2. End-to-End Encryption</h2>
<p>All sensitive communications, wallet credentials, and security PINs are protected using high-grade 256-bit AES encryption.</p>
<h2>3. Third-Party Policy</h2>
<p>Bet With Net does <strong>never</strong> sell, rent, or trade player details to external marketing agencies or unauthorized third parties.</p>`
            },
            {
                id: 'cms-responsible',
                title: 'Responsible Gaming Policy',
                slug: 'responsible-gaming',
                category: 'Player Protection',
                status: 'published',
                updatedAt: '2026-09-05 16:45',
                author: 'Player Welfare Team',
                content: `<h2>Safe & Balanced Entertainment</h2>
<p>Online casino gaming should remain a thrilling leisure activity. Never bet money that you cannot afford to lose or treat betting as a reliable income source.</p>
<h2>Player Protection Tools:</h2>
<ul>
  <li><strong>Deposit Limits:</strong> Set daily, weekly, or monthly deposit ceilings.</li>
  <li><strong>Cool-Off Period:</strong> Request temporary session suspensions.</li>
  <li><strong>Self-Exclusion:</strong> Permanently ban yourself from wagering across all studios.</li>
</ul>
<p>If you or someone you know is experiencing difficulties with gambling habits, please reach out to our 24/7 Player Support helpline.</p>`
            },
            {
                id: 'cms-about',
                title: 'About Bet With Net',
                slug: 'about',
                category: 'General Information',
                status: 'published',
                updatedAt: '2026-09-01 10:00',
                author: 'Editorial Desk',
                content: `<h2>Pakistan's Premier High-Roller Casino Experience</h2>
<p><strong>Bet With Net</strong> is an elite online gaming platform tailored specifically for Pakistani gaming enthusiasts. We deliver over 17 ultra-responsive HTML5 casino studios including live Crash, European Roulette, Plinko, Mines, Blackjack 21, and Vegas Video Poker.</p>
<p>With lightning-fast EasyPaisa and JazzCash banking integration, players experience zero-friction instant deposits and reliable cashout fulfillment.</p>`
            },
            {
                id: 'cms-faq',
                title: 'Frequently Asked Questions (FAQ)',
                slug: 'faq',
                category: 'Support & Help',
                status: 'published',
                updatedAt: '2026-09-11 12:15',
                author: 'Customer Support Lead',
                content: `<h2>Q: How do I deposit funds via EasyPaisa or JazzCash?</h2>
<p>A: Click the Deposit button in your top wallet bar, select EasyPaisa or JazzCash, transfer the desired amount to our official merchant number, and enter your TID reference number. Your wallet will credit within seconds!</p>
<h2>Q: What is the minimum withdrawal limit?</h2>
<p>A: Minimum withdrawal is ₨ 1,000 for mobile wallets and ₨ 2,500 for bank transfers.</p>
<h2>Q: Are games fair?</h2>
<p>A: All 17 studios utilize provably fair algorithms and certified RNG return-to-player matrixes guaranteeing transparent game rounds.</p>`
            },
            {
                id: 'cms-bonus',
                title: 'VIP & Bonus Rules',
                slug: 'bonus-rules',
                category: 'Promotions',
                status: 'published',
                updatedAt: '2026-09-09 18:20',
                author: 'VIP Host Management',
                content: `<h2>1. Welcome Deposit Bonus</h2>
<p>First-time deposits are eligible for a 100% matching bonus up to ₨ 50,000. Wagering turnover requirement is 10x before cashout.</p>
<h2>2. VIP Tier Climbing</h2>
<p>Every ₨ 1,000 wagered earns 1 VIP Loyalty Point. Unlock higher withdrawal limits, private account managers, and exclusive weekly loss cashback as you advance from Bronze to Diamond VIP.</p>`
            },
            {
                id: 'cms-aml',
                title: 'Anti-Money Laundering (AML) & KYC Policy',
                slug: 'aml-kyc',
                category: 'Legal & Compliance',
                status: 'published',
                updatedAt: '2026-09-11 15:00',
                author: 'Compliance Directorate',
                content: `<h2>1. Regulatory Compliance Framework</h2>
<p>Bet With Net strictly enforces international Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) standards. All transactions are screened for suspicious velocity, structured deposits, and identity consistency.</p>
<h2>2. Know Your Customer (KYC) Verification</h2>
<p>Withdrawals exceeding ₨ 100,000 or $500 USD require standard Tier-2 identity verification including CNIC/Passport scan and payment ownership confirmation.</p>
<h2>3. Zero Tolerance for Fraud</h2>
<p>Accounts associated with chargebacks, illicit third-party funds, or multi-accounting will be frozen and subject to full regulatory audit.</p>`
            },
            {
                id: 'cms-fairplay',
                title: 'Provably Fair Gaming & RNG Certification',
                slug: 'fair-play',
                category: 'Player Protection',
                status: 'published',
                updatedAt: '2026-09-11 16:30',
                author: 'Gaming Auditor',
                content: `<h2>1. Cryptographic Provably Fair Algorithm</h2>
<p>Every game outcome on Bet With Net (Crash, Roulette, Dice, Mines, Plinko) is mathematically verifiable. Game seeds combine a Server Seed, Client Seed, and Nonce counter to ensure results cannot be altered prior to or during the round.</p>
<h2>2. Certified Return to Player (RTP)</h2>
<p>Our official game studios maintain an audited house edge between 1.0% and 4.0%, providing real-time return to player rates up to 99.0% on Dice and 98.0% on Plinko and Hi-Lo.</p>`
            },
            {
                id: 'cms-exclusion',
                title: 'Self-Exclusion & Player Well-Being',
                slug: 'self-exclusion',
                category: 'Player Protection',
                status: 'published',
                updatedAt: '2026-09-11 17:00',
                author: 'Welfare Officer',
                content: `<h2>Self-Exclusion Options</h2>
<p>If you feel you need a break from wagering, you can request an instant 24-hour cool-off, 30-day hiatus, or permanent self-exclusion by contacting our 24/7 support desk or adjusting your profile settings.</p>`
            }
        ];
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length >= 7) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load CMS pages, resetting defaults');
        }
        const defaults = this.getDefaults();
        this.save(defaults);
        return defaults;
    }

    save(pagesList = null) {
        if (pagesList) this.pages = pagesList;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pages));
            window.dispatchEvent(new Event('bwn_cms_updated'));
        } catch (e) {
            console.error('Failed to save CMS pages:', e);
        }
    }

    getAllPages(onlyPublished = false) {
        return onlyPublished ? this.pages.filter(p => p.status === 'published') : this.pages;
    }

    getPageById(id) {
        return this.pages.find(p => p.id === id) || null;
    }

    getPageBySlug(slug) {
        if (!slug) return null;
        return this.pages.find(p => p.slug.toLowerCase() === slug.toLowerCase()) || null;
    }

    addPage(pageData) {
        const title = pageData.title || 'Untitled Page';
        let slug = (pageData.slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/^-+|-+$/g, '');
        if (!slug) slug = 'page-' + Date.now();

        // Ensure slug uniqueness
        let finalSlug = slug;
        let counter = 1;
        while (this.pages.some(p => p.slug === finalSlug)) {
            finalSlug = `${slug}-${counter++}`;
        }

        const newId = 'cms-' + Math.floor(1000 + Math.random() * 9000);
        const newPage = {
            id: newId,
            title,
            slug: finalSlug,
            category: pageData.category || 'General',
            status: pageData.status || 'published',
            author: pageData.author || 'Casino Administrator',
            updatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            content: pageData.content || '<p>Content in preparation.</p>'
        };

        this.pages.push(newPage);
        this.save();
        return newPage;
    }

    updatePage(id, updates) {
        const idx = this.pages.findIndex(p => p.id === id);
        if (idx === -1) return false;

        updates.updatedAt = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        this.pages[idx] = { ...this.pages[idx], ...updates };
        this.save();
        return this.pages[idx];
    }

    deletePage(id) {
        if (this.pages.length <= 1) {
            alert('Cannot delete the last remaining CMS page!');
            return false;
        }
        this.pages = this.pages.filter(p => p.id !== id);
        this.save();
        return true;
    }

    togglePublish(id) {
        const p = this.getPageById(id);
        if (!p) return false;
        p.status = (p.status === 'published') ? 'draft' : 'published';
        p.updatedAt = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        this.save();
        return p.status;
    }
}

window.cmsManager = new CMSManager();
