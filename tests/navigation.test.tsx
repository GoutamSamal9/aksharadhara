import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '../src/components/Navigation';
import { authors, authorBooks, isReadable } from '../src/lib/catalog';
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
const featured = authors.filter(a => a.verified && !a.demo).map(a => ({ ...a, bookCount: authorBooks(a.id).filter(isReadable).length }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
});
describe('author navigation', () => {
  it('opens the bounded desktop disclosure and restores focus with Escape', async () => {
    const user = userEvent.setup(); render(<Navigation authors={featured}/>);
    const nav = screen.getByRole('navigation', { name: /Main navigation/ });
    const button = within(nav).getByRole('button', { name: 'ସାହିତ୍ୟିକ' });
    button.focus(); await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById('featured-author-menu')!;
    expect(within(menu).getAllByText(/0 readable books/)).toHaveLength(3);
    expect(menu.querySelectorAll('.dropdown-author')).toHaveLength(Math.min(featured.length, 3));
    expect(within(menu).getByRole('link', { name: 'Search authors' })).toHaveAttribute('href', '/authors/#author-search');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false'); expect(button).toHaveFocus();
  });
  it('opens the mobile dialog and exposes keyboard-focusable native author disclosure', async () => {
    const user = userEvent.setup(); render(<Navigation authors={featured}/>);
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    trigger.focus(); await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true'); expect(document.body.style.overflow).toBe('hidden');
    const disclosure = dialog.querySelector('summary')!; disclosure.focus(); expect(disclosure).toHaveFocus();
    await user.click(disclosure); expect(disclosure.parentElement).toHaveAttribute('open');
    expect(within(dialog).getAllByText('0 readable books')).toHaveLength(3);
    fireEvent(dialog, new Event('cancel', { bubbles: true }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false'); expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
