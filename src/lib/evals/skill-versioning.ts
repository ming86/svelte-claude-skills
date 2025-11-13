/**
 * Skill versioning system using file content hashing
 * Tracks which version of skill files were tested to detect regressions
 */

import crypto from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export interface SkillFileInfo {
	path: string;
	hash: string;
	size: number;
}

export interface SkillVersion {
	skill_name: string;
	content_hash: string; // Combined hash of all files
	files: SkillFileInfo[];
	created_at: number;
}

/**
 * Generate SHA-256 hash for file content
 */
function hash_file_content(content: Buffer): string {
	return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively find all .md files in a directory
 */
function find_markdown_files(dir: string): string[] {
	const files: string[] = [];
	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const full_path = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...find_markdown_files(full_path));
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(full_path);
		}
	}

	return files;
}

/**
 * Hash all files in a skill directory
 */
export function hash_skill_files(skill_dir: string): SkillVersion {
	const skill_name = path.basename(skill_dir);
	const markdown_files = find_markdown_files(skill_dir);
	const files: SkillFileInfo[] = [];

	// Hash each file
	for (const file_path of markdown_files) {
		const content = readFileSync(file_path);
		const hash = hash_file_content(content);
		const stats = statSync(file_path);

		files.push({
			path: path.relative(process.cwd(), file_path),
			hash,
			size: stats.size,
		});
	}

	// Sort by path for consistent ordering
	files.sort((a, b) => a.path.localeCompare(b.path));

	// Create combined hash from all file hashes
	const combined = files.map((f) => f.hash).join('');
	const content_hash = crypto
		.createHash('sha256')
		.update(combined)
		.digest('hex');

	return {
		skill_name,
		content_hash,
		files,
		created_at: Date.now(),
	};
}

/**
 * Get versions for all skills
 */
export function get_all_skill_versions(): SkillVersion[] {
	const skills_dir = path.join(process.cwd(), '.claude', 'skills');
	const skill_names = [
		'svelte5-runes',
		'sveltekit-data-flow',
		'sveltekit-structure',
	];

	const versions: SkillVersion[] = [];

	for (const name of skill_names) {
		const skill_dir = path.join(skills_dir, name);
		try {
			const version = hash_skill_files(skill_dir);
			versions.push(version);
		} catch (error) {
			console.error(`Failed to hash skill ${name}:`, error);
		}
	}

	return versions;
}

/**
 * Compare two skill versions to detect changes
 */
export function compare_versions(
	old_version: SkillVersion,
	new_version: SkillVersion,
): {
	changed: boolean;
	added_files: string[];
	removed_files: string[];
	modified_files: string[];
} {
	const old_files = new Map(
		old_version.files.map((f) => [f.path, f.hash]),
	);
	const new_files = new Map(
		new_version.files.map((f) => [f.path, f.hash]),
	);

	const added_files: string[] = [];
	const removed_files: string[] = [];
	const modified_files: string[] = [];

	// Find added and modified files
	for (const [path, hash] of new_files.entries()) {
		if (!old_files.has(path)) {
			added_files.push(path);
		} else if (old_files.get(path) !== hash) {
			modified_files.push(path);
		}
	}

	// Find removed files
	for (const path of old_files.keys()) {
		if (!new_files.has(path)) {
			removed_files.push(path);
		}
	}

	const changed =
		added_files.length > 0 ||
		removed_files.length > 0 ||
		modified_files.length > 0;

	return {
		changed,
		added_files,
		removed_files,
		modified_files,
	};
}

/**
 * Get a short version identifier (first 8 chars of hash)
 */
export function get_short_version(version: SkillVersion): string {
	return version.content_hash.substring(0, 8);
}
