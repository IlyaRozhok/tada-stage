import { DataSource } from "typeorm";
import { User } from "../src/entities/user.entity";
import { TenantProfile } from "../src/entities/tenant-profile.entity";
import { OperatorProfile } from "../src/entities/operator-profile.entity";
import dataSource from "../src/database/data-source";

async function updateUserRoles() {
  try {
    // Initialize database connection
    await dataSource.initialize();
    console.log("Database connected successfully");

    const userRepository = dataSource.getRepository(User);

    // Find user by email with profile relations
    const email = "vasya1@example.com"; // Change this to the actual user email
    const user = await userRepository.findOne({
      where: { email },
      relations: ["tenantProfile", "operatorProfile"],
    });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log(`Current user role:`, user.role);
    console.log(`Current user status:`, user.status);

    // Get user's full name from profile
    const fullName = user.full_name; // This uses the getter method

    // Update user role to admin
    user.role = "admin";
    user.status = "active";
    await userRepository.save(user);

    console.log(`User role updated successfully:`, user.role);
    console.log(`User ${fullName} (${user.email}) now has admin access`);
  } catch (error) {
    console.error("Error updating user role:", error);
  } finally {
    // Close database connection
    await dataSource.destroy();
    console.log("Database connection closed");
  }
}

// Run the script
updateUserRoles();
