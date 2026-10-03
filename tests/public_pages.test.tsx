// @vitest-environment jsdom

import {
  describe,
  test,
  expect,
  afterEach,
} from 'vitest';

import {
  render,
  screen,
  act,
  cleanup,
} from '@testing-library/react';

import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from '../src/pages/HomePage';
import { WhyPage } from '../src/pages/WhyPage';
import { HowItWorksPage } from '../src/pages/HowItWorksPage';
import { EvidencePage } from '../src/pages/EvidencePage';
import { RoadmapPage } from '../src/pages/RoadmapPage';

import { Navbar } from '../src/components/Navbar';
import { AuthProvider } from '../src/context/AuthContext';

/* =========================================================
   HELPERS
   ========================================================= */

const hasEmoji = (text: string) => {
  const emojiRegex =
    /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/u;

  return emojiRegex.test(text);
};

const BANNED_NAMES =
  /Gupta|Hariram|Urmila|Khatib|Yadav/;

const renderWithRouter = (
  ui: React.ReactElement,
  initialRoute = '/',
) => {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={[initialRoute]}
      >
        {ui}
      </MemoryRouter>
    </AuthProvider>,
  );
};

/* =========================================================
   TESTS
   ========================================================= */

describe('Public Pages', () => {
  afterEach(() => {
    cleanup();
  });

  test('Navbar contains all public navigation links', () => {
    const { container } =
      renderWithRouter(<Navbar />);

    const links = Array.from(
      container.querySelectorAll('a'),
    ).map((a) =>
      a.getAttribute('href'),
    );

    expect(links).toContain('/');
    expect(links).toContain('/why');
    expect(links).toContain(
      '/how-it-works',
    );
    expect(links).toContain(
      '/evidence',
    );
    expect(links).toContain(
      '/roadmap',
    );
    expect(links).toContain('/demo');
  });

  test('HomePage renders h1 and no emojis', () => {
    const { container } =
      renderWithRouter(<HomePage />);

    expect(
      screen.queryByRole('heading', {
        level: 1,
      }),
    ).not.toBeNull();

    expect(
      hasEmoji(
        container.textContent || '',
      ),
    ).toBe(false);
  });

  test('WhyPage renders h1 and no emojis', () => {
    const { container } =
      renderWithRouter(<WhyPage />);

    expect(
      screen.queryByRole('heading', {
        level: 1,
      }),
    ).not.toBeNull();

    expect(
      hasEmoji(
        container.textContent || '',
      ),
    ).toBe(false);
  });

  test('HowItWorksPage renders h1 and no emojis', () => {
    const { container } =
      renderWithRouter(
        <HowItWorksPage />,
      );

    expect(
      screen.queryByRole('heading', {
        level: 1,
      }),
    ).not.toBeNull();

    expect(
      hasEmoji(
        container.textContent || '',
      ),
    ).toBe(false);
  });

  test('RoadmapPage renders h1 and no emojis', () => {
    const { container } =
      renderWithRouter(
        <RoadmapPage />,
      );

    expect(
      screen.queryByRole('heading', {
        level: 1,
      }),
    ).not.toBeNull();

    expect(
      hasEmoji(
        container.textContent || '',
      ),
    ).toBe(false);
  });

  test('EvidencePage renders h1, source links, no banned names and no emojis', async () => {
    let container!: HTMLElement;

    await act(async () => {
      const result =
        renderWithRouter(
          <EvidencePage />,
        );

      container =
        result.container;
    });

    expect(
      screen.queryByRole('heading', {
        level: 1,
      }),
    ).not.toBeNull();

    const textContent =
      container.textContent || '';

    expect(
      hasEmoji(textContent),
    ).toBe(false);

    expect(
      BANNED_NAMES.test(
        textContent,
      ),
    ).toBe(false);

    const externalLinks =
      Array.from(
        container.querySelectorAll(
          'a[href]',
        ),
      )
        .map((a) =>
          a.getAttribute('href'),
        )
        .filter(
          (
            href,
          ): href is string =>
            Boolean(
              href &&
              href.startsWith(
                'https://',
              ),
            ),
        );

    /*
     * Evidence should continue exposing
     * real external references.
     *
     * We deliberately do NOT hardcode
     * every exact article URL here because
     * the Evidence page is maintained as
     * research changes and sources are
     * corrected or replaced.
     */
    expect(
      externalLinks.length,
    ).toBeGreaterThanOrEqual(8);

    externalLinks.forEach(
      (url) => {
        expect(
          url.startsWith(
            'https://',
          ),
        ).toBe(true);
      },
    );
  });
});