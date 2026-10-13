import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '../src/components/FeedbackForm';
import { buildWhatsAppUrl, feedbackCategories, validWhatsAppNumber } from '../src/lib/feedback';
import { books, summary } from '../src/lib/catalog';
const number = '917381699797';
beforeEach(() => { history.replaceState(history.state, '', '/feedback/'); });
describe('explicit WhatsApp feedback preparation', () => {
  it('encodes the chosen category and source reference without sending anything', () => {
    for (const category of feedbackCategories) {
      const url = new URL(buildWhatsAppUrl(number, { category: category.id, message: ' ଓଡ଼ିଆ & #feedback ', book: 'Sample', reference: 'morning / 1' }));
      expect(url.origin).toBe('https://wa.me'); expect(url.pathname).toBe(`/${number}`);
      expect(url.searchParams.get('text')).toContain(`Category: ${category.english}`);
      expect(url.searchParams.get('text')).toContain('Message: ଓଡ଼ିଆ & #feedback');
      expect(url.searchParams.get('text')).toContain('Chapter / page: morning / 1');
    }
    for (const invalid of ['', '+919876543210', '0123456789', '91 9876543210', 'javascript:alert(1)']) {
      expect(validWhatsAppNumber(invalid)).toBe(false);
      expect(() => buildWhatsAppUrl(invalid, { category: 'other', message: 'test' })).toThrow();
    }
    expect(() => buildWhatsAppUrl(number, { category: 'unknown', message: 'test' })).toThrow();
    expect(() => buildWhatsAppUrl(number, { category: 'other', message: ' ' })).toThrow();
  });
  it('requires preparation before exposing an external link and invalidates stale previews', async () => {
    const user = userEvent.setup(); const open = vi.spyOn(window, 'open');
    render(<FeedbackForm books={books.map(summary)} number={number}/>);
    expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Category/), 'correction');
    await user.type(screen.getByLabelText(/Feedback message/), 'Please check this stanza.');
    await user.click(screen.getByRole('button', { name: /Prepare feedback/ }));
    expect(open).not.toHaveBeenCalled();
    const link = screen.getByRole('link', { name: /Open WhatsApp/ });
    expect(link).toHaveAttribute('target', '_blank'); expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(new URL(link.getAttribute('href')!).searchParams.get('text')).toContain('Please check this stanza.');
    await user.type(screen.getByLabelText(/Feedback message/), ' Changed.');
    expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).not.toBeInTheDocument(); open.mockRestore();
  });
  it('disables unconfigured contacts and rejects empty preparation', () => {
    const { unmount } = render(<FeedbackForm books={[]} number=""/>);
    expect(screen.getByRole('button', { name: /Prepare feedback/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('not configured'); unmount();
    render(<FeedbackForm books={[]} number={number}/>);
    fireEvent.submit(screen.getByRole('button', { name: /Prepare feedback/ }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Category and message are required');
  });
});
it('prepares the exact configured contact with multiline Odia, punctuation and optional references', () => {
  const message = 'ପ୍ରଥମ ଧାଡ଼ି।\nଦ୍ୱିତୀୟ ଧାଡ଼ି & # + ? "quote"';
  const url = new URL(buildWhatsAppUrl(number, { category: 'general', message, book: 'ଅକ୍ଷରର ବଗିଚା', reference: 'ସକାଳ / morning-1' }));
  expect(url.pathname).toBe('/917381699797');
  expect(url.searchParams.get('text')).toBe(`Aksharadhara Feedback\nCategory: General feedback\nBook: ଅକ୍ଷରର ବଗିଚା\nChapter / page: ସକାଳ / morning-1\nMessage: ${message}`);
  expect(feedbackCategories.map(c => c.id)).toEqual(expect.arrayContaining(['general', 'author-request', 'contribution', 'correction']));
});

it('preselects only valid contribution categories from static share links', () => {
  history.replaceState(history.state, '', '/feedback/?category=contribution');
  const { unmount } = render(<FeedbackForm books={[]} number={number}/>);
  expect(screen.getByLabelText(/Category/)).toHaveValue('contribution');
  unmount(); history.replaceState(history.state, '', '/feedback/?category=invalid');
  render(<FeedbackForm books={[]} number={number}/>);
  expect(screen.getByLabelText(/Category/)).toHaveValue('');
  expect(screen.queryByRole('link', { name: /Open WhatsApp/ })).not.toBeInTheDocument();
});
