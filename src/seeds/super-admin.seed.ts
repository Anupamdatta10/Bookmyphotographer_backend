import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Admin, AdminSchema, AdminType } from '../schemas/admin.schema';

const ADMIN_NAME = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin';
const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/book-my-photographer';

async function seedSuperAdmin(): Promise<void> {
  if (!ADMIN_EMAIL) {
    throw new Error('SUPERADMIN_EMAIL is required');
  }
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error('SUPERADMIN_PASSWORD is required and must be at least 8 characters');
  }

  await mongoose.connect(MONGODB_URI);

  const AdminModel =
    mongoose.models.Admin ||
    mongoose.model<Admin>('Admin', AdminSchema);

  const existingAdmin = await AdminModel.findOne({ email: ADMIN_EMAIL }).exec();

  if (existingAdmin) {
    await AdminModel.updateOne(
      { _id: existingAdmin._id },
      {
        $set: { name: ADMIN_NAME, type: AdminType.SUPERADMIN },
        $unset: { deletedAt: 1 },
      },
    ).exec();
    console.log(`SUPERADMIN already exists: ${ADMIN_EMAIL}`);
    return;
  }

  await AdminModel.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    type: AdminType.SUPERADMIN,
  });
  console.log(`Created SUPERADMIN: ${ADMIN_EMAIL}`);
}

seedSuperAdmin()
  .catch((error: Error) => {
    console.error(`Failed to seed SUPERADMIN: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
