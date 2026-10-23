// ============================================================
// Bet With Net - Site Branding, Themes & SMTP Engine
// Dynamic Real-time Colors, Logo, Title, and Email Configuration
// ============================================================

class SiteSettings {
    constructor() {
        this.STORAGE_KEY = 'bwn_site_settings_v1';
        this.settings = this.load();
        this.applyTheme();
    }

    getDefaults() {
        return {
            branding: {
                siteTitle: 'BET WITH NET',
                tagline: "Pakistan's #1 Luxury Online Casino & P2P Desk",
                logoText: 'BET WITH NET',
                logoIcon: '👑',
                logoUrl: 'assets/images/logo.png',
                faviconUrl: 'assets/images/favicon.png',
                backgroundImage: 'assets/backgrounds/casino_main_bg.jpg',
                backgroundFit: 'cover',
                backgroundAttachment: 'fixed',
                noticeBanner: '🎁 Special Offer: 100% Matching Welcome Bonus Up to ₨ 50,000 on First Deposit! Use Code: LUXURY100',
                noticeActive: true,
                baseCurrency: 'USD',
                currencySymbol: '$',
                footerText: '© 2026 Bet With Net. All Rights Reserved. 18+ Play Responsibly.'
            },
            theme: {
                activePreset: 'emerald_royale',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontMono: "'JetBrains Mono', monospace",
                borderRadius: '14px',
                cardBlur: '20px',
                buttonStyle: 'luxury_gradient',
                dockStyle: 'floating_glass',
                layoutMaxWidth: '1280px',
                colors: {
                    primary: '#00e700',       // Emerald Neon
                    secondary: '#00cfe8',     // Cyan
                    gold: '#f5c518',          // 24k Gold
                    danger: '#ff4757',        // Crimson
                    bgDark: '#080b11',        // Pure Obsidian
                    bgCard: '#101622',        // Deep Slate Onyx
                    border: 'rgba(255, 255, 255, 0.08)'
                }
            },
            smtp: {
                host: 'smtp.betwithnet.com',
                port: 587,
                username: 'support@betwithnet.com',
                password: 'BwnSmtpSecret2026!',
                passwordMasked: '••••••••••••',
                fromEmail: 'cashier@betwithnet.com',
                fromName: 'Bet With Net Cashier & VIP Desk',
                encryption: 'TLS', // 'SSL' | 'TLS' | 'None'
                status: 'configured'
            },
            adminProfile: {
                email: 'admin@betwithnet.com',
                phone: '0300-7777777',
                adminPin: '9824',
                masterPin: '8391',
                adminPinHash: 'e6962f979727453eb5a43588dae09ec4e3d93822ee4cf4d6bb0e0ab77db594a5',
                masterPinHash: 'f4fbc5218d6a6c0b3967d1ab31aa9ca5a0f2b3b0d2fe851214fcbcbebbab7f06',
                lastLogin: '2026-09-11 20:45'
            }
        };
    }

    getPresets() {
        return {
            emerald_royale: {
                name: '👑 Emerald Royale (Standard)',
                colors: {
                    primary: '#00e700',
                    secondary: '#00cfe8',
                    gold: '#f5c518',
                    danger: '#ff4757',
                    bgDark: '#080b11',
                    bgCard: '#101622',
                    border: 'rgba(0, 231, 0, 0.2)'
                }
            },
            cyber_sapphire: {
                name: '💎 Cyber Sapphire (High-Tech)',
                colors: {
                    primary: '#00d2ff',
                    secondary: '#9b51e0',
                    gold: '#ffd700',
                    danger: '#ff3366',
                    bgDark: '#060d17',
                    bgCard: '#0d1a2d',
                    border: 'rgba(0, 210, 255, 0.25)'
                }
            },
            monaco_gold: {
                name: '🏆 Monaco Gold (Luxury High-Roller)',
                colors: {
                    primary: '#ffd700',
                    secondary: '#e67e22',
                    gold: '#f39c12',
                    danger: '#e74c3c',
                    bgDark: '#0c0a06',
                    bgCard: '#1c160b',
                    border: 'rgba(255, 215, 0, 0.25)'
                }
            },
            tokyo_neon: {
                name: '🌌 Tokyo Neon (Cyberpunk)',
                colors: {
                    primary: '#ff007f',
                    secondary: '#00f0ff',
                    gold: '#ffe600',
                    danger: '#ff2a2a',
                    bgDark: '#0d0614',
                    bgCard: '#1a0c28',
                    border: 'rgba(255, 0, 127, 0.25)'
                }
            }
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const def = this.getDefaults();
                return {
                    branding: { ...def.branding, ...(parsed.branding || {}) },
                    theme: { ...def.theme, ...(parsed.theme || {}) },
                    smtp: { ...def.smtp, ...(parsed.smtp || {}) },
                    adminProfile: { ...def.adminProfile, ...(parsed.adminProfile || {}) }
                };
            }
        } catch (e) {
            console.warn('Failed to load site settings, using defaults');
        }
        const defaults = this.getDefaults();
        this.save(defaults);
        return defaults;
    }

    save(data = null) {
        if (data) this.settings = data;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
            this.applyTheme();
            window.dispatchEvent(new Event('bwn_settings_updated'));
        } catch (e) {
            console.error('Failed to save site settings:', e);
        }
    }

    // Applies CSS custom properties across the document
    applyTheme() {
        const c = this.settings.theme.colors;
        let styleEl = document.getElementById('dynamic-bwn-theme');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-bwn-theme';
            document.head.appendChild(styleEl);
        }

        styleEl.innerHTML = `
            :root {
                --primary: ${c.primary} !important;
                --primary-glow: ${c.primary}40 !important;
                --secondary: ${c.secondary} !important;
                --gold: ${c.gold} !important;
                --danger: ${c.danger} !important;
                --bg-deep: ${c.bgDark} !important;
                --bg-card-custom: ${c.bgCard} !important;
                
                /* AdminLTE Custom Sync */
                --lte-green: ${c.primary} !important;
                --lte-gold: ${c.gold} !important;
                --lte-cyan: ${c.secondary} !important;
                --lte-red: ${c.danger} !important;
                --lte-bg-dark: ${c.bgDark} !important;
                --lte-bg-card: ${c.bgCard} !important;
            }
        `;

        // Update document title if siteTitle is defined
        if (this.settings.branding && this.settings.branding.siteTitle) {
            if (!document.title.includes('AdminLTE')) {
                document.title = `${this.settings.branding.siteTitle} - ${this.settings.branding.tagline}`;
            }
        }
    }

    setPresetTheme(presetKey) {
        const presets = this.getPresets();
        if (presets[presetKey]) {
            this.settings.theme.activePreset = presetKey;
            this.settings.theme.colors = { ...presets[presetKey].colors };
            this.save();
            return true;
        }
        return false;
    }

    updateColors(newColors) {
        this.settings.theme.colors = { ...this.settings.theme.colors, ...newColors };
        this.settings.theme.activePreset = 'custom';
        this.save();
    }

    updateBranding(brandingData) {
        this.settings.branding = { ...this.settings.branding, ...brandingData };
        this.save();
    }

    updateSMTP(smtpData) {
        this.settings.smtp = { ...this.settings.smtp, ...smtpData };
        this.save();
    }

    updateAdminProfile(profileData) {
        this.settings.adminProfile = { ...this.settings.adminProfile, ...profileData };
        if (profileData.masterPin && window.adminConfig) {
            window.adminConfig.config.adminPin = profileData.masterPin;
            window.adminConfig.save();
        }
        this.save();
    }
}

window.siteSettings = new SiteSettings();
