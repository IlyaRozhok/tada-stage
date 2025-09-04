import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupUserProfiles1756000000004 implements MigrationInterface {
  name = "CleanupUserProfiles1756000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🧹 Starting user profile cleanup migration...");

    // Get all users with their profiles
    const users = await queryRunner.query(`
      SELECT 
        u.id,
        u.role,
        u.email,
        tp.id as tenant_profile_id,
        op.id as operator_profile_id,
        p.id as preferences_id
      FROM users u
      LEFT JOIN tenant_profiles tp ON u.id = tp."userId"
      LEFT JOIN operator_profiles op ON u.id = op."userId"
      LEFT JOIN preferences p ON u.id = p.user_id
      ORDER BY u.created_at
    `);

    console.log(`📊 Found ${users.length} users to process`);

    let cleanedUsers = 0;
    let removedTenantProfiles = 0;
    let removedOperatorProfiles = 0;
    let removedPreferences = 0;
    let createdTenantProfiles = 0;
    let createdOperatorProfiles = 0;
    let createdPreferences = 0;

    for (const user of users) {
      console.log(`🔍 Processing user: ${user.email} (${user.role})`);

      if (user.role === "tenant") {
        // Tenant should have tenant profile and preferences, but no operator profile
        if (user.operator_profile_id) {
          console.log(`  ❌ Removing operator profile for tenant`);
          await queryRunner.query(
            `DELETE FROM operator_profiles WHERE id = $1`,
            [user.operator_profile_id]
          );
          removedOperatorProfiles++;
        }

        if (!user.tenant_profile_id) {
          console.log(`  ✅ Creating missing tenant profile`);
          await queryRunner.query(
            `INSERT INTO tenant_profiles ("userId", "full_name", "created_at", "updated_at") 
             VALUES ($1, $2, NOW(), NOW())`,
            [user.id, null]
          );
          createdTenantProfiles++;
        }

        if (!user.preferences_id) {
          console.log(`  ✅ Creating missing preferences`);
          await queryRunner.query(
            `INSERT INTO preferences (user_id, "created_at", "updated_at") 
             VALUES ($1, NOW(), NOW())`,
            [user.id]
          );
          createdPreferences++;
        }
      } else if (user.role === "operator") {
        // Operator should have operator profile, but no tenant profile or preferences
        if (user.tenant_profile_id) {
          console.log(`  ❌ Removing tenant profile for operator`);
          await queryRunner.query(`DELETE FROM tenant_profiles WHERE id = $1`, [
            user.tenant_profile_id,
          ]);
          removedTenantProfiles++;
        }

        if (user.preferences_id) {
          console.log(`  ❌ Removing preferences for operator`);
          await queryRunner.query(`DELETE FROM preferences WHERE id = $1`, [
            user.preferences_id,
          ]);
          removedPreferences++;
        }

        if (!user.operator_profile_id) {
          console.log(`  ✅ Creating missing operator profile`);
          await queryRunner.query(
            `INSERT INTO operator_profiles ("userId", "full_name", "created_at", "updated_at") 
             VALUES ($1, $2, NOW(), NOW())`,
            [user.id, null]
          );
          createdOperatorProfiles++;
        }
      } else if (user.role === "admin") {
        // Admin should have no profiles or preferences
        if (user.tenant_profile_id) {
          console.log(`  ❌ Removing tenant profile for admin`);
          await queryRunner.query(`DELETE FROM tenant_profiles WHERE id = $1`, [
            user.tenant_profile_id,
          ]);
          removedTenantProfiles++;
        }

        if (user.operator_profile_id) {
          console.log(`  ❌ Removing operator profile for admin`);
          await queryRunner.query(
            `DELETE FROM operator_profiles WHERE id = $1`,
            [user.operator_profile_id]
          );
          removedOperatorProfiles++;
        }

        if (user.preferences_id) {
          console.log(`  ❌ Removing preferences for admin`);
          await queryRunner.query(`DELETE FROM preferences WHERE id = $1`, [
            user.preferences_id,
          ]);
          removedPreferences++;
        }
      } else {
        // Handle users with null role - set them as tenants by default
        console.log(`  ⚠️ User has null role, setting as tenant`);
        await queryRunner.query(
          `UPDATE users SET role = 'tenant' WHERE id = $1`,
          [user.id]
        );

        if (!user.tenant_profile_id) {
          await queryRunner.query(
            `INSERT INTO tenant_profiles ("userId", "full_name", "created_at", "updated_at") 
             VALUES ($1, $2, NOW(), NOW())`,
            [user.id, null]
          );
          createdTenantProfiles++;
        }

        if (!user.preferences_id) {
          await queryRunner.query(
            `INSERT INTO preferences (user_id, "created_at", "updated_at") 
             VALUES ($1, NOW(), NOW())`,
            [user.id]
          );
          createdPreferences++;
        }
      }

      cleanedUsers++;
    }

    console.log("✅ User profile cleanup completed:");
    console.log(`  📊 Processed users: ${cleanedUsers}`);
    console.log(`  🗑️ Removed tenant profiles: ${removedTenantProfiles}`);
    console.log(`  🗑️ Removed operator profiles: ${removedOperatorProfiles}`);
    console.log(`  🗑️ Removed preferences: ${removedPreferences}`);
    console.log(`  ➕ Created tenant profiles: ${createdTenantProfiles}`);
    console.log(`  ➕ Created operator profiles: ${createdOperatorProfiles}`);
    console.log(`  ➕ Created preferences: ${createdPreferences}`);

    // Verify cleanup by checking for any remaining inconsistencies
    const inconsistencies = await queryRunner.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        CASE 
          WHEN u.role = 'tenant' AND tp.id IS NULL THEN 'Missing tenant profile'
          WHEN u.role = 'tenant' AND p.id IS NULL THEN 'Missing preferences'
          WHEN u.role = 'tenant' AND op.id IS NOT NULL THEN 'Has operator profile'
          WHEN u.role = 'operator' AND op.id IS NULL THEN 'Missing operator profile'
          WHEN u.role = 'operator' AND tp.id IS NOT NULL THEN 'Has tenant profile'
          WHEN u.role = 'operator' AND p.id IS NOT NULL THEN 'Has preferences'
          WHEN u.role = 'admin' AND (tp.id IS NOT NULL OR op.id IS NOT NULL OR p.id IS NOT NULL) THEN 'Has profiles'
          ELSE NULL
        END as issue
      FROM users u
      LEFT JOIN tenant_profiles tp ON u.id = tp."userId"
      LEFT JOIN operator_profiles op ON u.id = op."userId"
      LEFT JOIN preferences p ON u.id = p.user_id
      WHERE 
        (u.role = 'tenant' AND (tp.id IS NULL OR p.id IS NULL OR op.id IS NOT NULL)) OR
        (u.role = 'operator' AND (op.id IS NULL OR tp.id IS NOT NULL OR p.id IS NOT NULL)) OR
        (u.role = 'admin' AND (tp.id IS NOT NULL OR op.id IS NOT NULL OR p.id IS NOT NULL))
    `);

    if (inconsistencies.length > 0) {
      console.log("⚠️ Found remaining inconsistencies:");
      inconsistencies.forEach((inc: any) => {
        console.log(`  - ${inc.email}: ${inc.issue}`);
      });
    } else {
      console.log("✅ No remaining inconsistencies found!");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("⚠️ Cannot reverse user profile cleanup migration");
    console.log(
      "This migration cleaned up data inconsistencies and cannot be safely reversed"
    );
  }
}
