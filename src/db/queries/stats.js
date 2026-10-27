import { query } from '../pool.js';

export async function logSearch(userId, queryText, resultsCount) {
  const sql = `
    INSERT INTO search_logs (user_id, query, results_count)
    VALUES ($1, $2, $3);
  `;
  try {
    await query(sql, [userId, queryText.trim(), resultsCount]);
  } catch (e) {
    // Non-critical background analytics error
    console.error('[STATS] logSearch error:', e.message);
  }
}

export async function recordSectionClick(sectionKey) {
  const sql = `
    INSERT INTO section_analytics (section_key, clicks_count, last_clicked_at)
    VALUES ($1, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (section_key) DO UPDATE SET
      clicks_count = section_analytics.clicks_count + 1,
      last_clicked_at = CURRENT_TIMESTAMP;
  `;
  try {
    await query(sql, [sectionKey]);
  } catch (e) {
    console.error('[STATS] recordSectionClick error:', e.message);
  }
}

export async function getDashboardStats() {
  const usersRes = await query('SELECT COUNT(*) as total_users FROM users;');
  const activeUsersRes = await query(
    'SELECT COUNT(*) as active_users FROM users WHERE last_active_at >= NOW() - INTERVAL \'7 days\';'
  );
  const searchCountRes = await query('SELECT COUNT(*) as total_searches FROM search_logs;');
  const pendingFeedbackRes = await query('SELECT COUNT(*) as count FROM feedback WHERE status = \'new\';');
  const pendingUnansweredRes = await query('SELECT COUNT(*) as count FROM unanswered_questions WHERE status = \'pending\';');
  
  const popularSearchesRes = await query(`
    SELECT query, COUNT(*) as count 
    FROM search_logs 
    GROUP BY query 
    ORDER BY count DESC 
    LIMIT 5;
  `);

  const popularSectionsRes = await query(`
    SELECT section_key, clicks_count 
    FROM section_analytics 
    ORDER BY clicks_count DESC 
    LIMIT 5;
  `);

  return {
    totalUsers: parseInt(usersRes.rows[0]?.total_users || 0, 10),
    activeUsers7Days: parseInt(activeUsersRes.rows[0]?.active_users || 0, 10),
    totalSearches: parseInt(searchCountRes.rows[0]?.total_searches || 0, 10),
    pendingFeedback: parseInt(pendingFeedbackRes.rows[0]?.count || 0, 10),
    pendingUnanswered: parseInt(pendingUnansweredRes.rows[0]?.count || 0, 10),
    popularSearches: popularSearchesRes.rows,
    popularSections: popularSectionsRes.rows
  };
}
