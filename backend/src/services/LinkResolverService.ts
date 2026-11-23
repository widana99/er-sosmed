import { URL } from 'url';

export interface ResolvedSocialLink {
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';
  username: string;
  originalUrl: string;
  resolvedUrl: string;
}

export class LinkResolverService {
  private static readonly BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  private static readonly ALLOWED_HOSTS = [
    'tiktok.com',
    'www.tiktok.com',
    'vt.tiktok.com',
    'vm.tiktok.com',
    't.tiktok.com',
    'm.tiktok.com',
    'instagram.com',
    'www.instagram.com',
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'mbasic.facebook.com',
    'fb.com',
    'fb.watch',
  ];

  /**
   * Extracts URL from potentially messy text (e.g. from WhatsApp/TikTok share sheets)
   */
  static extractUrlFromText(text: string): string | null {
    if (!text) return null;
    const match = text.match(/(https?:\/\/[^\s<>"']+)/i);
    return match ? match[1] : null;
  }

  /**
   * Checks whether the string contains or is a supported social media link
   */
  static isShareLink(input: string): boolean {
    const urlStr = this.extractUrlFromText(input);
    if (!urlStr) return false;

    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      return this.ALLOWED_HOSTS.some(
        (allowed) => host === allowed || host.endsWith('.' + allowed)
      );
    } catch {
      return false;
    }
  }

  /**
   * Safely resolves a share link, following redirects and extracting platform and username
   */
  static async resolveLink(rawInput: string): Promise<ResolvedSocialLink> {
    const extractedUrl = this.extractUrlFromText(rawInput);
    if (!extractedUrl) {
      throw new Error('Format tautan tidak valid. Pastikan tautan menyertakan http:// atau https://');
    }

    let parsed: URL;
    try {
      parsed = new URL(extractedUrl);
    } catch {
      throw new Error('URL yang dimasukkan tidak valid.');
    }

    const host = parsed.hostname.toLowerCase();
    const isAllowed = this.ALLOWED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith('.' + allowed)
    );

    if (!isAllowed) {
      throw new Error(
        `Domain tidak didukung (${host}). Hanya mendukung tautan dari TikTok, Instagram, dan YouTube.`
      );
    }

    // Direct profile parsing without redirect if already full URL
    // Facebook: https://www.facebook.com/username or /profile.php?id=...
    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) {
      if (parsed.searchParams.has('id')) {
        const id = parsed.searchParams.get('id')!;
        return {
          platform: 'FACEBOOK',
          username: id,
          originalUrl: extractedUrl,
          resolvedUrl: extractedUrl,
        };
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        parts.length > 0 &&
        !['share', 'watch', 'groups', 'events', 'marketplace', 'gaming', 'login', 'recover'].includes(parts[0].toLowerCase())
      ) {
        let cleanUser = parts[0].toLowerCase().replace(/^@/, '');
        if (cleanUser === 'pages' && parts.length >= 3) {
          cleanUser = parts[2].toLowerCase();
        } else if (cleanUser === 'people' && parts.length >= 2) {
          cleanUser = parts[1].toLowerCase();
        }
        return {
          platform: 'FACEBOOK',
          username: cleanUser,
          originalUrl: extractedUrl,
          resolvedUrl: extractedUrl,
        };
      }
    }

    // YouTube: https://www.youtube.com/@handle or /channel/... or /c/...
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const ytMatch = parsed.pathname.match(/^\/@([a-zA-Z0-9_.-]+)/) || parsed.pathname.match(/^\/(c|user)\/([a-zA-Z0-9_.-]+)/);
      if (ytMatch) {
        const u = (ytMatch[2] || ytMatch[1]).toLowerCase();
        return {
          platform: 'YOUTUBE',
          username: u,
          originalUrl: extractedUrl,
          resolvedUrl: extractedUrl,
        };
      }
    }

    // TikTok: https://www.tiktok.com/@username or https://www.tiktok.com/@username/video/...
    if (host.includes('tiktok.com') && !host.startsWith('vt.') && !host.startsWith('vm.')) {
      const userMatch = parsed.pathname.match(/^\/@([a-zA-Z0-9_.-]+)/);
      if (userMatch) {
        return {
          platform: 'TIKTOK',
          username: userMatch[1].toLowerCase(),
          originalUrl: extractedUrl,
          resolvedUrl: extractedUrl,
        };
      }
    }

    // Instagram: https://www.instagram.com/username/ or post/reel link
    if (host.includes('instagram.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        parts.length > 0 &&
        !['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'].includes(parts[0].toLowerCase())
      ) {
        const cleanUser = parts[0].toLowerCase().replace(/^@/, '');
        return {
          platform: 'INSTAGRAM',
          username: cleanUser,
          originalUrl: extractedUrl,
          resolvedUrl: extractedUrl,
        };
      }

      // Handle Instagram post or reel link (e.g. /p/CODE/ or /reel/CODE/)
      if (parts.length >= 2 && ['p', 'reel', 'reels'].includes(parts[0].toLowerCase())) {
        const shortcode = parts[1];
        const postUrl = `https://www.instagram.com/p/${shortcode}/`;
        try {
          const postRes = await fetch(postUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          if (postRes.ok) {
            const html = await postRes.text();
            const desc =
              html.match(/<meta\s+(?:property|name)="(?:og:description|description)"\s+content="([^"]+)"/i)?.[1] || '';
            const userMatch = desc.match(/-\s*([a-zA-Z0-9_.-]+)\s+on\s+[A-Za-z]+\s+\d+/i);
            if (userMatch && userMatch[1]) {
              return {
                platform: 'INSTAGRAM',
                username: userMatch[1].toLowerCase(),
                originalUrl: extractedUrl,
                resolvedUrl: `https://www.instagram.com/${userMatch[1].toLowerCase()}/`,
              };
            }
          }
        } catch {
          // fall through to general redirect handler
        }
      }
    }

    // If it's a shortlink (vt.tiktok.com, vm.tiktok.com) or video link, follow redirect
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(extractedUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': this.BROWSER_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
      });

      const finalUrl = response.url || extractedUrl;
      const finalParsed = new URL(finalUrl);

      // Check TikTok @username in final URL
      const tiktokUserMatch = finalParsed.pathname.match(/@([a-zA-Z0-9_.-]+)/);
      if (tiktokUserMatch) {
        return {
          platform: 'TIKTOK',
          username: tiktokUserMatch[1].toLowerCase(),
          originalUrl: extractedUrl,
          resolvedUrl: finalUrl,
        };
      }

      // If redirected to HTML without @username in URL (e.g. video share page), inspect HTML
      const html = await response.text();
      const metaMatch =
        html.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/i) ||
        html.match(/"uniqueId":"([a-zA-Z0-9_.-]+)"/i) ||
        html.match(/"authorName":"([^"]+)"/i);

      if (metaMatch && metaMatch[1]) {
        return {
          platform: 'TIKTOK',
          username: metaMatch[1].toLowerCase(),
          originalUrl: extractedUrl,
          resolvedUrl: finalUrl,
        };
      }

      throw new Error(
        'Tidak dapat menemukan akun dari link yang diberikan. Pastikan link adalah link profil atau video pengguna publik.'
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Waktu permintaan habis saat mencoba membuka tautan share.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
