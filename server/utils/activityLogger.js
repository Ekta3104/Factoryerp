/**
 * Helper to log activities into the activity_logs table.
 * To be used within an existing database client transaction or standalone pool.
 * 
 * @param {Object} client - pg Pool or Client instance (can be a transaction client)
 * @param {string} userId - UUID of the user performing the action
 * @param {string} action - 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} entityType - Name of the entity (e.g., 'VEHICLE_INWARD')
 * @param {string} entityId - UUID of the entity affected
 * @param {Object} details - JSON object with additional details
 */
export const logActivity = async (client, userId, action, entityType, entityId, details = {}) => {
  const query = `
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [userId, action, entityType, entityId, JSON.stringify(details)]);
};
