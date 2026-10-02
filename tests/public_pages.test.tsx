// @vitest-environment jsdom
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/HomePage';
import { WhyPage } from '../src/pages/WhyPage';
import { HowItWorksPage } from '../src/pages/HowItWorksPage';
import { EvidencePage } from '../src/pages/EvidencePage';
import { RoadmapPage } from '../src/pages/RoadmapPage';
import { Navbar } from '../src/components/Navbar';
import { AuthProvider } from '../src/context/AuthContext';

// Simple check for emojis
const hasEmoji = (text: string) => {
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/u;
  return emojiRegex.test(text);
};

const BANNED_NAMES = /Gupta|Hariram|Urmila|Khatib|Yadav/;

const renderWithRouter = (ui: React.ReactElement, initialRoute = '/') => {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('Public Pages', () => {
  afterEach(() => {
    cleanup();
  });

  test('Navbar contains all links', () => {
    const { container } = renderWithRouter(<Navbar />);
    const links = Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(links).toContain('/');
    expect(links).toContain('/why');
    expect(links).toContain('/how-it-works');
    expect(links).toContain('/evidence');
    expect(links).toContain('/roadmap');
    expect(links).toContain('/demo');
  });

  test('HomePage renders h1 and no emojis in new content', () => {
    const { container } = renderWithRouter(<HomePage />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeNull();
    
    // Note: Navbar is not here, so we only test the page content itself.
    // The previous homepage had a shield emoji, but it's removed now.
    expect(hasEmoji(container.textContent || '')).toBe(false);
  });

  test('WhyPage renders h1 and no emojis', () => {
    const { container } = renderWithRouter(<WhyPage />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeNull();
    expect(hasEmoji(container.textContent || '')).toBe(false);
  });

  test('HowItWorksPage renders h1 and no emojis', () => {
    // The arrows (▼, ▶) are NOT emojis, they are standard geometric shapes.
    // The hasEmoji check will not flag them.
    const { container } = renderWithRouter(<HowItWorksPage />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeNull();
    expect(hasEmoji(container.textContent || '')).toBe(false);
  });

  test('RoadmapPage renders h1, table and no emojis', () => {
    const { container } = renderWithRouter(<RoadmapPage />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeNull();
    expect(screen.queryByRole('table')).not.toBeNull();
    expect(hasEmoji(container.textContent || '')).toBe(false);
  });

  test('EvidencePage renders h1, exact URLs, no banned names and no emojis', async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = renderWithRouter(<EvidencePage />);
      container = res.container;
    });

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeNull();
    
    const textContent = container!.textContent || '';
    expect(hasEmoji(textContent)).toBe(false);
    expect(BANNED_NAMES.test(textContent)).toBe(false);

    const urls = Array.from(container!.querySelectorAll('a')).map(a => a.href);
    
    const expectedUrls = [
      'https://www.thehindu.com/news/cities/Delhi/delhi-satya-niketan-building-collapse-september-6-2026-several-trapped-injured/article71434876.ece',
      'https://www.thehindu.com/news/cities/Delhi/delhi-building-collapse-death-toll-up-to-7-hc-orders-citywide-pg-inspection-flags-student-housing-woes/article71439955.ece',
      'https://www.newindianexpress.com/cities/delhi/2026/Sep/07/delhi-building-collapse-rescue-operation-ends-after-27-hours-no-fresh-casualties',
      'https://www.hindustantimes.com/cities/delhi-news/satya-niketan-building-plan-not-sanctioned-mcd-says-latest-work-was-illegal-101788721204156.html',
      'https://www.indiatoday.in/amp/cities/delhi/story/satya-niketan-building-collapse-delhi-police-six-accused-safety-lapses-ptag-3002201-2026-09-24',
      'https://www.thehindu.com/news/national/maharashtra/fatal-gas-leak-at-palghar-pharma-unit-four-company-officials-booked-for-culpable-homicide/article69963530.ece',
      'https://indianexpress.com/article/cities/mumbai/tarapur-midc-four-workers-dead-2-critical-after-nitrogen-gas-leak-at-pharma-unit-10203774/',
      'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2161078',
      'https://www.hindustantimes.com/cities/mumbai-news/ngt-takes-suo-motu-cognisance-after-four-died-in-gas-leak-at-boisar-based-pharma-company-101757011243005.html',
      'https://www.sphereindia.org.in/sites/default/files/2025-06/SitRep%202_Kerala%20Rainfall.pdf',
      'https://www.newindianexpress.com/states/kerala/2025/May/31/five-dead-13-missing-as-kerala-reels-under-monsoon-fury',
      'https://www.theweek.in/wire-updates/national/2025/05/29/mes16-kl-3rdld-rains.html',
      'https://internal.imd.gov.in/press_release/20250529_pr_4011.pdf'
    ];

    expectedUrls.forEach(url => {
      // Because MemoryRouter renders relative to localhost usually, we should check if the a.href includes or matches.
      // But these are absolute URLs so they will match exactly.
      expect(urls).toContain(url);
    });
  });
});
