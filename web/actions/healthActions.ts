'use server'

import { SentinelCore } from '@/services/SentinelCore';

export async function runSystemHealthCheck() {
    try {
        const result = await SentinelCore.auditDatabase();
        return result;
    } catch (error) {
        console.error('System Health Check Failed:', error);
        return {
            synced: false,
            missing: ['SYS_CHECK_FAILURE'],
            sql_patch: '-- System check failed.'
        };
    }
}

