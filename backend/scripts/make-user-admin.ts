#!/usr/bin/env ts-node

import { DataSource } from "typeorm";
import { User } from "../src/entities/user.entity";
import dataSource from "../src/database/data-source";
async function makeUserAdmin() {
  const targetEmail = process.argv[2];

  try {
    console.log("🔍 Connecting to database...");
    await dataSource.initialize();
    console.log("✅ Database connected");

    const userRepository = dataSource.getRepository(User);

    if (!targetEmail) {
      console.log("\n📋 All users in database:");
      const allUsers = await userRepository.find({
        select: ["id", "email", "role", "full_name", "status"],
      });

      if (allUsers.length === 0) {
        console.log("   No users found in database");
      } else {
        allUsers.forEach((u, index) => {
          const roleBadge =
            u.role === "admin" ? "👑" : u.role === "operator" ? "🏢" : "👤";
          const statusBadge = u.status === "active" ? "✅" : "❌";
          console.log(
            `   ${index + 1}. ${u.email} ${roleBadge} (${u.role || "no role"}) - ${u.full_name || "no name"} ${statusBadge} [${u.status}]`
          );
        });
      }

      console.log("\n❌ Usage: npx ts-node scripts/make-user-admin.ts <email>");
      console.log(
        "📝 Example: npx ts-node scripts/make-user-admin.ts admin@example.com"
      );
      process.exit(1);
    }

    // Find user by email
    const user = await userRepository.findOne({
      where: { email: targetEmail },
      relations: ["tenantProfile", "operatorProfile"],
    });

    if (!user) {
      console.log(`❌ User with email "${targetEmail}" not found`);
      console.log("\n📋 Available users:");

      const allUsers = await userRepository.find({
        select: ["id", "email", "role", "full_name", "status"],
      });

      allUsers.forEach((u, index) => {
        console.log(
          `  ${index + 1}. ${u.email} (${u.role || "no role"}) - ${u.full_name || "no name"} [${u.status}]`
        );
      });

      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.email}`);
    console.log(`📊 Current details:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Full Name: ${user.full_name || "Not set"}`);
    console.log(`   - Current Role: ${user.role || "null"}`);
    console.log(`   - Status: ${user.status}`);
    console.log(
      `   - Has Tenant Profile: ${user.tenantProfile ? "Yes" : "No"}`
    );
    console.log(
      `   - Has Operator Profile: ${user.operatorProfile ? "Yes" : "No"}`
    );

    // Update user role to admin
    user.role = "admin";
    user.status = "active";

    await userRepository.save(user);

    console.log(`\n✅ SUCCESS: User "${user.email}" is now an admin!`);
    console.log(`🔧 Updated details:`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Status: ${user.status}`);

    console.log(`\n🎯 Next steps:`);
    console.log(`   1. User should log out and log back in`);
    console.log(`   2. JWT token will include admin role`);
    console.log(`   3. Admin Panel button should appear`);
    console.log(`   4. Check debug panel in development mode`);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log("\n🔌 Database connection closed");
  }
}

makeUserAdmin();
