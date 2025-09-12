// Neon database helper used by Netlify functions (production/public path)
// Mirrors logic from dev-scripts/database.js but kept here so functions
// don't import from ignored dev-scripts directory.
// Provides helper methods for API key lifecycle, subscription updates,
// usage logging, and basic health checks.

const { neon } = require('@neondatabase/serverless');

let sql; // lazy-initialized Neon client

function init() {
	if (!sql) {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL environment variable is required');
		}
		sql = neon(process.env.DATABASE_URL);
	}
	return sql;
}

const db = {
	init,

	// User management (currently only via generate_api_key function)
	async createUser(email, name, company, useCase, description) {
		const sql = init();
		const result = await sql`
			INSERT INTO users (email, name, company, use_case, description)
			VALUES (${email}, ${name}, ${company}, ${useCase}, ${description})
			ON CONFLICT (email)
			DO UPDATE SET
				name = COALESCE(EXCLUDED.name, users.name),
				company = COALESCE(EXCLUDED.company, users.company),
				use_case = COALESCE(EXCLUDED.use_case, users.use_case),
				description = COALESCE(EXCLUDED.description, users.description),
				updated_at = NOW()
			RETURNING id
		`;
		return result[0];
	},

	async generateApiKey(userEmail, userName, userCompany, userUseCase, userDescription) {
		const sql = init();
		const result = await sql`
			SELECT generate_api_key(${userEmail}, ${userName}, ${userCompany}, ${userUseCase}, ${userDescription}) AS result
		`;
		return result[0].result;
	},

	async validateApiKey(apiKey) {
		const sql = init();
		const result = await sql`
			SELECT validate_api_key_enhanced(${apiKey}) AS result
		`;
		return result[0].result;
	},

	async updateApiKeyLimits(apiKey, limits) {
		const sql = init();
		const result = await sql`
			SELECT update_api_key_limits(
				${apiKey},
				${limits.tier},
				${limits.daily_limit},
				${limits.monthly_limit},
				${limits.stripe_customer_id || null},
				${limits.stripe_subscription_id || null}
			) AS success
		`;
		return result[0].success;
	},

	async updateApiKeysByStripeCustomer(customerId, limits) {
		const sql = init();
		const result = await sql`
			SELECT update_api_keys_by_stripe_customer(
				${customerId},
				${limits.tier},
				${limits.daily_limit},
				${limits.monthly_limit},
				${limits.stripe_subscription_id || null}
			) AS updated_count
		`;
		return result[0].updated_count;
	},

	async suspendApiKeysByStripeCustomer(customerId) {
		const sql = init();
		const result = await sql`
			SELECT suspend_api_keys_by_stripe_customer(${customerId}) AS suspended_count
		`;
		return result[0].suspended_count;
	},

	async restoreApiKeysByStripeCustomer(customerId) {
		const sql = init();
		const result = await sql`
			SELECT restore_api_keys_by_stripe_customer(${customerId}) AS restored_count
		`;
		return result[0].restored_count;
	},

	async logApiUsage(apiKey, endpoint, parameters, responseTime, statusCode, ipAddress, userAgent) {
		const sql = init();
		try {
			await sql`
				INSERT INTO api_usage (api_key, endpoint, parameters, response_time_ms, status_code, ip_address, user_agent)
				VALUES (${apiKey}, ${endpoint}, ${JSON.stringify(parameters)}, ${responseTime}, ${statusCode}, ${ipAddress}, ${userAgent})
			`;
		} catch (err) {
			console.error('Error logging API usage:', err.message);
		}
	},

	async getUserApiKeys(userEmail) {
		const sql = init();
		const result = await sql`
			SELECT ak.key_preview, ak.tier, ak.requests_remaining, ak.daily_limit,
						 ak.requests_total, ak.last_request_at, ak.created_at, ak.is_active,
						 ak.monthly_limit, ak.monthly_usage, ak.is_suspended
			FROM api_keys ak
			JOIN users u ON ak.user_id = u.id
			WHERE u.email = ${userEmail}
			ORDER BY ak.created_at DESC
		`;
		return result;
	},

	async healthCheck() {
		const sql = init();
		const result = await sql`SELECT NOW() as timestamp, 'healthy' as status`;
		return result[0];
	}
};

module.exports = db;
