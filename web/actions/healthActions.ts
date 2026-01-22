'use server'

import { SchemaSentinel } from '@/services/SchemaSentinel';

export async function runSystemHealthCheck() {
    try {
        const { synced, missing } = await SchemaSentinel.checkSchemaSync();
        const sql_patch = SchemaSentinel.generateMigrationPatch(missing);

        return {
            synced,
            missing,
            sql_patch
        };
    } catch (error) {
        console.error('System Health Check Failed:', error);
        return {
            synced: false,
            missing: ['SYS_CHECK_FAILURE'],
            sql_patch: '-- System check failed.'
        };
    }
}

