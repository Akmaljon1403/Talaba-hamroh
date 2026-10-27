import { query } from '../pool.js';

export async function getAllClinicalBases() {
  const sql = `
    SELECT b.*,
           COUNT(r.id) as actual_rooms_count,
           COALESCE(SUM(r.capacity), 0) as total_student_capacity
    FROM clinical_bases b
    LEFT JOIN rooms r ON r.clinical_base_id = b.id
    GROUP BY b.id
    ORDER BY b.id ASC;
  `;
  const res = await query(sql);
  return res.rows;
}

export async function getClinicalBaseById(id) {
  const baseRes = await query('SELECT * FROM clinical_bases WHERE id = $1', [id]);
  if (baseRes.rowCount === 0) return null;
  const base = baseRes.rows[0];

  const roomsRes = await query(
    'SELECT * FROM rooms WHERE clinical_base_id = $1 ORDER BY room_number ASC',
    [id]
  );
  base.rooms = roomsRes.rows;
  return base;
}

export async function searchLocations(searchTerm) {
  const term = `%${searchTerm.trim()}%`;
  const sql = `
    SELECT b.*,
           COUNT(r.id) as actual_rooms_count
    FROM clinical_bases b
    LEFT JOIN rooms r ON r.clinical_base_id = b.id
    WHERE b.name ILIKE $1 
       OR b.department_name ILIKE $1 
       OR b.head_name ILIKE $1
    GROUP BY b.id
    ORDER BY b.name ASC
    LIMIT 15;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}
