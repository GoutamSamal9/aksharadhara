import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookBrowser, AuthorBrowser } from '../src/components/CatalogBrowser';
import { authors, books, summary } from '../src/lib/catalog';
const data = books.map(summary);
beforeEach(() => { window.history.replaceState({ __NA: true, tree: 'preserved' }, '', '/books/'); });
describe('shareable static catalog filters', () => {
  it('hydrates complete URL filters, keeps them on remount, and clears sort with all filters', async () => {
    window.history.replaceState(window.history.state, '', '/books/?q=sample&author=akshara-demo&genre=poetry&sort=desc#book-search');
    const first = render(<BookBrowser authors={authors} books={data}/>);
    expect(screen.getByRole('searchbox')).toHaveValue('sample');
    expect(screen.getByLabelText(/Author/)).toHaveValue('akshara-demo');
    expect(screen.getByLabelText(/Genre/)).toHaveValue('poetry'); expect(screen.getByLabelText(/Sort/)).toHaveValue('desc');
    first.unmount(); render(<BookBrowser authors={authors} books={data}/>);
    expect(screen.getByRole('searchbox')).toHaveValue('sample');
    await userEvent.click(screen.getByRole('button', { name: /Clear filters/ }));
    expect(location.search).toBe(''); expect(location.hash).toBe('#book-search');
    expect(screen.getByLabelText(/Sort/)).toHaveValue('asc');
    expect(history.state).toEqual({ __NA: true, tree: 'preserved' });
    expect(screen.getByRole('button', { name: /Clear filters/ })).toBeInTheDocument();
  });
  it('groups query typing in one history entry and applies Back/Forward URL state', async () => {
    const user = userEvent.setup(); render(<BookBrowser authors={authors} books={data}/>);
    const push = vi.spyOn(history, 'pushState'); const replace = vi.spyOn(history, 'replaceState');
    await user.type(screen.getByRole('searchbox'), 'garden');
    expect(push).toHaveBeenCalledTimes(1); expect(replace).toHaveBeenCalledTimes(5);
    expect(new URLSearchParams(location.search).get('q')).toBe('garden');
    await user.selectOptions(screen.getByLabelText(/Sort/), 'desc');
    const forwardUrl = location.href;
    await act(async () => { history.back(); await new Promise(resolve => setTimeout(resolve, 30)); });
    expect(screen.getByLabelText(/Sort/)).toHaveValue('asc'); expect(screen.getByRole('searchbox')).toHaveValue('garden');
    await act(async () => { history.forward(); await new Promise(resolve => setTimeout(resolve, 30)); });
    expect(location.href).toBe(forwardUrl); expect(screen.getByLabelText(/Sort/)).toHaveValue('desc');
    push.mockRestore(); replace.mockRestore();
  });
  it('validates unknown incoming filters and persists author alphabet state', async () => {
    history.replaceState(history.state, '', '/authors/?q=gangadhar&genre=invalid&letter=invalid');
    render(<AuthorBrowser authors={authors} books={data}/>);
    expect(screen.getByRole('searchbox')).toHaveValue('gangadhar'); expect(screen.getByLabelText(/Genre/)).toHaveValue('all');
    expect(screen.getByRole('button', { name: /All/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'ଗ' }));
    expect(new URLSearchParams(location.search).get('letter')).toBe('ଗ');
    expect(new URLSearchParams(location.search).has('genre')).toBe(false);
    act(() => { history.replaceState(history.state, '', '/authors/?q=bhima&genre=poetry'); fireEvent(window, new PopStateEvent('popstate')); });
    expect(screen.getByRole('searchbox')).toHaveValue('bhima'); expect(screen.getByLabelText(/Genre/)).toHaveValue('poetry');
  });
});
