import { env } from '$env/dynamic/private';
import path from 'node:path';

/**
 * Get the path to the eval results database
 * Uses DATABASE_EVAL_PATH env var if set, otherwise defaults to data/evals.db
 */
export const get_eval_database_path = (): string => {
	const db_path =
		env.DATABASE_EVAL_PATH ||
		path.join(process.cwd(), 'data', 'evals.db');
	return db_path;
};
