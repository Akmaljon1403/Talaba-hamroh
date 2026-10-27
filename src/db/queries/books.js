import { query } from '../pool.js';

export async function searchBooks(searchTerm) {
  const term = `%${searchTerm.trim()}%`;
  const sql = `
    SELECT * FROM books
    WHERE title ILIKE $1 
       OR author ILIKE $1 
       OR subject_name ILIKE $1
    ORDER BY title ASC
    LIMIT 20;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}

export async function getBooksByCourse(course) {
  const sql = `
    SELECT * FROM books
    WHERE course = $1
    ORDER BY title ASC;
  `;
  const res = await query(sql, [course]);
  return res.rows;
}

export async function addBook({ title, author, subjectName, course, fileUrl, source, addedBy }) {
  const sql = `
    INSERT INTO books (title, author, subject_name, course, file_url, source, added_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const res = await query(sql, [
    title.trim(),
    author ? author.trim() : null,
    subjectName ? subjectName.trim() : null,
    course ? Number(course) : null,
    fileUrl.trim(),
    source || 'Rasmiy ARM (library.fjsti.uz)',
    addedBy || null
  ]);
  return res.rows[0];
}

export async function deleteBook(id) {
  const res = await query('DELETE FROM books WHERE id = $1 RETURNING *;', [id]);
  return res.rows[0] || null;
}
