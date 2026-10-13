import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import demo from '../content/books/demo-garden.json';
import type { Book } from '../src/types';
import { initialState, loadState, saveState } from '../src/db';
import { ReadingProvider } from '../src/components/ReadingProvider';
import Reader from '../src/components/Reader';
import { ContinueReading, LocalBookmarks } from '../src/components/LocalReading';
import { summary } from '../src/lib/catalog';
vi.mock('../src/db', async importOriginal => {
  const original = await importOriginal<typeof import('../src/db')>();
  return { ...original, loadState: vi.fn(), saveState: vi.fn(async () => undefined), listOfflineBooks: vi.fn(async () => []) };
});
const book = demo as Book;
function open() { return render(<ReadingProvider><Reader book={book}/></ReadingProvider>); }
beforeEach(() => {
  vi.clearAllMocks(); window.history.replaceState(null, '', '/read/demo-garden/');
  vi.mocked(loadState).mockResolvedValue(structuredClone(initialState));
  Element.prototype.scrollIntoView = vi.fn();
});
it('preserves every original Odia verse line and stanza without imported markup', async () => {
  const { container } = open();
  await waitFor(() => expect(screen.getByRole('button', { name: /Bookmark/ })).toBeEnabled());
  expect([...container.querySelectorAll('.verse-line')].map(node => node.textContent)).toEqual(book.chapters[0].blocks.flatMap(block => block.lines));
  expect(container.querySelectorAll('.stanza')).toHaveLength(book.chapters[0].blocks.length);
  expect(container.querySelector('[data-reader-book]')).toHaveAttribute('data-reader-book', book.slug);
});
it('restores an existing prototype chapter/stanza position and allows starting over', async () => {
  const chapter = book.chapters[1], block = chapter.blocks[1];
  vi.mocked(loadState).mockResolvedValue({ ...structuredClone(initialState), progress: { [book.id]: { bookId: book.id, chapterId: chapter.id, blockId: block.id, updatedAt: 1 } } });
  open();
  await screen.findByRole('heading', { level: 1, name: chapter.title });
  await waitFor(() => expect(saveState).toHaveBeenLastCalledWith(expect.objectContaining({ progress: expect.objectContaining({ [book.id]: expect.objectContaining({ chapterId: chapter.id, blockId: block.id }) }) })));
  window.history.replaceState(null, '', '#start'); fireEvent(window, new HashChangeEvent('hashchange'));
  await screen.findByRole('heading', { level: 1, name: book.chapters[0].title });
});
it('uses chapter hashes and ignores arrow navigation while adjusting a range', async () => {
  open();
  await waitFor(() => expect(screen.getByRole('button', { name: /Next chapter/ })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: /Settings/ }));
  const size = screen.getByLabelText(/Text size/);
  fireEvent.change(size, { target: { value: '30' } });
  await screen.findByLabelText(/Text size.*30px/);
  fireEvent.keyDown(size, { key: 'ArrowRight' });
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(book.chapters[0].title);
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  await screen.findByRole('heading', { level: 1, name: book.chapters[1].title });
  expect(window.location.hash).toBe(`#${book.chapters[1].id}/${book.chapters[1].blocks[0].id}`);
});
it('saves and returns to a same-chapter bookmark after selecting another stanza', async () => {
  open();
  const bookmark = screen.getByRole('button', { name: /Bookmark/ });
  await waitFor(() => expect(bookmark).toBeEnabled());
  // Restoration finishes on the animation frame before the reader can move its position.
  await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  const second = book.chapters[0].blocks[1];
  fireEvent.focus(document.getElementById(second.id)!);
  fireEvent.click(bookmark); expect(bookmark).toHaveAttribute('aria-pressed', 'true');
  const first = book.chapters[0].blocks[0]; fireEvent.focus(document.getElementById(first.id)!);
  fireEvent.click(screen.getByRole('button', { name: /Contents/ }));
  fireEvent.click(screen.getByRole('link', { name: /ପଦ୍ୟ 2/ }));
  await waitFor(() => expect(bookmark).toHaveAttribute('aria-pressed', 'true'));
  expect(window.location.hash).toBe(`#${book.chapters[0].id}/${second.id}`);
});

const savedPlace = () => ({ ...structuredClone(initialState), progress: { [book.id]: { bookId: book.id, chapterId: book.chapters[1].id, blockId: book.chapters[1].blocks[1].id, updatedAt: 123 } } });
it.each(['#unknown-chapter', `#${book.chapters[0].id}/missing-stanza`, '#%E0%A4%A', `#${book.chapters[0].id}/${book.chapters[0].blocks[0].id}/extra`])('preserves progress and blocks reader actions for invalid fragment %s', async fragment => {
  const saved = savedPlace(); vi.mocked(loadState).mockResolvedValue(saved);
  window.history.replaceState(null, '', fragment); const { container } = open();
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: /Bookmark/ })).toBeDisabled();
  expect(container.querySelector('.stanza')).toBeNull();
  fireEvent.scroll(window); fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  expect(window.location.hash).toBe(fragment);
  await waitFor(() => expect(saveState).toHaveBeenCalled());
  for (const [state] of vi.mocked(saveState).mock.calls) expect(state.progress).toEqual(saved.progress);
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
});
it('recovers an invalid fragment from the contents menu only after a chapter choice', async () => {
  const saved = savedPlace(); vi.mocked(loadState).mockResolvedValue(saved);
  window.history.replaceState(null, '', '#unknown'); open();
  const alert = await screen.findByRole('alert');
  fireEvent.click(within(alert).getByRole('button', { name: /Contents/ }));
  for (const [state] of vi.mocked(saveState).mock.calls) expect(state.progress).toEqual(saved.progress);
  fireEvent.click(screen.getByRole('link', { name: new RegExp(book.chapters[0].title) }));
  await screen.findByRole('heading', { level: 1, name: book.chapters[0].title });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(window.location.hash).toBe(`#${book.chapters[0].id}/${book.chapters[0].blocks[0].id}`);
});
it('recovers invalid links by explicitly resuming the preserved position', async () => {
  const saved = savedPlace(); vi.mocked(loadState).mockResolvedValue(saved);
  window.history.replaceState(null, '', '#unknown'); open();
  fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: /Resume/ }));
  await screen.findByRole('heading', { level: 1, name: book.chapters[1].title });
  await waitFor(() => expect(saveState).toHaveBeenLastCalledWith(expect.objectContaining({ progress: expect.objectContaining({ [book.id]: expect.objectContaining({ blockId: book.chapters[1].blocks[1].id }) }) })));
});

it('recovers invalid links by explicitly choosing the beginning', async () => {
  vi.mocked(loadState).mockResolvedValue(savedPlace());
  window.history.replaceState(null, '', '#unknown'); open();
  fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: /Start/ }));
  await screen.findByRole('heading', { level: 1, name: book.chapters[0].title });
  expect(window.location.hash).toBe('#start');
  expect(screen.getByRole('button', { name: /Bookmark/ })).toBeEnabled();
});

it('uses chapter titles and stanza numbers for local places without downloading full text', async () => {
  const saved = savedPlace(); const position = saved.progress[book.id];
  vi.mocked(loadState).mockResolvedValue({ ...saved, bookmarks: [{ ...position, key: `${book.id}/${position.chapterId}/${position.blockId}` }] });
  const metadata = summary(book);
  const { container } = render(<ReadingProvider><ContinueReading books={[metadata]}/><LocalBookmarks books={[metadata]}/></ReadingProvider>);
  const expected = `${book.chapters[1].title} · ପଦ୍ୟ 2`;
  await screen.findByText(expected);
  expect(container.querySelector('.continue-row p')).toHaveTextContent(expected);
  expect(container.querySelector('.bookmark-row small')).toHaveTextContent(expected);
  expect(container.textContent).not.toContain(position.blockId);
  expect(metadata).not.toHaveProperty('chapters');
});
