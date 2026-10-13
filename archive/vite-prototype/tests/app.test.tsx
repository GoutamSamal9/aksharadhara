import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App';
import { initialState, loadState, saveState } from '../src/db';
import { searchBooks } from '../src/catalog';
vi.mock('../src/db', async importOriginal => { const original = await importOriginal<typeof import('../src/db')>(); return { ...original, loadState: vi.fn(), saveState: vi.fn() }; });
beforeEach(() => { vi.mocked(loadState).mockResolvedValue(structuredClone(initialState)); vi.mocked(saveState).mockResolvedValue(undefined); });
function app(path='/') { return render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>); }
describe('library and reader', () => {
  it('searches Odia and curated aliases', () => { expect(searchBooks('ବଗିଚା')).toHaveLength(1); expect(searchBooks(' AKSHARA ')).toHaveLength(1); expect(searchBooks('missing')).toHaveLength(0); });
  it('navigates from homepage into the book and reader', async () => { const user=userEvent.setup(); app(); await user.click(screen.getByRole('link',{name:/Explore library/})); await user.click(screen.getByRole('link',{name:/book details/})); await user.click(screen.getByRole('link',{name:/Read sample/})); expect(await screen.findByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeInTheDocument(); });
  it('preserves each verse line and stanza', async () => { app('/read/demo-garden/morning'); await screen.findByRole('heading',{name:'ସକାଳ · ନମୁନା'}); expect(document.querySelectorAll('.stanza')).toHaveLength(4); expect(document.querySelectorAll('.verse-line')).toHaveLength(8); expect(screen.getByText('ଏହା ଏକ ନମୁନା ପାଠ୍ୟ।').closest('.verse-line')).toBeInTheDocument(); });
  it('changes settings and saves stable bookmarks', async () => { const user=userEvent.setup(); app('/read/demo-garden/morning'); await screen.findByRole('heading',{name:'ସକାଳ · ନମୁନା'}); await user.click(screen.getByRole('button',{name:/Settings/})); await user.click(screen.getByRole('button',{name:'dark'})); await user.click(screen.getByRole('button',{name:/Bookmark/})); await waitFor(() => expect(saveState).toHaveBeenLastCalledWith(expect.objectContaining({ preferences: expect.objectContaining({theme:'dark'}), bookmarks: [expect.objectContaining({bookId:'demo-garden',chapterId:'morning',blockId:'morning-1'})] }))); expect(screen.getByRole('button',{name:/Bookmark/})).toHaveAttribute('aria-pressed','true'); });
  it('restores persisted chapter and preferences', async () => { vi.mocked(loadState).mockResolvedValue({...initialState,preferences:{...initialState.preferences,theme:'dark'},progress:{'demo-garden':{bookId:'demo-garden',chapterId:'evening',blockId:'evening-2',updatedAt:1}}}); app('/read/demo-garden'); expect(await screen.findByRole('heading',{name:'ସନ୍ଧ୍ୟା · ନମୁନା'})).toBeInTheDocument(); expect(document.querySelector('.theme-dark')).toBeInTheDocument(); });
  it('reports storage failure while keeping reader usable', async () => { vi.mocked(saveState).mockRejectedValue(new Error('quota')); app('/read/demo-garden/morning'); expect(await screen.findByRole('alert')).toHaveTextContent('Could not save'); expect(screen.getByRole('heading',{name:'ସକାଳ · ନମୁନା'})).toBeInTheDocument(); });
  it('does not silently replace an invalid chapter', async () => { app('/read/demo-garden/missing'); expect(await screen.findByRole('heading',{name:'Page not found'})).toBeInTheDocument(); });
});
