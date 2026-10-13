import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import demo from '../content/books/demo-garden.json';
import type { Book } from '../src/types';
import { initialState, loadState, saveState } from '../src/db';
import { ReadingProvider } from '../src/components/ReadingProvider';
import Reader from '../src/components/Reader';
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
  await screen.findByLabelText('Text size · 30px');
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
  fireEvent.click(screen.getByRole('link', { name: new RegExp(second.id) }));
  await waitFor(() => expect(bookmark).toHaveAttribute('aria-pressed', 'true'));
  expect(window.location.hash).toBe(`#${book.chapters[0].id}/${second.id}`);
});
