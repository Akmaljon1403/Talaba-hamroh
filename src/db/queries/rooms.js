import { query } from '../pool.js';

export async function searchRooms(roomQuery) {
  const term = `%${roomQuery.trim()}%`;
  const sql = `
    SELECT r.*, b.name as base_name, b.head_name as base_head, b.contact_phone as base_phone
    FROM rooms r
    JOIN clinical_bases b ON b.id = r.clinical_base_id
    WHERE r.room_number ILIKE $1 
       OR r.department_name ILIKE $1 
       OR b.name ILIKE $1
    ORDER BY b.name, r.room_number ASC
    LIMIT 25;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}

export async function getRoomsByBase(baseId) {
  const sql = `
    SELECT * FROM rooms
    WHERE clinical_base_id = $1
    ORDER BY room_number ASC;
  `;
  const res = await query(sql, [baseId]);
  return res.rows;
}

export async function addRoom({ baseId, roomNumber, roomType, capacity, departmentName, notes }) {
  const sql = `
    INSERT INTO rooms (clinical_base_id, room_number, room_type, capacity, department_name, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const res = await query(sql, [
    baseId,
    roomNumber.trim(),
    roomType || 'Amaliy',
    capacity || 0,
    departmentName || null,
    notes || null
  ]);
  return res.rows[0];
}
